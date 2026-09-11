import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class XlsExportService {
  fileType = 'application/vnd.ms-excel;charset=UTF-8';
  fileExtension = '.xls';

  constructor() {}

  public exportExcel(jsonData: any[], fileName: string): void {
    const columns = this.getColumns(jsonData);
    const table = [
      '<table>',
      '<thead>',
      '<tr>',
      ...columns.map((column) => `<th>${this.escapeHtml(column)}</th>`),
      '</tr>',
      '</thead>',
      '<tbody>',
      ...jsonData.map((row) => this.renderRow(row, columns)),
      '</tbody>',
      '</table>',
    ].join('');

    this.saveExcelFile(table, fileName);
  }

  private getColumns(jsonData: any[]): string[] {
    return Array.from(
      jsonData.reduce((columns, row) => {
        Object.keys(row || {}).forEach((key) => columns.add(key));
        return columns;
      }, new Set<string>())
    );
  }

  private renderRow(row: any, columns: string[]): string {
    return ['<tr>', ...columns.map((column) => `<td>${this.escapeHtml(row?.[column])}</td>`), '</tr>'].join('');
  }

  private escapeHtml(value: any): string {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
      switch (character) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case String.fromCharCode(34):
          return '&quot;';
        default:
          return '&#039;';
      }
    });
  }

  private saveExcelFile(content: string, fileName: string): void {
    const data: Blob = new Blob([content], { type: this.fileType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(data);

    link.href = url;
    link.download = fileName + this.fileExtension;
    link.click();
    URL.revokeObjectURL(url);
  }
}
