export function formatHistoricalYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year}`;
}
