import { apiBaseUrl } from '../services';
export interface HuntSession {session_id:string;session_token:string;duration_seconds:number}
export interface Leaderboard {entries:{rank:number;display_name:string;score:number}[];duration_seconds:number}
export interface HuntResult {score:number;personal_best:number}
export function visitorIdentity():{player_id:string;display_name:string} {
  try {
    const saved=JSON.parse(localStorage.getItem('portfolio.bug-hunt.visitor')??'null');
    if(saved&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved.player_id)&&typeof saved.display_name==='string'&&saved.display_name.trim().length>0&&saved.display_name.length<=24)return saved;
  }catch{/* Storage is optional. */}
  const player_id=crypto.randomUUID();
  return {player_id,display_name:`Debugger ${player_id.slice(0,4)}`};
}
export function saveVisitor(visitor:ReturnType<typeof visitorIdentity>) {
  try{localStorage.setItem('portfolio.bug-hunt.visitor',JSON.stringify(visitor));}catch{/* This visit can still play. */}
}
export class HuntServiceError extends Error {
  constructor(public status:number,message:string){super(message);}
}
async function request<T>(path:string,body?:unknown):Promise<T>{
  const response=await fetch(`${apiBaseUrl}/bug-hunt${path}`,{
    method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,
    body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000),
  });
  const payload=await response.json();
  if(!response.ok)throw new HuntServiceError(response.status,typeof payload.detail==='string'?payload.detail:'The score service is unavailable. Please try again.');
  return payload as T;
}
export const huntService={
  leaderboard:()=>request<Leaderboard>('/leaderboard'),
  start:(visitor:ReturnType<typeof visitorIdentity>)=>request<HuntSession>('/sessions',visitor),
  finish:(session:HuntSession,score:number)=>request<HuntResult>(`/sessions/${session.session_id}/score`,{session_token:session.session_token,score}),
};
