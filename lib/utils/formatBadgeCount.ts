export function formatBadgeCount(value: number | null | undefined): string {
  const count = Number(value || 0);
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count > 99) return '99+';
  return String(Math.floor(count));
}
