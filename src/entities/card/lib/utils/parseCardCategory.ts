export function parseCardCategory(value: string | string[] | undefined): string | undefined {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    new TextEncoder().encode(value).length > 256 ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    return undefined;
  return value;
}
