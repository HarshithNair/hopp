export const SOS_SMS_NUMBER = '+919930923165';
export const SOS_SMS_DISPLAY = '+91 9930923165';
type SosMessage = {name:string;category:string;notes:string;location?:[number,number]};
export function buildSosMessage({name,category,notes,location}:SosMessage){
 const person=name.trim()||'A HOPP user';
 const validLocation=location&&location.every(Number.isFinite)&&Math.abs(location[0])<=90&&Math.abs(location[1])<=180;
 return [`HOPP SOS: ${person} needs help.`,`Emergency: ${category}.`,notes.trim()?`Notes: ${notes.trim()}`:'',validLocation?`They have attached their location: https://www.google.com/maps?q=${location[0]},${location[1]}`:'Location is not attached. Please contact them for their location.'].filter(Boolean).join('\n');
}
// RFC 5724 draft composition only. The messaging app owns the final send action.
export function sosSmsUrl(body:string){return `sms:${SOS_SMS_NUMBER}?body=${encodeURIComponent(body)}`}
