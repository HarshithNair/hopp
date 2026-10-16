export interface MeshTransport {kind:'demo'|'native';send(id:string,onHop:(hop:number)=>void):Promise<{id:string;acknowledged:boolean}>}
export class DemoTransport implements MeshTransport {kind='demo' as const;async send(id:string,onHop:(hop:number)=>void){for(let i=1;i<=3;i++){await new Promise(r=>setTimeout(r,900));onHop(i)}return {id,acknowledged:false}}}
