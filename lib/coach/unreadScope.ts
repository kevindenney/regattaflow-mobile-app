export function resolveCoachUnreadThreadCount(
  unreadCountByProgram: Record<string, number>,
  assignedProgramIds: string[]
): number {
  const scopedAssignedProgramIds = Array.from(
    new Set(assignedProgramIds.map((id) => String(id || '').trim()).filter(Boolean))
  );
  if (scopedAssignedProgramIds.length === 0) {
    return Object.values(unreadCountByProgram).reduce((total, count) => total + (Number(count) || 0), 0);
  }

  return scopedAssignedProgramIds.reduce((total, programId) => {
    return total + (Number(unreadCountByProgram[programId]) || 0);
  }, 0);
}
