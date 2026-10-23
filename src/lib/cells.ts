/**
 * Column class for a `.cells` grid, chosen from the item count so the last row is never a lone
 * cell (the CSS stretches a short trailing cell across its row). Classes are in global.css.
 */
const COLUMNS: Record<number, 2 | 3 | 4 | 5> = { 1: 2, 2: 2, 3: 3, 4: 4, 5: 5, 6: 3, 7: 4, 8: 4, 9: 3, 10: 5, 11: 4, 12: 4 };

export function cellsFor(count: number): string {
  return `cells-c${COLUMNS[count] ?? 4}`;
}
