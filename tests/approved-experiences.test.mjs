import test from 'node:test';
import assert from 'node:assert/strict';
import {publishableExperiences} from '../lib/approved-experiences.mjs';
const today = new Date('2026-10-09T12:00:00Z');
const fixture = {id:'unit-test-only', quote:'Unit test fixture', displayName:'Test', role:'Intern', period:'Test period', education:'Test subject', jobId:'JD-HMT-A01', verified:true, publicationApproved:true, consentConfirmed:true, approvedOn:'2026-10-09'};
test('feedback cannot publish without consent, verification, valid approval and a known role', () => {
  const check = item => publishableExperiences([item], 'studentFeedback', ['JD-HMT-A01'], today);
  assert.equal(check(fixture).length, 1);
  for (const change of [{consentConfirmed:false},{verified:false},{publicationApproved:false},{approvedOn:'2030-01-01'},{approvedOn:null},{jobId:'unknown'},{education:''}]) assert.deepEqual(check({...fixture,...change}), []);
});
test('example assignments and removed people cannot become published evidence', () => {
  const project = {...fixture,title:'Fixture',task:'Fixture',method:'Fixture',output:'Fixture',duration:'Fixture',completed:false};
  assert.deepEqual(publishableExperiences([project], 'completedProjects', ['JD-HMT-A01'], today), []);
  assert.deepEqual(publishableExperiences([{...fixture,personSlug:'jeff-wu'}], 'employeeFeedback', ['homer-wu'], today), []);
});
