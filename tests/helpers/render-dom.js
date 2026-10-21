// Minimal DOM with real move/remove semantics for node-identity regressions.
class RenderNode {
 constructor(tag='div',attrs={},children=[]){this.tag=tag;this.attrs={...attrs};this.children=[];this.dataset={};this.handlers={};this._text=attrs.text||'';this.value=attrs.value||'';this.isConnected=true;this.classList={toggle:(name,on)=>{const values=new Set((this.attrs.class||'').split(' ').filter(Boolean));on?values.add(name):values.delete(name);this.attrs.class=[...values].join(' ');},contains:name=>(this.attrs.class||'').split(' ').includes(name)};children.filter(Boolean).forEach(n=>this.appendChild(n));}
 setAttribute(k,v){this.attrs[k]=v;}
 appendChild(n){n.remove();this.children.push(n);n.parentNode=this;return n;}
 append(...nodes){nodes.forEach(n=>this.appendChild(n));}
 prepend(n){this.insertBefore(n,this.children[0]||null);}
 insertBefore(n,before){if(n===before)return n;n.remove();let i=before?this.children.indexOf(before):this.children.length;if(i<0)throw Error('missing reference');this.children.splice(i,0,n);n.parentNode=this;return n;}
 replaceChild(n,old){this.insertBefore(n,old);old.remove();return old;}
 replaceWith(n){this.parentNode?.replaceChild(n,this);}
 remove(){if(this.parentNode){const p=this.parentNode;p.children.splice(p.children.indexOf(this),1);this.parentNode=null;}}
 replaceChildren(...nodes){this.children.slice().forEach(n=>n.remove());this._text='';this.append(...nodes);}
 set textContent(v){this.replaceChildren();this._text=String(v);}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ');}
 addEventListener(k,f){this.handlers[k]=f;}
 click(){if(!this.disabled)this.handlers.click?.({stopPropagation(){},preventDefault(){}});}
 focus(){this.focused=true;}
 querySelectorAll(selector){return this.children.flatMap(n=>[n,...n.querySelectorAll('*')]).filter(n=>selector==='*'||selector.split(',').some(s=>s===n.tag||s.startsWith('.')&&(n.attrs.class||'').split(' ').includes(s.slice(1))||s.startsWith('[')&&Object.hasOwn(n.attrs,s.slice(1,-1))));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
}
module.exports=RenderNode;
