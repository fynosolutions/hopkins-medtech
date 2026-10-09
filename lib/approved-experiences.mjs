// Store only approved public copy here. Consent documents remain outside this repository.
export function publishableExperiences(items, kind, allowedIds, today = new Date()) {
  const required = kind === 'completedProjects'
    ? ['id', 'jobId', 'title', 'task', 'method', 'output', 'duration', 'period']
    : ['id', 'quote', 'displayName', 'role', 'period', kind === 'studentFeedback' ? 'education' : 'personSlug'];
  return items.filter(item => {
    if (item.verified !== true || item.publicationApproved !== true) return false;
    const approved = Date.parse(item.approvedOn);
    if (!Number.isFinite(approved) || approved > today.getTime()) return false;
    if (!required.every(key => typeof item[key] === 'string' && item[key].trim())) return false;
    if (kind === 'completedProjects' && item.completed !== true) return false;
    if (kind !== 'completedProjects' && item.consentConfirmed !== true) return false;
    const association = kind === 'employeeFeedback' ? item.personSlug : item.jobId;
    return allowedIds.includes(association);
  });
}
