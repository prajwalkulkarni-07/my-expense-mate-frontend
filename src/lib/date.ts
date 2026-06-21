import { format, isValid, parse, parseISO } from 'date-fns';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseStoredDate(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const parsedDate = DATE_ONLY_PATTERN.test(value)
    ? parse(value, 'yyyy-MM-dd', new Date())
    : parseISO(value);

  return isValid(parsedDate) ? parsedDate : undefined;
}

export function formatStoredDate(value: string, pattern: string) {
  const parsedDate = parseStoredDate(value);
  return parsedDate ? format(parsedDate, pattern) : '';
}

export function toStoredDate(value: Date) {
  return format(value, 'yyyy-MM-dd');
}
