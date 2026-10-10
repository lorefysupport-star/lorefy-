const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const core=require('../modules/lorefy-chapter-detail-core.js');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-chapter-detail.js'),'utf8');

class Node {
  constructor(tag,cls='',text=''){this.tag=tag;this.className=cls;this.textContent=text;this.children=[];this.handlers={};this.attrs={};this.value='';this.checked=false;this.isConnected=true;this.classList={toggle(){}};}
  appendChild(child){child.parentElement=this;this.children.push(child);return child;}
  setAttribute(key,value){this.attrs[key]=value;}
  getAttribute(key){return this.attrs[key];}
  addEventListener(key,callback){this.handlers[key]=callback;}
  find(predicate){if(predicate(this))return this;for(const child of this.children){const match=child.find(predicate);if(match)return match;}return null;}
  querySelector(selector){return this.find(node=>node.className.split(' ').includes(selector.slice(1)));}
  querySelectorAll(selector){const all=[];const visit=node=>{if(selector==='button'&&node.tag==='button')all.push(node);node.children.forEach(visit);};visit(this);return all;}
  get elements(){const all=[];const visit=node=>{if(['button','textarea','input'].includes(node.tag))all.push(node);node.children.forEach(visit);};visit(this);return all;}
}
function setup(backend){
  let privateState={},previewState={},reloads=0;
  const section=new Node('section'), discussion=new Node('section','lf-chapter-discussion');
  discussion.reload=async()=>{reloads++;};
  const context={core,Date,Array,Number,read:()=>privateState,write:value=>{privateState=value;return true;},readPreview:()=>previewState,writePreview:value=>{previewState=value;return true;},
    reviewFor:()=>null,text:(ar,en)=>en,english:()=>true,announce:(_,message)=>{section.message=message;},
    el:(tag,cls,text)=>new Node(tag,cls,text),icon:()=>new Node('i'),
    button:(label,cls,icon,action)=>{const node=new Node('button',cls);node.attrs['aria-label']=label;node.type='button';node.handlers.click=action;return node;},
    global:{LorefyBackend:backend},render:()=>{},expanded:1};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function editor('),source.indexOf('  function render(')),context);
  const form=context.editor(section,{id:'work',total:10,chapterDetails:{}},2);
  section.appendChild(form);section.appendChild(discussion);
  return {form,submit:()=>form.handlers.submit({preventDefault(){}}),preview:()=>previewState,private:()=>privateState,reloads:()=>reloads};
}
test('chapter preview addition is local to the chapter and reports success beside the button',async()=>{
  const view=setup({mode:'demo'});
  view.form.querySelector('.lf-chapter-note').value='Chapter-only feedback';
  await view.submit();
  assert.equal(view.preview().work?.['2']?.comment,'Chapter-only feedback');
  assert.deepEqual(view.private(),{});
  assert.equal(view.reloads(),1);
  assert.match(view.form.querySelector('.lf-chapter-publish-status')?.textContent||'',/preview|locally/i);
});
test('live chapter publishing accepts comment-only input and refreshes its discussion, not the feed',async()=>{
  const calls=[];
  const view=setup({mode:'live',publishChapterReview:async(...args)=>{calls.push(args);return {id:'review'};}});
  view.form.querySelector('.lf-chapter-note').value='A comment without a rating';
  await view.submit();
  assert.deepEqual(calls[0],['work',2,0,'A comment without a rating',false]);
  assert.equal(view.reloads(),1);
  assert.match(view.form.querySelector('.lf-chapter-publish-status')?.textContent||'',/chapter/i);
  assert.equal(view.form.querySelector('.lf-chapter-save').disabled,false);
});
test('failed publishing keeps the comment, exposes the error inline, and allows retry',async()=>{
  const view=setup({mode:'live',publishChapterReview:async()=>{throw new Error('offline');}});
  view.form.querySelector('.lf-chapter-note').value='Keep my draft';
  await view.submit();
  assert.equal(view.form.querySelector('.lf-chapter-note').value,'Keep my draft');
  assert.match(view.form.querySelector('.lf-chapter-publish-status')?.textContent||'',/try again/i);
  assert.equal(view.form.querySelector('.lf-chapter-save').disabled,false);
  assert.deepEqual(view.private(),{});
});
test('chapter forms do not invoke community publishing',()=>{
  assert.doesNotMatch(source,/LorefyCommunity\.openComposer|publishCommunityPost/);
});
test('chapter quarter slider sends and stores 4.25 without converting it to an integer',async()=>{
  const calls=[];
  const view=setup({mode:'live',publishChapterReview:async(...args)=>{calls.push(args);return {rating:args[2]};}});
  const slider=view.form.find(n=>n.tag==='input'&&n.type==='range');
  assert.ok(slider);
  assert.equal(Number(slider.step),0.25);
  slider.value='4.25';slider.handlers.input();
  await view.submit();
  assert.equal(calls[0][2],4.25);
});
test('duplicate taps submit once while the request is pending',async()=>{
  let finish,calls=0;
  const view=setup({mode:'live',publishChapterReview:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
  view.form.querySelector('.lf-chapter-note').value='One request';
  const first=view.submit();
  await view.submit();
  assert.equal(calls,1);
  assert.equal(view.form.getAttribute('aria-busy'),'true');
  finish({id:'saved'});await first;
  assert.equal(view.form.getAttribute('aria-busy'),'false');
});
test('empty input reports inline without a server request',async()=>{
  let calls=0;
  const view=setup({mode:'live',publishChapterReview:async()=>{calls++;}});
  await view.submit();
  assert.equal(calls,0);
  assert.match(view.form.querySelector('.lf-chapter-publish-status').textContent,/Choose a rating/);
});
test('private save never adds a comment to the public or preview discussion',()=>{
  const view=setup({mode:'demo'});
  view.form.querySelector('.lf-chapter-note').value='Private note';
  view.form.querySelector('.lf-chapter-private-save').handlers.click();
  assert.equal(view.private().work['2'].comment,'Private note');
  assert.deepEqual(view.preview(),{});
  assert.equal(view.reloads(),0);
  assert.match(view.form.querySelector('.lf-chapter-publish-status').textContent,/Saved privately/);
});
