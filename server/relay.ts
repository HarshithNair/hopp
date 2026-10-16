// Offline LAN relay: delivers HOPP messages between devices on the same local
// network with no internet, no cellular and no Supabase account. Phones can sit
// in airplane mode with Wi-Fi re-enabled. In-memory by design; it is a transport,
// not storage, and it never claims SMS or emergency-service delivery.
import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {normalizePhone} from '../lib/phone';

type Stream={id:string;write:(event:string,data:unknown)=>void};
export type RelayMessage={id:string;from:string;to:string;body:string;created_at:string};

const streams=new Map<string,Set<Stream>>();      // phone -> live listeners
const undelivered=new Map<string,RelayMessage[]>(); // phone -> waiting for a listener
const QUEUE_LIMIT=200;

const online=()=>[...streams.keys()];
function deliver(phone:string,m:RelayMessage){
 const set=streams.get(phone);
 if(set&&set.size){for(const s of set)s.write('message',m);return true}
 const q=undelivered.get(phone)||[];
 q.push(m);
 undelivered.set(phone,q.slice(-QUEUE_LIMIT));
 return false;
}
function announce(){for(const set of streams.values())for(const s of set)s.write('peers',{online:online()})}

export const relay=Router();
// The phones reach this over a LAN IP, so the relay accepts any local origin.
relay.use((req,res,next)=>{
 res.set('Access-Control-Allow-Origin','*');
 res.set('Access-Control-Allow-Headers','Content-Type');
 if(req.method==='OPTIONS')return res.sendStatus(204);
 next();
});

relay.get('/stream',(req,res)=>{
 const phone=normalizePhone(String(req.query.phone||''));
 if(!phone)return res.status(400).json({error:'Add your own phone number in Rescue Passport to receive messages.'});
 res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});
 res.flushHeaders?.();
 const stream:Stream={id:randomUUID(),write:(event,data)=>{try{res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)}catch{}}};
 if(!streams.has(phone))streams.set(phone,new Set());
 streams.get(phone)!.add(stream);
 stream.write('ready',{phone,online:online()});
 for(const m of undelivered.get(phone)||[])stream.write('message',m);
 undelivered.delete(phone);
 announce();
 const beat=setInterval(()=>{try{res.write(': keep-alive\n\n')}catch{}},15000);
 req.on('close',()=>{
  clearInterval(beat);
  streams.get(phone)?.delete(stream);
  if(!streams.get(phone)?.size)streams.delete(phone);
  announce();
 });
});

relay.post('/send',(req,res)=>{
 const from=normalizePhone(String(req.body?.from||''));
 const to=normalizePhone(String(req.body?.to||''));
 const body=String(req.body?.body??'').trim();
 if(!from)return res.status(400).json({error:'Add your own phone number in Rescue Passport before sending.'});
 if(!to)return res.status(400).json({error:'Enter the phone number you want to message.'});
 if(from===to)return res.status(400).json({error:'That is your own number.'});
 if(!body)return res.status(400).json({error:'Write a message first.'});
 if(body.length>4000)return res.status(400).json({error:'Message is too long.'});
 const message:RelayMessage={id:randomUUID(),from,to,body,created_at:new Date().toISOString()};
 const delivered=deliver(to,message);
 res.status(201).json({...message,delivered});
});

relay.get('/peers',(_req,res)=>res.json({online:online()}));
