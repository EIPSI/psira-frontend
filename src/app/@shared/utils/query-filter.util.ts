/** Remove empty criteria before NestJS Query translates them into SQL brackets. */
export function compactFilter(filter: any): any {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) return filter;
  const result: any = {};
  Object.keys(filter).forEach((key) => {
    const value = filter[key];
    if (value === undefined) return;
    if (key === 'and' || key === 'or') {
      const children = (value || []).map(compactFilter).filter((child: any) => child && Object.keys(child).length);
      if (children.length) result[key] = children;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nested = compactFilter(value);
      if (Object.keys(nested).length) result[key] = nested;
    } else {
      result[key] = value;
    }
  });
  return result;
}

export function combineFilters(...filters: any[]): any {
  const conditions = filters.map(compactFilter).filter((filter) => filter && Object.keys(filter).length);
  if (!conditions.length) return undefined;
  return conditions.length === 1 ? conditions[0] : { and: conditions };
}
