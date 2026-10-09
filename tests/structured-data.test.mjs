import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {organizationSchema, serializeJsonLd, jobPostingSchema, articleSchema, serviceSchema} from '../lib/structured-data.mjs';

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

test('unconfirmed and expired roles never advertise an active JobPosting', () => {
  const jobs = JSON.parse(fs.readFileSync(new URL('../content/site.json', import.meta.url), 'utf8')).jobs;
  const publications = JSON.parse(fs.readFileSync(new URL('../content/job-publication.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(publications), jobs.map(job => job.id));
  for (const job of jobs) assert.equal(jobPostingSchema(job, publications[job.id], company, origin), null);
  const publication = {confirmed: true, source: 'Confirmed test fixture', datePosted: '2026-01-01', locations: [{addressCountry: 'US', addressLocality: 'Boston'}]};
  const today = new Date('2026-02-01');
  const data = jobPostingSchema(jobs[0], publication, company, origin, today);
  assert.equal(data.employmentType, 'INTERN');
  assert.equal(data.identifier.value, jobs[0].id);
  assert.match(data.description, /Educational partner referral/);
  assert.equal(data.jobLocation[0].address.addressLocality, 'Boston');
  for (const incomplete of [{...publication, source: null}, {...publication, datePosted: 'invalid'}, {...publication, locations: []}, {...publication, validThrough: '2026-01-15'}]) {
    assert.equal(jobPostingSchema(jobs[0], incomplete, company, origin, today), null);
  }
});

test('a research summary does not inherit the paper authors or publication date', () => {
  const item = JSON.parse(fs.readFileSync(new URL('../content/research.json', import.meta.url), 'utf8'))[0];
  const data = articleSchema(item, origin);
  assert.equal(data.author, undefined);
  assert.equal(data.datePublished, undefined);
  assert.equal(data.isBasedOn.datePublished, item.originalPublicationDate);
  assert.equal(data.isBasedOn.creditText, 'Original source authors: ' + item.author);
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
