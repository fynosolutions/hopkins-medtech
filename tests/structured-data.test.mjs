import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {organizationSchema, serializeJsonLd, jobPostingSchema, articleSchema, serviceSchema, personSchema} from '../lib/structured-data.mjs';

const company = JSON.parse(fs.readFileSync(new URL('../content/company.json', import.meta.url), 'utf8'));
const origin = 'https://website.example';

test('organization uses the confirmed HMC identity without partner credentials', () => {
  const data = organizationSchema(company, origin);
  assert.equal(data.legalName, 'Hopkins MedTech Group LLC');
  assert.equal(data['@id'], origin + '/#organization');
  assert.equal(data.address.streetAddress, company.postalAddress.streetAddress);
  assert.deepEqual(data.sameAs, [company.linkedin]);
  for (const field of ['taxID', 'vatID', 'hasCredential', 'award', 'parentOrganization']) assert.equal(data[field], undefined);
});

test('JSON-LD cannot close its HTML script element and round-trips the content', () => {
  const input = {name: '</script><script>alert(1)</script>', description: 'A < B & C'};
  const serialized = serializeJsonLd(input);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), input);
});

test('approved roles omit unconfirmed status, dates and locations while preserving the application route and work arrangement', () => {
  const jobs = JSON.parse(fs.readFileSync(new URL('../content/site.json', import.meta.url), 'utf8')).jobs;
  const publications = JSON.parse(fs.readFileSync(new URL('../content/job-publication.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(publications), jobs.map(job => job.id));
  for (const job of jobs) {
    const publication = publications[job.id];
    const data = jobPostingSchema(job, publication, company, origin);
    assert.equal(data.employmentType, 'INTERN');
    assert.equal(data.identifier.value, job.id);
    assert.match(data.description, /apply with a CV and a short note/);assert.doesNotMatch(data.description, /education(al)? partner|\breferr/i);
    assert.match(data.description, /Work arrangement: Remote \/ Onsite/);
    for (const field of ['datePosted', 'validThrough', 'jobLocation', 'jobLocationType', 'applicantLocationRequirements', 'baseSalary']) assert.equal(data[field], undefined);
    for (const invalid of [{...publication, approvedForStructuredData:false}, {...publication, source:null}, {...publication, datePosted:'invalid'}, {...publication, datePosted:'2099-01-01'}, {...publication, validThrough:'2000-01-01'}]) assert.equal(jobPostingSchema(job, invalid, company, origin), null);
    assert.equal(jobPostingSchema(job, undefined, company, origin), null);
  }
});

test('a research summary does not inherit the paper authors or publication date', () => {
  const item = JSON.parse(fs.readFileSync(new URL('../content/research.json', import.meta.url), 'utf8'))[0];
  const data = articleSchema(item, origin);
  assert.equal(data.author, undefined);
  assert.equal(data.datePublished, undefined);
  assert.equal(data.isBasedOn.datePublished, item.originalPublicationDate);
  assert.equal(data.isBasedOn.creditText, 'Original source authors: ' + item.author);
  assert.equal(data.isBasedOn.publisher, undefined);
  assert.equal(data.isBasedOn.isPartOf['@type'], 'Periodical');
  assert.equal(data.publisher['@id'], origin + '/#organization');
  assert.ok(data.citation.some(x => x.url === item.sourceUrl));
});

test('historical reprints preserve original author, publisher, date and source', () => {
  const item = JSON.parse(fs.readFileSync(new URL('../content/site.json', import.meta.url), 'utf8')).historical[0];
  const sourceUrl = 'https://emmainternational.com/intended-use-validation/';
  const data = articleSchema(item, origin, sourceUrl);
  assert.equal(data.author.name, item.author);
  assert.equal(data.publisher.name, 'EMMA International');
  assert.equal(data.datePublished, item.originalPublicationDate);
  assert.equal(data.citation[0].url, sourceUrl);
});

test('service markup describes HMC services without assigning partner credentials', () => {
  const services = JSON.parse(fs.readFileSync(new URL('../content/site.json', import.meta.url), 'utf8')).services;
  for (const service of services) {
    const data = serviceSchema(service, origin);
    assert.equal(data.provider['@id'], origin + '/#organization');
    assert.equal(data.hasCredential, undefined);
    assert.doesNotMatch(service.html, /Our accreditation with|more than 120 laboratories|FDA-approved Master Device Profile|advanced technology, and full certifications/);
  }
  assert.match(services.find(x => x.slug === 'laboratory-services').html, /distinct entities/);
});

test('team schema preserves confirmed roles and omits missing personal links and photos', () => {
  const team = JSON.parse(fs.readFileSync(new URL('../content/site.json', import.meta.url), 'utf8')).team;
  assert.equal(team.length, 6);
  for (const person of team) {
    const data = personSchema(person, origin);
    assert.equal(data.jobTitle, person.role);
    assert.equal(data.worksFor['@id'], origin + '/#organization');
    assert.equal(data.image, undefined);
    assert.equal(data.founder, undefined);

    if (person.linkedin) assert.deepEqual(data.sameAs, [person.linkedin]);
    else assert.equal(data.sameAs, undefined);
  }
});

test('Organization identifies Jeff as a confirmed founder without inventing other founders', () => {
  const data = organizationSchema(company, origin);
  assert.deepEqual(data.founder, [{'@type':'Person','@id':origin+'/about/team/jeff-wu#person',name:'Jeff Wu',sameAs:['https://www.linkedin.com/in/jeffwu774/']}]);
});
