export function formatUtcTimestamp(value: string | null | undefined): string {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid timestamp';
  }

  return `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
}
