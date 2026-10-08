import source from '@/content/site.json';
import examples from '@/content/team-examples.json';

const suppliedPortraits:Record<string,{src:string;width:number;height:number}>={
 'jeff-wu':{src:'/media/team/jeff-wu-supplied.png',width:254,height:254},
 'homer-wu':{src:'/media/team/homer-wu-supplied.png',width:200,height:200},
};

export const originalTeam=source.team.map(person=>({
 ...person,
 image:suppliedPortraits[person.slug]?.src||person.image,
 imageWidth:suppliedPortraits[person.slug]?.width||1024,
 imageHeight:suppliedPortraits[person.slug]?.height||1024,
 isExample:false,
 archived:!suppliedPortraits[person.slug],
}));

export const team=[
 ...originalTeam.filter(person=>!person.archived),
 ...examples.map(person=>({...person,imageWidth:1254,imageHeight:1254,isExample:true,archived:false})),
];
export const allPeople=[...team,...originalTeam.filter(person=>person.archived)];
export type TeamMember=typeof allPeople[number];
