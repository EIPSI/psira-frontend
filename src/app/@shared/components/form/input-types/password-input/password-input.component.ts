import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Field } from '@shared/components/form/@types/field';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-password-input',
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.scss'],
})
export class PasswordInputComponent implements OnInit, OnDestroy {
  @Input() field: Field;
  @Input() inputMode = false;
  @Input() autoFill = false;
  @Input() showLabel = true;
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
  inputGroup: FormGroup;
  passwordVisible = false;
  private valueChangesSubscription?: Subscription;

  constructor() {}

  ngOnInit(): void {
    this.initializeInput();
  }

  initializeInput() {
    this.valueChangesSubscription?.unsubscribe();
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
    this.valueChangesSubscription = this.inputGroup.controls[this.field.name].valueChanges.subscribe((value) => {
      if (this.field.value === value) return;
      this.field.value = value;
      this.valueChange.emit(value);
    });
  }

  ngOnDestroy(): void {
    this.valueChangesSubscription?.unsubscribe();
  }

  inputIsValid(): boolean {
    this.field.isValid = this.inputGroup.valid;
    return this.field.isValid;
  }

  handleValueChange(input: any) {
    const value = input.target.value;
    if (this.field.value === value) return;
    this.field.value = value;
    this.inputGroup.controls[this.field.name]?.setValue(value, { emitEvent: false });
    this.valueChange.emit(value);
  }

  get autocompleteValue(): string {
    return this.autoFill ? 'on' : 'new-password';
  }
}
