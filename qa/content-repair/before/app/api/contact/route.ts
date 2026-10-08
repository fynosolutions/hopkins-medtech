import {handleSubmission} from '@/lib/submission';
export const runtime='nodejs';
export async function POST(request:Request){return handleSubmission(request,'contact')}
