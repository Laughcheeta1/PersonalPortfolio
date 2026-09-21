import { apiBaseUrl } from '../services';
export const HUNT_DURATION_SECONDS=45;
export interface HuntSession {session_id:string;session_token:string;duration_seconds:number;local?:boolean}
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
export function isHuntServiceUnavailable(error:unknown):boolean {
  return error instanceof HuntServiceError&&(error.status===0||error.status>=500);
}
export function createLocalHuntSession():HuntSession {
  return {session_id:`local-${crypto.randomUUID()}`,session_token:'',duration_seconds:HUNT_DURATION_SECONDS,local:true};
}
async function request<T>(path:string,body?:unknown):Promise<T>{
  let response:Response;
  try{response=await fetch(`${apiBaseUrl}/bug-hunt${path}`,{
      method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,
      body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000),
    });
  }catch{throw new HuntServiceError(0,'The score service is unavailable.');}
  let payload:unknown;
  try{payload=await response.json();}catch{throw new HuntServiceError(response.status,'The score service returned an invalid response.');}
  const detail=payload&&typeof payload==='object'&&typeof (payload as Record<string,unknown>).detail==='string'?(payload as Record<string,unknown>).detail as string:'The score service is unavailable. Please try again.';
  if(!response.ok)throw new HuntServiceError(response.status,detail);
  return payload as T;
}
export const huntService={
  leaderboard:()=>request<Leaderboard>('/leaderboard'),
  start:(visitor:ReturnType<typeof visitorIdentity>)=>request<HuntSession>('/sessions',visitor),
  finish:(session:HuntSession,score:number)=>request<HuntResult>(`/sessions/${session.session_id}/score`,{session_token:session.session_token,score}),
};
