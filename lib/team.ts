import source from '@/content/site.json';
// Keep the original website order and biographies. Portraits await user upload.
export const team=source.team.filter(person=>person.id!=='TEAM-JEFF').map(person=>({
 ...person,
 excerpt:person.excerpt.length>=180?person.excerpt.replace(/\s+\S*$/,'')+'…':person.excerpt,
 image:null as string|null,
 imageWidth:1024,
 imageHeight:1024,
}));
export const allPeople=team;
export type TeamMember=typeof allPeople[number];
