// Only timestamps with an explicit offset can be localized without guessing a timezone.
export function cardOperationTime(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
