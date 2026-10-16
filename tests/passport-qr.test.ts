import {test} from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import {passportSchema} from '../server/validation';

const opts={width:360,margin:2,errorCorrectionLevel:'L' as const};
const ID='a1b2c3d4-0000-4000-8000-000000000000';
// mirrors showQR() in components/Hopp.tsx
const pack=(hopp:string,o:Record<string,string>)=>JSON.stringify({v:1,hopp,...Object.fromEntries(Object.entries(o).filter(([,v])=>v&&v.trim()))});

test('the passport QR carries the whole profile, not just one field',async()=>{
 const p={name:'Mayank V',blood:'B+',allergies:'Penicillin',medical:'Asthma, uses inhaler',contact:'+91 98200 00000',alt_contact:'+91 99300 11111'};
 const payload=pack(ID,p);
 const decoded=JSON.parse(payload);
 for(const [k,v] of Object.entries(p)) assert.equal(decoded[k],v,`${k} missing from QR payload`);
 assert.equal(decoded.v,1);
 assert.equal(decoded.hopp,ID);
 await QRCode.toDataURL(payload,opts);
});

test('blank fields are omitted so a scan shows no empty rows',()=>{
 const decoded=JSON.parse(pack(ID,{name:'Solo',blood:'',allergies:'',medical:'',contact:'',alt_contact:''}));
 assert.deepEqual(Object.keys(decoded),['v','hopp','name']);
});

test('a maximum-length profile still produces a scannable QR, dropping medical if it must',async()=>{
 const max={name:'N'.repeat(100),blood:'B'.repeat(30),allergies:'A'.repeat(500),medical:'M'.repeat(500),contact:'C'.repeat(200),alt_contact:'X'.repeat(200)};
 try{ await QRCode.toDataURL(pack(ID,max),opts) }
 catch{
  const {medical,...rest}=max;
  await QRCode.toDataURL(pack(ID,rest),opts);   // documented fallback must always fit
 }
});

test('server accepts alt_contact and still accepts passports saved before it existed',()=>{
 const withAlt=passportSchema.parse({name:'A',blood:'B+',allergies:'',medical:'',contact:'+911',alt_contact:'+912',share:true});
 assert.equal(withAlt.alt_contact,'+912');
 const legacy=passportSchema.parse({name:'A',blood:'B+',allergies:'',medical:'',contact:'+911',share:false} as any);
 assert.equal(legacy.alt_contact,'','legacy passport must default alt_contact rather than fail validation');
});

test('alt_contact is length-capped like the other contact field',()=>{
 assert.throws(()=>passportSchema.parse({name:'A',blood:'',allergies:'',medical:'',contact:'',alt_contact:'9'.repeat(201),share:false}));
});
