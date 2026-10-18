const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'),'utf8');
function harness(options={}) {
  const timers=new Map();let now=0,timerId=0;
  const clock={setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,at:now+ms});return id;},clearTimeout(id){timers.delete(id);}};
  function advance(ms){now+=ms;for(const [id,t]of [...timers])if(t.at<=now&&timers.delete(id))t.fn();}
  const readers=[],images=[],canvases=[],toasts=[],updates=[],values=new Map([['lorefy.activeUser.v1','a'],['lorefy.session.v1','{"userId":"a"}']]);
  const backend={user:{id:'a'},mode:'live',_communityEpoch:1};let attached=['kept'];
  const scope={window:{...clock,localStorage:{getItem:k=>values.get(k)||null},LorefyBackend:backend},reviewEditor:{current:null},m:{id:'work'},
    currentUILang:()=>options.language||'en',uiText:(lang,ar,en)=>lang==='en'?en:ar,A:(message,kind)=>toasts.push({message,kind}),
    FileReader:class {constructor(){if(options.readerConstructor)throw Error('reader unavailable');readers.push(this);}readAsDataURL(file){if(options.readThrows)throw Error('read failed');this.result='data:image/png;base64,input';}},
    Image:class {constructor(){if(options.imageConstructor)throw Error('decoder unavailable');this.width=options.width??1000;this.height=options.height??500;images.push(this);}},
    document:{createElement(tag){assert.equal(tag,'canvas');const canvas={width:0,height:0,
      getContext(){if(options.nullContext)return null;return{drawImage(){if(options.drawThrows)throw Error('draw failed');}};},
      toDataURL(type,quality){assert.equal(type,'image/jpeg');assert.equal(quality,.72);if(options.encodeThrows)throw Error('encode failed');return'data:image/jpeg;base64,output';}};canvases.push(canvas);return canvas;}},
    ht(update){updates.push(update);if(!options.queued)attached=update(attached);}};
  vm.createContext(scope);const guard=source.indexOf('function lorefyReviewRequestScope(');
  vm.runInContext(source.slice(guard,source.indexOf('const{useState',guard)),scope);
  function open(){scope.reviewEditor.current={workId:'work',owner:scope.lorefyReviewRequestScope(),closed:false};}
  open();const begin=source.indexOf('Yn=t=>');vm.runInContext('const '+source.slice(begin,source.indexOf(',Uo=',begin))+';this.upload=Yn;',scope);
  const input={files:[{name:'picture.png',type:options.fileType??'image/png',size:120}],value:'selected'};
  return{timers,advance,scope,readers,images,canvases,toasts,updates,input,get attached(){return attached;},begin(){scope.upload({target:input});},
    read(){readers.at(-1).onload();},decode(){images.at(-1).onload();},reopen:open,
    switchAccount(){values.set('lorefy.activeUser.v1','b');values.set('lorefy.session.v1','{"userId":"b"}');backend.user={id:'b'};backend._communityEpoch++;}};
}
for(const language of ['ar','en']) {
  test('reader failure gives a localized message and keeps attachments: '+language,()=>{const h=harness({language});h.begin();assert.equal(typeof h.readers[0].onerror,'function');h.readers[0].onerror();assert.equal(h.toasts.length,1);assert.equal(h.toasts[0].kind,'err');assert.match(h.toasts[0].message,language==='en'?/read/i:/قراءة/);assert.deepEqual(h.attached,['kept']);assert.equal(h.input.value,'');});
  test('decode failure gives a localized message without attaching corrupt data: '+language,()=>{const h=harness({language});h.begin();h.read();assert.equal(typeof h.images[0].onerror,'function');h.images[0].onerror();assert.equal(h.toasts.length,1);assert.match(h.toasts[0].message,language==='en'?/open|decode/i:/فتح/);assert.deepEqual(h.attached,['kept']);});
}
for(const option of ['readerConstructor','readThrows','imageConstructor','nullContext','drawThrows','encodeThrows'])test('preparation failure is handled and the same file can be selected again: '+option,()=>{
  const h=harness({[option]:true});assert.doesNotThrow(()=>{h.begin();if(h.readers.length&&!option.startsWith('read'))h.read();if(h.images.length)h.decode();});
  assert.equal(h.toasts.length,1);assert.equal(h.toasts[0].kind,'err');assert.equal(h.input.value,'');assert.deepEqual(h.attached,['kept']);
});
test('an aborted file read reports failure once',()=>{const h=harness();h.begin();assert.equal(typeof h.readers[0].onabort,'function');h.readers[0].onabort();h.readers[0].onerror();h.read();assert.equal(h.toasts.length,1);assert.equal(h.images.length,0);});
for(const dimensions of [{width:0,height:40},{width:Infinity,height:100}])test('invalid image dimensions are rejected: '+JSON.stringify(dimensions),()=>{const h=harness(dimensions);h.begin();h.read();h.decode();assert.equal(h.toasts.length,1);assert.deepEqual(h.attached,['kept']);});
test('very thin valid images retain a nonzero canvas dimension',()=>{const h=harness({width:10000,height:1});h.begin();h.read();h.decode();assert.equal(h.canvases[0].width,560);assert.equal(h.canvases[0].height,1);assert.equal(h.attached.length,2);});
test('a clearly non-image file is rejected before reading',()=>{const h=harness({fileType:'text/plain'});h.begin();assert.equal(h.readers.length,0);assert.equal(h.toasts.length,1);assert.equal(h.input.value,'');});
test('canceling file selection stays silent',()=>{const h=harness();h.input.files=[];h.begin();assert.equal(h.toasts.length,0);assert.equal(h.readers.length,0);});
test('normal preparation still emits JPEG once without changing existing images or the ten-image cap',()=>{const h=harness({queued:true});h.begin();h.read();h.decode();h.decode();assert.equal(h.updates.length,1);assert.deepEqual(Array.from(h.updates[0](['kept'])),['kept','data:image/jpeg;base64,output']);const full=Array(10).fill('image');assert.equal(h.updates[0](full),full);});
test('a stale account read failure never notifies the next account',()=>{const h=harness();h.begin();h.switchAccount();assert.equal(typeof h.readers[0].onerror,'function');h.readers[0].onerror();assert.equal(h.toasts.length,0);});
test('an obsolete decoder failure never notifies a replacement editor',()=>{const h=harness();h.begin();h.read();h.reopen();assert.equal(typeof h.images[0].onerror,'function');h.images[0].onerror();assert.equal(h.toasts.length,0);});
test('closing the editor before decoding prevents processing errors and state changes',()=>{const h=harness({encodeThrows:true});h.begin();h.read();h.scope.reviewEditor.current.closed=true;h.decode();assert.equal(h.canvases.length,0);assert.equal(h.toasts.length,0);assert.deepEqual(h.attached,['kept']);});
test('a queued attachment update still rechecks editor ownership',()=>{const h=harness({queued:true});h.begin();h.read();h.decode();h.reopen();const current=['new draft'];assert.equal(h.updates[0](current),current);});
test('a file with no MIME label can still use the image decoder',()=>{const h=harness({fileType:''});h.begin();h.read();h.decode();assert.equal(h.attached.length,2);assert.equal(h.toasts.length,0);});
test('a late decoder success after its error cannot attach an image or repeat the message',()=>{const h=harness();h.begin();h.read();h.images[0].onerror();h.decode();assert.equal(h.toasts.length,1);assert.deepEqual(h.attached,['kept']);assert.equal(h.canvases.length,0);});

