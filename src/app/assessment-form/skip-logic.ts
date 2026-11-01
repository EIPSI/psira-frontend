import { Answer } from './@types/answer';
import { Question, QuestionType } from './@types/question';

const CONDITIONALS = ['=', 'selected', '<', '>'] as const;

// tslint:disable-next-line:no-shadowed-variable
type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never;

type Conditional = ElementType<typeof CONDITIONALS>;

interface AnsweredQuestion {
  question: Question;
  answer: Answer;
}

interface ConditionInfo {
  condition: string;
  conditional: Conditional;
}

export class SkipLogicError extends Error {
  public isSkipLogicError = true;

  constructor(msg: string) {
    super('SkipLogic Error: ' + msg);
  }
}

export class SkipLogic {
  public static create(question: Question, questions: Question[], answers: Answer[]) {
    // check for question
    if (!question) throw new SkipLogicError('question not provided');

    // get skip logic, set visible if it has no skip logic
    const logic = question.relevant;
    if (!logic) return true;

    // prepare logic parts
    const [logicParts, conditionalParts] = SkipLogic.prepareLogicParts(logic);

    // find relevant questions
    const relevantQuestions: AnsweredQuestion[] = SkipLogic.extractQuestions(logic, questions).map((q) => ({
      question: q,
      answer: answers.find((a) => a.question === q._id),
    }));

    // set invisible if not all relevant questions are answered
    if (!relevantQuestions.every((rq) => rq.answer)) return false;

    // solve all parts
    const solvedParts = logicParts.map((part) => {
      // find conditional
      const conditional = SkipLogic.findConditional(part);
      if (!conditional) throw new SkipLogicError(`no supported conditional found in logic "${part}"`);

      // solve condition
      return SkipLogic.solveCondition({ condition: part, conditional }, relevantQuestions);
    });

    // combine solved parts via and/or ltr
    while (solvedParts.length > 1) {
      solvedParts.splice(
        0,
        2,
        conditionalParts.shift() === 'or' ? solvedParts[0] || solvedParts[1] : solvedParts[0] && solvedParts[1]
      );
    }

    // final result
    return solvedParts[0];
  }

  private static prepareLogicParts(logic: string): [string[], Array<'or' | 'and'>] {
    const logicParts: string[] = [];
    const conditionalParts: Array<'or' | 'and'> = [];

    // Only split standalone operators outside strings and selected(...).
    let quote = '';
    let depth = 0;
    let start = 0;
    for (let index = 0; index < logic.length; index++) {
      const character = logic[index];
      if (quote) { if (character === quote) quote = ''; continue; }
      if (character === '\'' || character === '"') { quote = character; continue; }
      if (character === '(') depth++;
      if (character === ')') depth--;
      const operator = depth === 0 ? logic.slice(index).match(/^\s+(and|or)\s+/i) : null;
      if (!operator) continue;
      logicParts.push(logic.slice(start, index).trim());
      conditionalParts.push(operator[1].toLowerCase() as 'and' | 'or');
      index += operator[0].length - 1;
      start = index + 1;
    }
    logic = logic.slice(start).trim();

    logicParts.push(logic);
    return [logicParts, conditionalParts];
  }

  private static solveCondition(
    { condition, conditional }: ConditionInfo,
    relevantQuestions: AnsweredQuestion[]
  ): boolean {
    switch (conditional) {
      case '=':
        // get parts and compare
        const [left, right] = condition.split(conditional).map((p) => p.trim());
        return SkipLogic.extractValue(left, relevantQuestions) === SkipLogic.extractValue(right, relevantQuestions);

      case '<':
      case '>':
        const [numericLeft, numericRight] = condition.split(conditional).map(part => SkipLogic.extractValue<number>(part.trim(), relevantQuestions));
        return conditional === '<' ? numericLeft < numericRight : numericLeft > numericRight;

      case 'selected':
        // get question and targetValue
        const inner = condition.match(/^selected\(([^)]+)\)$/)?.[1];
        const [question, targetValue] = inner.split(',').map((part) => part.trim());

        // find values and compare to target
        const values = SkipLogic.extractValue<any[]>(question, relevantQuestions);
        return values.includes(SkipLogic.extractValue(targetValue, relevantQuestions));
    }
  }

  private static extractValue<T>(item: string, relevantQuestions: AnsweredQuestion[]): T {
    // assign default value
    let value: any = item;

    // extract value from question, if question name is found
    const questionName = item.match(/\$\{([^}]+)\}/)?.[1];
    if (questionName) {
      const relevantQuestion = relevantQuestions.find((rq) => rq.question.name === questionName);
      value = SkipLogic.extractAnswerFromType(relevantQuestion.question.type, relevantQuestion.answer);
      if (value === null) throw new SkipLogicError(`answer not found for question "${relevantQuestion.question.name}"`);
    }

    // return prepared value
    return SkipLogic.prepareValue(value);
  }

  private static prepareValue(value: any): any {
    if (Array.isArray(value)) {
      return value.map((v) => SkipLogic.prepareValue(v));
    }

    // remove parentheses
    if (typeof value === 'string' && value.match(/^['"]{1}.+['"]{1}$/)) {
      value = value.substr(1, value.length - 2);
    }

    // convert to number if possible
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }

    return value;
  }

  private static extractAnswerFromType(type: QuestionType, answer: Answer) {
    switch (type) {
      case QuestionType.CHECKBOX:
        return answer.booleanValue;
      case QuestionType.DATE:
        return answer.dateValue;
      case QuestionType.DATETIME:
        return { date: answer.dateValue, time: answer.textValue };
      case QuestionType.DECIMAL:
      case QuestionType.INTEGER:
        return answer.numberValue;
      case QuestionType.SELECT_ONE:
      case QuestionType.TEXT:
      case QuestionType.TIME:
        return answer.textValue;
      case QuestionType.SELECT_MULTIPLE:
        return answer.multipleChoiceValue;
      default:
        return null;
    }
  }

  private static extractQuestions(logic: string, availableQuestions: Question[]): Question[] {
    return [...new Set([...logic.matchAll(/\$\{([^}]+)\}/gm)].map((match) => match[1]))].map((name) =>
      availableQuestions.find((q) => q.name === name)
    );
  }

  private static findConditional(logic: string): Conditional {
    return CONDITIONALS.map((c) => ({ conditional: c, index: logic.toLowerCase().indexOf(c.toLowerCase()) }))
      .filter((info) => info.index >= 0)
      .sort((prev, next) => prev.index - next.index)?.[0]?.conditional;
  }
}
