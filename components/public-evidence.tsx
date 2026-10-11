import Link from 'next/link';
import evidence from '@/content/public-evidence.json';
import insights from '@/content/insights.json';
import {site} from '@/lib/content';

export function PublicEvidence() {
  const updates = insights.filter(item => item.type === 'Company Insights')
    .sort((a, b) => b.originalPublicationDate.localeCompare(a.originalPublicationDate));
  return <div className="container evidence-sections">
    <section id="company-updates" aria-labelledby="company-updates-title">
      <h2 id="company-updates-title">Company updates</h2>
      <p>Public posts from Hopkins MedTech Compliance. Dates below are the original LinkedIn publication dates.</p>
      <ul className="evidence-list">{updates.map(item => <li key={item.id}>
        <time dateTime={item.originalPublicationDate}>{item.originalPublicationDate}</time>
        <div><h3><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
          <Link href={'/resources/' + item.slug}>Read the website summary and sources</Link></div>
      </li>)}</ul>
    </section>
    <section id="documented-partnerships" aria-labelledby="documented-partnerships-title">
      <h2 id="documented-partnerships-title">Documented partnerships</h2>
      <p>HMC and HML are distinct entities. These dated records describe the announced relationships; they do not verify current partner accreditations or service availability.</p>
      <div className="evidence-cards">{evidence.partners.map(partner => <article key={partner.name}>
        <h3>{partner.name}</h3><time dateTime={partner.date}>{partner.date}</time><p>{partner.description}</p>
        <a href={partner.sourceUrl} target="_blank" rel="noopener noreferrer">Read DiaCarta's partnership announcement</a>
      </article>)}</div>
    </section>
    <section id="public-record" aria-labelledby="public-record-title">
      <h2 id="public-record-title">Public record</h2>
      <p>The FDA transcripts document participation in public discussions, not FDA endorsement, certification or product authorization.</p>
      <ul className="evidence-list">{evidence.townHalls.map(record => <li key={record.sourceUrl}>
        <time dateTime={record.date}>{record.date}</time><div><h3>{record.title}</h3><p>{record.description}</p>
          <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">Read the original FDA transcript (PDF)</a></div>
      </li>)}</ul>
    </section>
  </div>;
}
