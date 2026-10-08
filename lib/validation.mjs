export function validateSubmission(kind,input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,fieldErrors:{body:'A JSON object is required.'}};
 const data={};const fieldErrors={};
 const fields=kind==='contact'?{subject:150,name:100,phone:40,email:254,message:5000}:{email:254};
 for(const [field,max] of Object.entries(fields)){
  if(input[field]!=null && typeof input[field]!=='string'){fieldErrors[field]='Use a text value.';continue}
  data[field]=String(input[field]||'').trim();
  if(data[field].length>max)fieldErrors[field]='This value is too long.';
 }
 if(input.website)fieldErrors.website='Submission could not be accepted.';
 if(kind==='contact'){
  for(const field of ['subject','name','message'])if(!data[field])fieldErrors[field]='This field is required.';
  if(!data.phone&&!data.email)fieldErrors.email='Provide an email address or a phone number.';
  if(data.phone&&!/^[+\d\s().-]{5,40}$/.test(data.phone))fieldErrors.phone='Enter a valid phone number.';
 }else if(!data.email)fieldErrors.email='Email is required.';
 if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))fieldErrors.email='Enter a valid email address.';
 return {ok:Object.keys(fieldErrors).length===0,data,fieldErrors};
}
