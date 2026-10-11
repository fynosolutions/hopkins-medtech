import {site} from './content';

export const careersTitle = 'Careers in Medical Device, IVD and Digital Health';
export const careersDescription = 'Careers at Hopkins MedTech Compliance (HMC), a medical device and IVD CRO: full-time roles in regulatory affairs, quality systems, data engineering and AI, and clinical project management, and eight internship descriptions.';

export function jobPageTitle(job: typeof site.jobs[number]) {
  return job.title.split(',')[0].replace(/ Intern$/, ' Internship');
}

export function jobDescription(job: typeof site.jobs[number]) {
  const subject = jobPageTitle(job).toLowerCase();
  return `${subject.charAt(0).toUpperCase()+subject.slice(1)} at Hopkins MedTech Compliance (HMC), a medical device and IVD CRO. Remote / Onsite.`;
}

export function fullTimeDescription(role: {title: string; excerpt: string}) {
  return `${role.title}, a full-time role at Hopkins MedTech Compliance (HMC), a medical device and IVD CRO. ${role.excerpt}`;
}
