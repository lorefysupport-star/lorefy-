'use strict';
const {Readable}=require('node:stream');
const {createGunzip}=require('node:zlib');
const readline=require('node:readline');
async function main(){
  const r=await fetch('https://dumps.ranobedb.org/rndb-db-public-latest.dump.gz');
  if(!r.ok)throw Error(r.status);
  const lines=readline.createInterface({input:Readable.fromWeb(r.body).pipe(createGunzip()),crlfDelay:Infinity});
  let first=false;
  for await(const line of lines){
    if(line.startsWith('COPY ')){console.log(line);first=true;}
    else if(first){console.log(line.slice(0,1800));first=false;}
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
