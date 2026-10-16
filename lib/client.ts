import {createClient} from '@supabase/supabase-js';
import {openDB} from 'idb';
export const supabase=process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY):null;
export const apiURL=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export type Operation={id:string;type:'sos'|'message'|'hazard';data:Record<string,unknown>;created_at:string;status:'queued'|'synced';owner:string};
const db=()=>openDB('hopp-v1',1,{upgrade(d){d.createObjectStore('data');d.createObjectStore('queue',{keyPath:'id'})}});
export async function read<T>(key:string,fallback:T):Promise<T>{return (await (await db()).get('data',key))??fallback}
export async function save(key:string,value:unknown){await (await db()).put('data',value,key)}
export async function enqueue(type:Operation['type'],data:Record<string,unknown>,owner:string){const op:Operation={id:crypto.randomUUID(),type,data,owner,created_at:new Date().toISOString(),status:'queued'};await (await db()).put('queue',op);return op}
export async function operations(owner:string):Promise<Operation[]>{return (await (await db()).getAll('queue')).filter(o=>o.owner===owner)}
export async function api(path:string,body?:unknown){const session=(await supabase?.auth.getSession())?.data.session;if(!session)throw new Error('Sign in to connect to the HOPP server.');const r=await fetch(apiURL+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw new Error(data.error||'Server unavailable');return data}
let syncing=false;
export async function sync(owner:string){if(syncing)return;if((await supabase?.auth.getSession())?.data.session?.user.id!==owner)throw Error('Session changed. Retry synchronization.');syncing=true;let failure:unknown;try{const pending=(await operations(owner)).filter(o=>o.status==='queued').sort((a,b)=>Number(b.type==='sos')-Number(a.type==='sos'));for(const op of pending){try{if((await supabase?.auth.getSession())?.data.session?.user.id!==owner)break;await api('/api/sync',op);await (await db()).put('queue',{...op,status:'synced'})}catch(e){failure=e}}if(failure)throw failure}finally{syncing=false}}
export async function clearLocal(){const d=await db();await d.clear('data');await d.clear('queue');await caches.delete('hopp-region-v1')}
