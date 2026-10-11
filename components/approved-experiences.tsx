import records from '@/content/approved-experiences.json';
import relayed from '@/content/intern-experience-notes.json';
import {site} from '@/lib/content';
import {publishableExperiences} from '@/lib/approved-experiences.mjs';

type Experience = Record<string, string | boolean>;
export function ApprovedExperiences({kind, jobId}: {kind: keyof typeof records; jobId?: string}) {
  const allowed = site.jobs.map(job => job.id);
  const entries = (publishableExperiences(records[kind], kind, allowed) as Experience[])
    .filter(item => !jobId || item.jobId === jobId);
  const note = jobId ? (relayed.items as Record<string, {title: string; bullets: string[]; feedback: string[]}>)[jobId] : undefined;
  const jobTitle = site.jobs.find(job => job.id === jobId)?.title.split(',')[0];
  if (!entries.length && !note) return null;
  const title = {studentFeedback: 'Intern feedback', completedProjects: 'Completed intern projects'}[kind];
  return <section id={kind} className="approved-experiences" aria-labelledby={`${kind}-title`}>
    <h2 id={`${kind}-title`}>{title}</h2>
    {!entries.length && note && (kind === 'completedProjects'
      ? <article><h3>{note.title}</h3><ul>{note.bullets.map(item => <li key={item}>{item}</li>)}</ul></article>
      : <article><blockquote>{note.feedback.map(item => <p key={item}>{item}</p>)}</blockquote>
          <p className="experience-source">{jobTitle} · feedback collected by the program team and edited for length · name withheld</p></article>)}
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
