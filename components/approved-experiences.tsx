import records from '@/content/approved-experiences.json';
import {site} from '@/lib/content';
import {team} from '@/lib/team';
import {publishableExperiences} from '@/lib/approved-experiences.mjs';

type Experience = Record<string, string | boolean>;
export function ApprovedExperiences({kind, jobId}: {kind: keyof typeof records; jobId?: string}) {
  const allowed = kind === 'employeeFeedback' ? team.map(person => person.slug) : site.jobs.map(job => job.id);
  const entries = (publishableExperiences(records[kind], kind, allowed) as Experience[])
    .filter(item => !jobId || item.jobId === jobId);
  if (!entries.length) return null;
  const title = {studentFeedback: 'Intern feedback', completedProjects: 'Completed intern projects', employeeFeedback: 'Team perspectives'}[kind];
  return <section className="approved-experiences" aria-labelledby={`${kind}-title`}>
    <h2 id={`${kind}-title`}>{title}</h2>
    {entries.map(item => <article key={String(item.id)}>
      {kind === 'completedProjects' ? <>
        <h3>{item.title}</h3>
        <dl>{[['Task', 'task'], ['Method', 'method'], ['Deliverable', 'output'], ['Time spent', 'duration'], ['Period', 'period']].map(([label, key]) =>
          <div key={key}><dt>{label}</dt><dd>{item[key]}</dd></div>)}</dl>
      </> : <>
        <blockquote><p>{item.quote}</p></blockquote>
        <p>{item.displayName} · {item.role}{kind === 'studentFeedback' && <> · {item.education}</>} · {item.period}</p>
      </>}
    </article>)}
  </section>;
}
