/** Display the supplied artwork; crop its surrounding whitespace only in compact UI. */
export default function BrandMark({className=''}:{className?:string}){return <span className={'official-brand-mark '+className}><img src="/brand/hopp-logo-original.jpeg" alt="HOPP"/></span>}
