import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Field } from '@shared/components/form/@types/field';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-select-input',
  templateUrl: './select-input.component.html',
  styleUrls: ['./select-input.component.scss'],
})
export class SelectInputComponent implements OnInit, OnChanges {
  @Input() field: Field;
  @Input() inputMode = false;
  @Input() autoFill = false;
  @Input() inputModel: any;
  @Input() showLabel = true;
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
  inputGroup: FormGroup;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.initializeInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.inputGroup && changes.field) {
      this.inputGroup.controls[this.field.name]?.setValue(this.field.value, { emitEvent: false });
    }
  }

  initializeInput() {
    let control: FormControl | FormGroup;
    if (this.field.isRequired) {
      if (this.field.pattern) {
        control = new FormControl('', [Validators.required, Validators.pattern(this.field.pattern)]);
      } else if (this.field.maxLength) {
        control = new FormControl('', [Validators.required, Validators.maxLength(this.field.maxLength)]);
      } else if (this.field.minLength) {
        control = new FormControl('', [Validators.required, Validators.minLength(this.field.minLength)]);
      } else {
        control = new FormControl('', Validators.required);
      }
    } else {
      if (this.field.pattern) {
        control = new FormControl('', Validators.pattern(this.field.pattern));
      } else if (this.field.maxLength) {
        control = new FormControl('', Validators.maxLength(this.field.maxLength));
      } else if (this.field.minLength) {
        control = new FormControl('', Validators.minLength(this.field.minLength));
      } else {
        control = new FormControl();
      }
    }
    this.inputGroup = new FormGroup({ [this.field.name]: control });
    this.inputGroup.controls[this.field.name].setValue(this.field.value, { emitEvent: false });
  }

  inputIsValid(): boolean {
    this.field.isValid = this.inputGroup.valid;
    return this.field.isValid;
  }

  handleValueChange(input: any) {
    this.field.value = input;
    this.inputGroup.controls[this.field.name]?.setValue(input, { emitEvent: false });
    this.valueChange.emit(input);
  }

  getSelectedLabel(): string {
    if (this.field?.value === undefined || this.field?.value === null || this.field?.value === '') {
      return '-';
    }
    if (!this.field?.options?.length) {
      return this.field.value.toString();
    }
    const findLabel = (val: any) => {
      const option = this.field.options.find((opt: any) => opt.value === val);
      return option ? this.translate.instant(option.label) : val;
    };
    if (Array.isArray(this.field.value)) {
      return (this.field.value as any[]).map((val: any) => findLabel(val)).join(', ');
    }
    return findLabel(this.field.value);
  }
}
