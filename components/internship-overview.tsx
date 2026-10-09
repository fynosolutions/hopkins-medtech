export function InternshipOverview() {
  return <section className="container internship-overview" aria-labelledby="internship-overview-title">
    <h2 id="internship-overview-title">Internship program at a glance</h2>
    <p>Placements are arranged through educational partner referrals. Current availability and individual arrangements are confirmed with the project lead.</p>
    <table className="fact-table">
      <caption>Supervision, agreement and completion arrangements</caption>
      <thead><tr><th scope="col">Program detail</th><th scope="col">Arrangement</th></tr></thead>
      <tbody>{[
        ['Project lead', 'Each intern works with a named project lead.'],
        ['Weekly cadence', 'Meetings follow a set weekly cadence; each deliverable receives written feedback.'],
        ['Written agreement', 'Each internship is covered by a written agreement with Hopkins MedTech Group LLC.'],
        ['Completion certificate', 'Interns who complete the program receive a certificate of completion on company letterhead.'],
        ['Reference letter', 'A letter of recommendation is available on completion.'],
        ['Data and AI use', 'Use only authorized data and project-lead-approved AI tools. Never upload confidential or patient-related information to public or unapproved AI tools. Verify AI-assisted work before delivery.'],
      ].map(([label, description]) => <tr key={label}><th scope="row">{label}</th><td>{description}</td></tr>)}</tbody>
    </table>
  </section>;
}
