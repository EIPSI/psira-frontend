function visibleSortValue(value: any, translate: (text: string) => string): string | number {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return Number(value);
  if (Array.isArray(value)) return value.map((item) => visibleSortValue(item, translate)).join(', ');
  if (typeof value === 'object') {
    if (value.translationPath) return translate(value.translationPath);
    if (value.title !== undefined) return translate(String(value.title));
    if (value.name !== undefined) return String(value.name);
    if (value.label !== undefined) return translate(String(value.label));
    if (value.firstName !== undefined) return [value.firstName, value.middleName, value.lastName].filter(Boolean).join(' ');
    return JSON.stringify(value);
  }
  return String(value);
}

export function compareTableRows(
  left: any,
  right: any,
  column: { name: string; render?: string },
  translate: (text: string) => string = (text: string): string => text,
): number {
  const first = left[column.name];
  const second = right[column.name];
  if (column.render === 'date') {
    const firstTime = first ? new Date(first).getTime() : NaN;
    const secondTime = second ? new Date(second).getTime() : NaN;
    if (!isNaN(firstTime) && !isNaN(secondTime)) return firstTime - secondTime;
  }
  const firstValue = visibleSortValue(first, translate);
  const secondValue = visibleSortValue(second, translate);
  if (typeof firstValue === 'number' && typeof secondValue === 'number') return firstValue - secondValue;
  return String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true, sensitivity: 'base' });
}
