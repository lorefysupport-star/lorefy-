const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'..');
test('native runtime config verification cannot invoke the project-wide web preparation command',async()=>{
 const filename=path.join(root,'tests/apple-release-package.test.js'),source=fs.readFileSync(filename,'utf8'),realRequire=createRequire(filename),commands=[];let callback;
 const capture=(name,fn)=>{if(name==='prepares a native runtime config without exposing server secrets')callback=fn;};
 vm.runInNewContext(source,{__dirname:path.dirname(filename),process:{execPath:process.execPath},console,require:name=>{
   if(name==='node:test')return capture;
   if(name==='node:child_process')return{execFileSync:(...args)=>{commands.push(args);return '';}}
   return realRequire(name);
 }});
 assert.equal(typeof callback,'function');await callback();
 assert.equal(commands.length,0,'runtime config test must exercise the projection without rebuilding the actual catalog/ios-web tree');
});
