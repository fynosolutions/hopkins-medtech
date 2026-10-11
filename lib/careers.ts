import {site} from './content';

export const careersTitle = 'Medical Device, IVD and Digital Health Internships';
export const careersDescription = 'Internships at Hopkins MedTech Compliance (HMC), a medical device and IVD CRO: eight roles in clinical research, regulatory affairs, data, quality, AI and digital health.';

export function jobPageTitle(job: typeof site.jobs[number]) {
  return job.title.split(',')[0].replace(/ Intern$/, ' Internship');
}

export function jobDescription(job: typeof site.jobs[number]) {
  const subject = jobPageTitle(job).toLowerCase();
  return `${subject.charAt(0).toUpperCase()+subject.slice(1)} at Hopkins MedTech Compliance (HMC), a medical device and IVD CRO. Remote / Onsite; candidates are referred through education partners.`;
}
