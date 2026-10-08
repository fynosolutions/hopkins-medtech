import type {TeamMember} from '@/lib/team';
import Image from 'next/image';

export function TeamPortrait({person,compact=false,index=0}:{person:TeamMember;compact?:boolean;index?:number}){
 const className=compact?`avatar avatar-${index} team-avatar`:`team-card-portrait${person.image?' has-team-photo':''}`;
 return <div className={className}>{person.image?<Image src={person.image} alt={person.isExample?`AI-generated portrait of ${person.name}, a fictional example profile`:person.name} width={person.imageWidth} height={person.imageHeight} sizes={compact?'64px':'(max-width: 650px) 350px, (max-width: 950px) 400px, 420px'} loading="lazy"/>:<><span>{person.initials}</span>{!compact&&<i className="portrait-orbit"/>}</>}</div>;
}
