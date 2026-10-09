// Store only approved public copy here. Consent documents remain outside this repository.
export function publishableExperiences(items, kind, allowedIds, today = new Date()) {
  if (!['completedProjects', 'studentFeedback'].includes(kind)) return [];
  const required = kind === 'completedProjects'
    ? ['id', 'jobId', 'title', 'task', 'method', 'output', 'duration', 'period']
    : ['id', 'jobId', 'quote', 'displayName', 'role', 'period', 'education'];
  return items.filter(item => {
    if (item.verified !== true || item.publicationApproved !== true) return false;
    const approved = Date.parse(item.approvedOn);
    if (!Number.isFinite(approved) || approved > today.getTime()) return false;
    if (!required.every(key => typeof item[key] === 'string' && item[key].trim())) return false;
    if (kind === 'completedProjects' && item.completed !== true) return false;
    if (kind !== 'completedProjects' && item.consentConfirmed !== true) return false;
    return allowedIds.includes(item.jobId);
  });
}
