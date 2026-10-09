import questions from '@/content/careers-faq.json';
import {JsonLd} from './json-ld';
import {faqSchema} from '@/lib/structured-data.mjs';
import {siteOrigin} from '@/lib/site-url';

export function CareersFaq() {
  return <section className="container section careers-faq" aria-labelledby="careers-faq-title">
    <h2 id="careers-faq-title">Internship questions</h2>
    {questions.map(item => <section key={item.id} id={'faq-' + item.id}>
      <h3>{item.question}</h3><p>{item.answer}</p>
      <a href={item.source}>Read the {item.id === 'referral' ? 'application process' : 'program arrangements'}</a>
    </section>)}
    <JsonLd id="careers-faq-jsonld" data={faqSchema(questions, siteOrigin())}/>
  </section>;
}
