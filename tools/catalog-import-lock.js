'use strict';
const fs=require('node:fs');
const path=require('node:path');
async function acquireCatalogLock(root) {
  const file=path.join(root,'output','catalog-bulk','.install.lock');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const deadline=Date.now()+120000;
  while(true) {
    try {
      const handle=fs.openSync(file,'wx');
      fs.writeFileSync(handle,String(process.pid));
      return ()=>{fs.closeSync(handle);fs.unlinkSync(file);};
    } catch(error) {
      if(error.code!=='EEXIST' || Date.now()>deadline) throw error;
      await new Promise(resolve=>setTimeout(resolve,500));
    }
  }
}
module.exports={acquireCatalogLock};
