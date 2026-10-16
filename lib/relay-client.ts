'use client';
import {normalizePhone} from './phone';
// A phone loading the app from the laptop's LAN IP must reach the relay on that
// same IP, not its own localhost. Derived automatically so phones need no setup.
export const relayURL=(()=>{
 const configured=process.env.NEXT_PUBLIC_API_URL;
 const host=typeof window!=='undefined'?window.location.hostname:'';
 const onLan=host&&host!=='localhost'&&host!=='127.0.0.1';
 // A configured localhost URL would point a phone at itself, so the real page
 // host wins whenever the app is being served over the LAN.
 if(configured&&!(onLan&&/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(configured)))return configured;
 if(onLan)return `${window.location.protocol}//${host}:4000`;
 return 'http://localhost:4000';
})();
export type RelayMessage={id:string;from:string;to:string;body:string;created_at:string};

// Holds a live push connection for this phone number. EventSource reconnects on
// its own, which is what keeps delivery working as phones drop on and off Wi-Fi.
export function subscribe(phone:string,handlers:{onMessage:(m:RelayMessage)=>void;onState:(s:'connected'|'reconnecting')=>void;onPeers?:(p:string[])=>void}){
 const p=normalizePhone(phone);
 if(!p)return()=>{};
 const es=new EventSource(`${relayURL}/relay/stream?phone=${encodeURIComponent(p)}`);
 es.addEventListener('ready',e=>{handlers.onState('connected');try{handlers.onPeers?.(JSON.parse((e as MessageEvent).data).online||[])}catch{}});
 es.addEventListener('message',e=>{try{handlers.onMessage(JSON.parse((e as MessageEvent).data))}catch{}});
 es.addEventListener('peers',e=>{try{handlers.onPeers?.(JSON.parse((e as MessageEvent).data).online||[])}catch{}});
 es.onerror=()=>handlers.onState('reconnecting');
 return()=>es.close();
}

export async function sendDirect(from:string,to:string,body:string):Promise<RelayMessage&{delivered:boolean}>{
 const r=await fetch(`${relayURL}/relay/send`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:normalizePhone(from),to:normalizePhone(to),body})});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||'The HOPP relay is unreachable. Check both phones are on the same Wi-Fi.');
 return data;
}
