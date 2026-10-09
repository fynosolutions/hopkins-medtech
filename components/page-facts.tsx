import summaries from '@/content/service-summaries.json';
import {site} from '@/lib/content';
import {company} from '@/lib/content';

function Facts({title, rows}: {title:string; rows: [string,string][]}) {
  return <section className="page-facts"><h2>{title}</h2>
    <table className="fact-table"><caption className="sr-only">{title}</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">Details</th></tr></thead>
      <tbody>{rows.map(([label,value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody>
    </table>
  </section>;
}
export function ServiceFacts({slug}: {slug: string}) {
  const item = summaries[slug as keyof typeof summaries];
  return <Facts title="Service at a glance" rows={[
    ['Provider', company.name], ['For', item.audience], ['Work', item.work], ['Rules and standards', item.framework],
    ...(slug === 'laboratory-services' ? [['Laboratory provider', 'Confirmed for each engagement; partner accreditations belong to the laboratory provider.'] as [string,string]] : []),
  ]}/>;
}
export function JobFacts({job}: {job: typeof site.jobs[number]}) {
  return <Facts title="Position at a glance" rows={[
    ['Position identifier', job.id], ['Position', job.title], ['Track', job.track],
    ['Agreement entity', company.legalName], ['Application channel', 'Educational partner referral'],
    ['Supervision', 'Named project lead, a set weekly meeting cadence and written feedback on deliverables.'],
    ['Availability and work arrangements', 'Confirm with your education partner and project lead.'],
  ]}/>;
}
