import {readdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
async function walk(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())result.push(...await walk(p));else if(/\.(js|css|woff2?)$/.test(p))result.push('/'+p.replace(/^\.next\//,'_next/'))}return result}
await writeFile('public/precache.json',JSON.stringify({version:(await readFile('.next/BUILD_ID','utf8')).trim(),assets:[...await walk('.next/static'),'/images/hopp-valley.webp','/images/misty-mountains.jpg','/images/hopp-band.jpg','/fonts/Outfit.ttf','/brand/hopp-logo-original.jpeg','/brand/hopp-icon-192.png','/brand/hopp-icon-512.png']}));

const sw=await readFile('public/sw.js','utf8');await writeFile('public/sw.js',sw.replace(/let shell='[^']+';/,`let shell='hopp-shell-${(await readFile('.next/BUILD_ID','utf8')).trim()}';`));
