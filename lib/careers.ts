import {site} from './content';

export const careersTitle = 'Medical Device, IVD and Digital Health Internships';
export const careersDescription = 'Educational partner internship referrals at HMC, a medical device and IVD CRO with a New York office. Explore eight roles and supervision arrangements.';

export function jobPageTitle(job: typeof site.jobs[number]) {
  return job.title.split(',')[0].replace(/ Intern$/, ' Internship');
}

export function jobDescription(job: typeof site.jobs[number]) {
  const subject = jobPageTitle(job).toLowerCase();
  return `Educational partner referral: ${subject} at HMC, a medical device and IVD CRO with a New York office. Confirm availability with your partner.`;
}
