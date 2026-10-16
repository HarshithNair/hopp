// One canonical form for a number however it is typed, so "98765 43210",
// "09876543210" and "+91 98765 43210" all address the same person.
export function normalizePhone(raw:string):string{
 const trimmed=(raw||'').trim();
 if(!trimmed)return '';
 // Letters mean a UUID, an email or a word, never a number. The 7..15 digit
 // window is E.164's limit and also rules out an all-numeric UUID.
 if(/[a-zA-Z]/.test(trimmed))return '';
 const plus=trimmed.startsWith('+');
 const digits=trimmed.replace(/\D/g,'');
 if(digits.length<7||digits.length>15)return '';
 if(plus)return '+'+digits;
 if(digits.length===10)return '+91'+digits;
 if(digits.length===11&&digits.startsWith('0'))return '+91'+digits.slice(1);
 if(digits.length===12&&digits.startsWith('91'))return '+'+digits;
 return '+'+digits;
}
// +919876543210 -> +91 98765 43210
export function displayPhone(raw:string):string{
 const e=normalizePhone(raw);
 const m=/^\+91(\d{5})(\d{5})$/.exec(e);
 return m?`+91 ${m[1]} ${m[2]}`:e||raw;
}
export function isPhone(raw:string):boolean{return normalizePhone(raw).length>=8}
