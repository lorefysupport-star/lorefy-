const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
for(const lang of ['ar','en'])test('source attribution accurately labels an award organization in '+lang,()=>{
 const marker=source.indexOf('className:"lf-synopsis-source"'),start=source.lastIndexOf('React.createElement("a"',marker),end=source.indexOf('),React.createElement("button"',marker)+1;
 assert.ok(start>=0&&end>start);
 const href='https://www.nationalbook.org/books/nimona/';
 const link=vm.runInNewContext('('+source.slice(start,end)+')',{React:{createElement:(tag,props,...children)=>({tag,props,children})},m:{synopsisAttribution:{url:href}},W:lang,C:{sub:'#666'}});
 assert.equal(link.tag,'a');assert.equal(link.props.href,href);assert.equal(link.props.rel,'noopener noreferrer');
 assert.equal(link.children[0],lang==='ar'?'نبذة تحريرية · المصدر':'Editorial summary · Source');
});
