import { Input, Output, EventEmitter, Component } from '@angular/core';
import { Answer } from './answer';

export enum QuestionType {
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  CHECKBOX = 'checkbox',
  TEXT = 'text',
  SELECT_ONE = 'select_one',
  SELECT_MULTIPLE = 'select_multiple',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'date_time',
  NOTE = 'note',
}

export interface Choice {
  _id?: string;
  name?: string;
  label?: string;
  image?: string;
}

export interface ScaleLabel {
  value: number;
  label: string;
  position: 'above' | 'below';
  align: 'auto' | 'left' | 'center' | 'right';
}

export interface QuestionPresentation {
  min: number;
  max: number;
  step?: number;
  labels: ScaleLabel[];
  valuePosition: 'above' | 'below' | 'hidden';
  labelFontSize: number;
  valueFontSize: number;
  labelBoxes: boolean;
  boldLabels: boolean;
  gradient: string;
  colorStart: string;
  colorEnd: string;
}

export interface Question {
  presentation?: QuestionPresentation;
  _id?: string;
  name: string;
  label: string;
  type: QuestionType;
  hint?: string;
  relevant?: string;
  calculation?: string;
  constraint?: string;
  constraintMessage?: string;
  min?: number;
  max?: number;
  required?: boolean;
  requiredMessage?: string;
  image?: string;
  appearance?: string;
  default?: string;
  choices?: Choice[];
}

@Component({
  template: '',
})
export class QuestionBaseComponent {
  @Input() public answer: Answer;
  @Input() public question: Question;
  @Output() public answerChange = new EventEmitter<Answer>();
}
