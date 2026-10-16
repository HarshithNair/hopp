'use client';
import {useState} from 'react';
import {ArrowUpRight,Check,Radio,RotateCcw,ArrowRight,User, X} from 'lucide-react';
import {DemoTransport} from '@/lib/mesh';
const peers=[{name:'You',detail:'The starting point. Your message begins here.'},{name:'Peer 01',detail:'A simulated nearby device receives the first hop.'},{name:'Peer 02',detail:'A second simulated device forwards the signal.'},{name:'Peer 03',detail:'The last stop in this illustration. No real delivery occurs.'}];
export default function SignalPlayground({compact=false,onExplore}:{compact?:boolean;onExplore?:()=>void}){
 const [step,setStep]=useState(0),[running,setRunning]=useState(false),[selected,setSelected]=useState<number|null>(null);
 async function play(){if(running)return;setRunning(true);setStep(0);setSelected(null);try{await new DemoTransport().send('visual-demo',setStep)}finally{setRunning(false)}}
 return <section className={'signal-playground '+(compact?'compact':'')} aria-label="Interactive mesh simulation">
  <div className="signal-intro"><h2>How a relay works</h2><p>Each device passes the message to the next one in range.</p></div>
  <div className={'signal-stage '+(running?'running':'')} data-step={step}>
   <svg className="signal-topology" viewBox="0 0 600 250" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id={compact?'signalDotsSmall':'signalDotsLarge'} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#8196bd" opacity=".25"/></pattern></defs><rect width="600" height="250" fill={`url(#${compact?'signalDotsSmall':'signalDotsLarge'})`}/><ellipse cx="300" cy="125" rx="210" ry="105"/><ellipse cx="300" cy="125" rx="145" ry="70"/><path className={'signal-path '+(step>=1?'lit':'')} d="M90 160 C140 160 155 65 240 65"/><path className={'signal-path '+(step>=2?'lit':'')} d="M240 65 C310 65 290 180 375 180"/><path className={'signal-path '+(step>=3?'lit':'')} d="M375 180 C445 180 450 80 510 80"/></svg>
   {peers.map((p,i)=><button key={p.name} className={`signal-node node-${i} ${step>=i?'reached':''} ${selected===i?'chosen':''}`} aria-label={`Inspect ${p.name}, simulated node`} aria-pressed={selected===i} onClick={()=>setSelected(selected===i?null:i)}><span className="node-icon">{i===0?<Radio size={23}/>:step>=i?<Check size={20}/>:<User size={20}/>}</span><span className="node-name">{p.name}</span></button>)}
   {selected!==null&&<div className="node-detail" role="status"><strong>{peers[selected].name}</strong><span>{peers[selected].detail}</span><button onClick={()=>setSelected(null)} aria-label="Close node details"><X size={14}/></button></div>}
  </div>
  <div className="signal-controls"><button className="signal-send" onClick={play} disabled={running}>{running?<Radio size={17}/>:step===3?<RotateCcw size={17}/>:<ArrowRight size={18}/>} {running?'Passing it on…':step===3?'Try another hop':'Send a demo signal'}<span>{String(step).padStart(2,'0')} / 03</span></button>{onExplore&&<button className="signal-explore" onClick={onExplore} aria-label="Explore mesh radar"><ArrowUpRight size={22}/></button>}</div>
  <div className="signal-caption" aria-live="polite">{running?`Interactive demo. Simulated hop ${step} of 3. No real transmission.`:step===3?'Interactive demo. Three hops explored. No real signal sent or delivery confirmed.':'Interactive demo. Tap a node to explore. Simulated peers only; no Bluetooth connection.'}</div>
 </section>
}
