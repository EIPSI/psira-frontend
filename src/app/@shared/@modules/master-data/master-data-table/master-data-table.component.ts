import { compareTableRows } from '@shared/utils/table-sort.util';
import { TranslateService } from '@ngx-translate/core';
import { Component, Input, EventEmitter, Output, Optional } from '@angular/core';
import { NzDropdownMenuComponent, NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { TableColumn, SortField } from '../@types/list';

@Component({
  selector: 'app-master-data-table',
  templateUrl: './master-data-table.component.html',
  styleUrls: ['./master-data-table.component.scss'],
})
export class MasterDataTableComponent<T> {
  @Input() public remoteSort?: boolean;

  @Input()
  public columns: TableColumn<T>[] = [];

  @Input()
  public data: T[] = [];

  @Input()
  public loading = false;

  @Input()
  public contextMenu: NzDropdownMenuComponent;

  @Input()
  public context: T;

  @Output()
  public contextChange = new EventEmitter<T>();

  @Output()
  public rowClick = new EventEmitter<T>();

  @Output()
  public sort = new EventEmitter<SortField<T>[]>();

  private sortComparators = new Map<any, (left: T, right: T) => number>();

  constructor(private contextMenuService: NzContextMenuService, @Optional() private translate?: TranslateService) {}

  public onOpenContextMenu(event: MouseEvent, context: T): void {
    event.preventDefault();
    event.stopPropagation();
    this.context = context;
    this.contextChange.emit(context);
    this.contextMenuService.create(event, this.contextMenu);
  }

  public sortFunction(column: TableColumn<T>): boolean | ((left: T, right: T) => number) {
    if (!column.sort) return false;
    if (this.remoteSort === undefined ? this.sort.observers.length > 0 : this.remoteSort) return true;
    if (!this.sortComparators.has(column)) {
      this.sortComparators.set(column, (left, right) => compareTableRows(left, right,
        { name: String(column.name), render: column.render }, (text) => this.translate ? this.translate.instant(text) : text));
    }
    return this.sortComparators.get(column);
  }

  public onSort({ sort }: NzTableQueryParams) {
    const values = { ascend: 'ASC', descend: 'DESC' };
    const sortFields: SortField<T>[] = sort
      // filter unused sorts
      .filter((field) => !!field.value)

      // convert to SortField
      .map((field) => ({ field: field.key, direction: values[field.value] } as SortField<T>))

      // use altName for sorting if exists
      .map((sortField) => {
        const column = this.columns.find((col) => col.name === sortField.field);
        return column?.altName ? { ...sortField, field: column.altName } : sortField;
      });
    this.sort.emit(sortFields);
  }
}
