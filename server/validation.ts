import {z} from 'zod';
import {createHmac,timingSafeEqual} from 'node:crypto';
const location={latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional()};
export const sosSchema=z.object({category:z.enum(['Medical','Trapped','Lost','Fire']),notes:z.string().max(2000).default(''),recipient_id:z.uuid().optional(),...location});
export const messageSchema=z.object({body:z.string().trim().min(1).max(4000),recipient_id:z.uuid().optional(),group_id:z.uuid().optional()}).refine(v=>Boolean(v.recipient_id)!==Boolean(v.group_id),'Choose one recipient or group');
export const hazardSchema=z.object({kind:z.enum(['Hazard','Shelter','Hospital','Water']),description:z.string().trim().min(1).max(2000),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),severity:z.enum(['yellow','orange','red'])});
export const passportSchema=z.object({name:z.string().max(100),phone:z.string().max(20).default(''),blood:z.string().max(30),allergies:z.string().max(500),medical:z.string().max(500),contact:z.string().max(200),alt_contact:z.string().max(200).default(''),share:z.boolean()});
export const operationSchema=z.object({id:z.uuid(),type:z.enum(['sos','message','hazard']),data:z.record(z.string(),z.unknown())});
export function verifySignature(order:string,payment:string,signature:string,secret:string){if(!/^[a-f0-9]{64}$/i.test(signature))return false;const expected=createHmac('sha256',secret).update(`${order}|${payment}`).digest();return timingSafeEqual(expected,Buffer.from(signature,'hex'))}
