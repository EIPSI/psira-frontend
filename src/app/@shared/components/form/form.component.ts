import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Field } from './@types/field';
import { FormGroup } from '@angular/forms';
import { Form } from './@types/form';
import { FieldGroup } from './@types/field.group';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  @Input() form: Form;
  @Input() formData: any;
  @Input() isLoading = false;
  @Input() loadingMessage = '';
  @Input() inputMode = true;
  @Input() showCancelButton = true;
  @Input() showSubmitButton = true;
  @Input() showEditButton = true;
  @Input() uploadUrl: string;
  @Input() images: any[];
  @Input() layoutMode: 'grid' | 'definition' = 'grid';
  @Input() displayMode: 'grid' | 'definition-list' = 'grid';

  @Input()
  set resetForm(val: boolean) {
    if (val) {
      this.parseForm();
    }
  }

  get resetForm(): boolean {
    return this._resetForm;
  }

  @Input()
  set populateForm(val: boolean) {
    if (val) {
      this.parseForm();
    }
  }

  @Output() searchOptions: EventEmitter<any> = new EventEmitter<any>();
  @Output() fileUploaded: EventEmitter<any> = new EventEmitter<any>();
  @Output() submitForm: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() rowAdded: EventEmitter<any> = new EventEmitter<any>();
  @Output() rowRemoved: EventEmitter<any> = new EventEmitter<any>();
  @Output() formUpdate: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() inputModeChanged = new EventEmitter<boolean>()
  formGroup: FormGroup;
  private _resetForm = false;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {}

  get definitionLayout(): boolean {
    return this.layoutMode === 'definition' ||
      this.displayMode === 'definition-list' ||
      this.form?.layout === 'definition';
  }

  get definitionLabelStyle(): { [key: string]: string } {
    return this.form?.labelWidth ? { flex: `0 0 ${this.form.labelWidth}` } : {};
  }

  get definitionValueAlignClass(): string {
    return this.form?.valueAlign === 'right' ? 'definition-align-right' : 'definition-align-left';
  }

  fieldLabel(field: Field): string {
    return this.translate.instant(field.displayLabel || field.title || field.label || field.name || '');
  }

  displayFieldValue(field: Field): string {
    if (field.type === 'password') return field.value ? '*************' : '-';
    if (field.type === 'select' || field.type === 'radio') return this.optionLabel(field);
    if (field.type === 'checkBox') return this.optionLabel(field);
    if (Array.isArray(field.value)) return field.value.length ? field.value.join(', ') : '-';
    if (field.value === true) return this.translate.instant('core.yes');
    if (field.value === false) return this.translate.instant('core.no');
    return field.value !== undefined && field.value !== null && field.value !== '' ? String(field.value) : '-';
  }

  optionLabel(field: Field): string {
    if (!field.options?.length) return this.displayRawValue(field.value);
    const findLabel = (value: any) => {
      const label = field.options.find((option) => option.value === value)?.label || String(value);
      return this.translate.instant(label);
    };
    if (Array.isArray(field.value)) {
      const values = field.value as any[];
      return values.length ? values.map((value: any) => findLabel(value)).join(', ') : '-';
    }
    return field.value !== undefined && field.value !== null && field.value !== ''
      ? findLabel(field.value)
      : '-';
  }

  displayRawValue(value: any): string {
    if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
    if (value === true) return this.translate.instant('core.yes');
    if (value === false) return this.translate.instant('core.no');
    return value !== undefined && value !== null && value !== '' ? String(value) : '-';
  }

  public onCancel(): void {
    this.toggleEdit();
    this.cancel.emit();
  }

  toggleEdit() {
    this.inputMode = !this.inputMode;
    this.inputModeChanged.emit(this.inputMode)
  }

  isValidForm(form?: Form): boolean {
    let isValid = true;
    form.groups.map((group: FieldGroup) => {
      if (!group.hidden) {
        group.fields.map((field: Field) => {
          if (!field.hidden && field.type !== 'array') {
            isValid = field.isValid && isValid;
          }
        });
      }
    });
    return isValid;
  }

  parseArrays(field: Field): any[] {
    const items: any[] = [];
    for (const row of field.rows) {
      const rowData = {};
      for (const item of row) {
        if (item.type === 'array') {
          rowData[item.name] = this.parseArrays(item);
          continue;
        }
        rowData[item.name] = item.value;
      }
      items.push(rowData);
    }
    return items;
  }

  parseForm() {
    if (this.formData && this.formData.images) {
      this.images = this.formData.images;
    }
    this.form.groups.map((group) => {
      group.fields.map((field) => {
        if (field.type === 'array') {
          this.parseArrayDataForEdit(this.formData, field);
        } else {
          field.value = this.resetForm ? null : this.formData ? this.formData[field.name] : null;
        }
      });
    });
  }

  parseArrayDataForEdit(objectToBeEdited: any, field: Field, parent?: Field, row: any[] = []) {
    field.rows = [];
    const objectString = JSON.stringify(field);
    const items = objectToBeEdited ? objectToBeEdited[field.name] : [];
    items.map((item: any) => {
      const rowItem: any[] = [];
      const object = JSON.parse(objectString);
      object.children.map((child: Field) => {
        if (child.type === 'array') {
          const childObjectString = JSON.stringify(child);
          const childItems = item[child.name];
          childItems.map((childItem: any) => {
            const childRowItem: any[] = [];
            const childObject = JSON.parse(childObjectString);
            childObject.children.map((grandChild: Field) => {
              grandChild.value = this.resetForm ? null : childItem ? childItem[grandChild.name] : null;
              childRowItem.push(grandChild);
            });
            child.rows.push(childRowItem);
          });
        } else {
          child.value = this.resetForm ? null : item ? item[child.name] : null;
        }
        rowItem.push(child);
      });
      field.rows.push(rowItem);
      row.push(rowItem);
    });
    if (parent) {
      parent.rows.push(row);
    }
  }

  handleInputChange(field: Field, value: boolean | number | string | number[] | string[] | FileList) {
    if (field.type === 'checkBox') {
      field.value = [...(value as any[])];
    }
    this.inputChange.emit({ name: field.name, value });
  }

  handleSearch(value: any) {
    this.searchOptions.emit(value);
  }

  handleRowAdded(value: any) {
    this.rowAdded.emit(value);
  }

  handleRowRemoved(value: any) {
    this.rowRemoved.emit(value);
  }

  handleFileUpload(response: any) {
    this.fileUploaded.emit(response);
  }

  handleSubmitForm(form?: Form) {
    if (!this.isValidForm(form)) {
      return;
    }
    const formData = {};
    form.groups.map((group) => {
      group.fields.map((field) => {
        if (field.type === 'array') {
          formData[field.name] = this.parseArrays(field);
        } else {
          formData[field.name] = field.value;
        }
      });
    });
    this.submitForm.emit(formData);
  }
}