for(const language of ['ar','en'])for(const stage of ['read','decode'])test('a stalled review image '+stage+' expires in '+language,()=>{const h=harness({language});h.begin();if(stage==='decode')h.read();h.advance(29999);assert.equal(h.toasts.length,0);h.advance(1);assert.equal(h.toasts.length,1);assert.match(h.toasts[0].message,language==='en'?/timed out/i:/تأخر/);assert.deepEqual(h.attached,['kept']);if(stage==='read')h.read();else h.decode();assert.equal(h.canvases.length,0);assert.equal(h.timers.size,0);assert.equal(h.toasts.length,1);});
test('successful review preparation clears its deadline',()=>{const h=harness();h.begin();assert.equal(h.timers.size,1);h.read();h.decode();assert.equal(h.timers.size,0);h.advance(60000);assert.equal(h.toasts.length,0);});
test('review failure clears its deadline and only reports once',()=>{const h=harness();h.begin();h.readers[0].onerror();assert.equal(h.timers.size,0);h.advance(60000);assert.equal(h.toasts.length,1);});
test('the review preparation deadline does not restart after file reading',()=>{const h=harness();h.begin();h.advance(25000);h.read();h.advance(5000);assert.equal(h.toasts.length,1);assert.deepEqual(h.attached,['kept']);});
for(const transition of ['close','reopen','account'])test('review timeout never notifies an obsolete '+transition+' editor',()=>{const h=harness();h.begin();if(transition==='close')h.scope.reviewEditor.current.closed=true;else if(transition==='reopen')h.reopen();else h.switchAccount();h.advance(30000);assert.equal(h.toasts.length,0);assert.equal(h.timers.size,0);assert.deepEqual(h.attached,['kept']);});
test('one review image timeout cannot finish another pending selection',()=>{const h=harness();h.begin();h.advance(10000);h.begin();h.advance(20000);assert.equal(h.toasts.length,1);h.read();h.decode();assert.equal(h.attached.length,2);assert.equal(h.timers.size,0);});
