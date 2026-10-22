import { Directive, Input, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { fromUserDateInput, toUserDateInput } from '../../utils/system-settings.util';

@Directive({
  selector: 'nz-date-picker[nzShowTime], nz-date-picker[appUserDateTime], nz-range-picker[nzShowTime], nz-time-picker',
})
export class UserDateTimeDirective {
  @Input() nzShowTime: any = true;

  constructor(@Optional() @Self() control: NgControl) {
    const original = control?.valueAccessor;
    if (!original) return;
    const mapValue = (value: any, convert: (date: any) => Date): any => {
      if (!this.nzShowTime && this.nzShowTime !== '') return value;
      if (Array.isArray(value)) return value.map((date) => date ? convert(date) : date);
      return value ? convert(value) : value;
    };
    control.valueAccessor = {
      writeValue: (value) => original.writeValue(mapValue(value, toUserDateInput)),
      registerOnChange: (callback) => original.registerOnChange((value: any) => callback(mapValue(value, fromUserDateInput))),
      registerOnTouched: (callback) => original.registerOnTouched(callback),
      setDisabledState: (disabled) => original.setDisabledState?.(disabled),
    };
  }
}
