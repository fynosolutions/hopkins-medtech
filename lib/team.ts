import source from '@/content/site.json';
// Portraits are added here, not in the preserved source records. Homer Wu's is his public LinkedIn profile photo.
const portraits:Record<string,{src:string,width:number,height:number}>={
 'homer-wu':{src:'/media/team/homer-wu-linkedin.jpg',width:640,height:640},
};
// Display order: Homer Wu (founder and CEO) first, then Jeff Wu, then the source order.
const first=['homer-wu','jeff-wu'];
const rank=(slug:string)=>{const i=first.indexOf(slug);return i<0?first.length:i};
export const team=[...source.team].sort((a,b)=>rank(a.slug)-rank(b.slug)).map(person=>({
 ...person,
 excerpt:person.excerpt.length>=180?person.excerpt.replace(/\s+\S*$/,'')+'…':person.excerpt,
 image:(portraits[person.slug]?.src??null) as string|null,
 imageWidth:portraits[person.slug]?.width??1024,
 imageHeight:portraits[person.slug]?.height??1024,
}));
export const allPeople=team;
// Shown first and larger on the team pages.
export const leaders=team.filter(person=>['jeff-wu','homer-wu'].includes(person.slug));
export const colleagues=team.filter(person=>!leaders.includes(person));
export type TeamMember=typeof allPeople[number];
