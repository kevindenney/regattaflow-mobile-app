type CoachRoleLabelInput = {
  interestSlug: string;
  role: string;
};

function toTitleCase(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function coachRoleLabel({ interestSlug, role }: CoachRoleLabelInput): string {
  const normalizedInterest = String(interestSlug || '').trim().toLowerCase();
  const normalizedRole = String(role || '').trim().toLowerCase();

  const nursingRoleLabels: Record<string, string> = {
    preceptor: 'Preceptor',
    clinical_instructor: 'Clinical Instructor',
    instructor: 'Instructor',
    evaluator: 'Evaluator',
    assessor: 'Assessor',
    coach: 'Coach',
    admin: 'Admin',
    manager: 'Program Admin',
  };

  const sailingRoleLabels: Record<string, string> = {
    coach: 'Coach',
    coordinator: 'Tactician',
    staff: 'Race Officer',
    tutor: 'Sailmaker',
    volunteer: 'Rigger',
    admin: 'Club Admin',
    manager: 'Team Manager',
  };

  if (normalizedInterest === 'nursing') {
    return nursingRoleLabels[normalizedRole] || toTitleCase(normalizedRole || role);
  }

  if (normalizedInterest === 'sail-racing' || normalizedInterest.includes('sail')) {
    return sailingRoleLabels[normalizedRole] || toTitleCase(normalizedRole || role);
  }

  return toTitleCase(normalizedRole || role);
}
