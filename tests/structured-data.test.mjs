import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {organizationSchema, serializeJsonLd} from '../lib/structured-data.mjs';

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
