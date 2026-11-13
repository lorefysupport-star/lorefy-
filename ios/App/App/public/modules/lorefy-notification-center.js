(function(root,factory){var api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.LorefyNotificationCenter=api;})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 var labels={all:['الكل','All'],unread:['غير مقروءة','Unread'],mentions:['الإشارات','Mentions'],replies:['الردود','Replies'],likes:['الإعجابات','Likes'],follows:['المتابعات','Follows']};
 var messages={
  post_like:['إعجاب بمنشورك','Post liked',' أعجب بمنشورك',' liked your post'],
  post_dislike:['تفاعل بمنشورك','Post reaction',' لم يعجبه منشورك',' disliked your post'],
  post_reply:['رد على منشورك','Reply to your post',' رد على منشورك',' replied to your post'],
  post_reply_reply:['رد على تعليقك','Reply to your comment',' رد على تعليقك',' replied to your comment'],
  review_like:['إعجاب بمراجعتك','Review liked',' أعجب بمراجعتك',' liked your review'],
  review_dislike:['تفاعل بمراجعتك','Review reaction',' لم تعجبه مراجعتك',' disliked your review'],
  review_comment:['تعليق على مراجعتك','Review comment',' علّق على مراجعتك',' commented on your review'],
  review_reply:['رد على تعليقك','Reply to your comment',' رد على تعليقك',' replied to your comment'],
  post_mention:['أشار إليك في منشور','Mentioned in a post',' أشار إليك في منشور',' mentioned you in a post'],
  review_mention:['أشار إليك في مراجعة','Mentioned in a review',' أشار إليك في مراجعته',' mentioned you in a review'],
  comment_mention:['أشار إليك في تعليق','Mentioned in a comment',' أشار إليك في تعليق',' mentioned you in a comment'],
  follow:['متابع جديد','New follower',' بدأ بمتابعتك',' started following you']
 };
 function category(row){var e=row.data?.event||'';if(row.kind==='mention'||e.endsWith('_mention'))return 'mentions';if(row.kind==='follow'||e==='follow')return 'follows';if(row.kind==='comment')return 'replies';if(/reply|comment/.test(e))return 'replies';if(row.kind==='reaction'||/like|heart/.test(e))return 'likes';return 'other';}
 function copy(row,lang){var en=lang==='en',data=row.data||{},m=messages[data.event];return m?{title:m[en?1:0],body:(data.actorName||(en?'A Lorefy reader':'قارئ Lorefy'))+m[en?3:2]}:{title:String(row.title||(en?'New notification':'إشعار جديد')),body:String(row.body||'')};}
 function select(rows,filter){var seen=new Set();return (rows||[]).filter(function(r){return r?.id&&!seen.has(r.id)&&seen.add(r.id);}).filter(function(r){return filter==='all'||(filter==='unread'?!r.read_at:category(r)===filter);}).slice().sort(function(a,b){return (Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0)||String(b.id).localeCompare(String(a.id));});}
 function render(p){
  var doc=root.document,page=p.page,en=p.language==='en',state=page._lfInboxCenter;
  function node(tag,cls,text){var n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
  function icon(name){var n=node('i');n.setAttribute('data-lucide',name);n.setAttribute('aria-hidden','true');return n;}
  if(!state){
   var toolbar=node('section','lf-inbox-toolbar'),summary=node('div','lf-inbox-summary'),count=node('strong'),caption=node('span'),refresh=node('button','lf-inbox-refresh');
   refresh.type='button';refresh.appendChild(icon('refresh-cw'));summary.appendChild(count);summary.appendChild(caption);summary.appendChild(refresh);toolbar.appendChild(summary);
   var tabs=node('div','lf-inbox-filters');tabs.setAttribute('role','tablist');toolbar.appendChild(tabs);
   var section=page.querySelector('.lf-cloud-notifications')||node('section','lf-cloud-notifications');
   if(section.parentElement)section.remove();
   var empty=node('div','lf-inbox-filter-empty'),more=node('button','lf-inbox-older');more.type='button';
   var head=page.querySelector('header');head.insertAdjacentElement('afterend',toolbar);toolbar.insertAdjacentElement('afterend',section);section.insertAdjacentElement('afterend',empty);empty.insertAdjacentElement('afterend',more);
   state={filter:'all',toolbar:toolbar,count:count,caption:caption,refresh:refresh,tabs:tabs,section:section,empty:empty,more:more,rows:new Map(),buttons:new Map()};page._lfInboxCenter=state;
   Object.keys(labels).forEach(function(key){var button=node('button');button.type='button';button.setAttribute('role','tab');button.addEventListener('click',function(){state.filter=key;render(state.props);});button.addEventListener('keydown',function(e){var keys=Object.keys(labels),at=keys.indexOf(key),next;if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();next=e.key==='Home'?0:e.key==='End'?keys.length-1:(at+(e.key===(state.props.language==='en'?'ArrowRight':'ArrowLeft')?1:-1)+keys.length)%keys.length;state.buttons.get(keys[next]).click();state.buttons.get(keys[next]).focus();});tabs.appendChild(button);state.buttons.set(key,button);});
   refresh.addEventListener('click',function(){state.props.refresh();});more.addEventListener('click',function(){state.props.older();});
  }
  state.props=p;var local=Array.from(page.querySelectorAll('.lf-local-notification'));
  state.localSignature=local.map(function(n){return n.getAttribute('data-local-kind')+n.getAttribute('data-local-read');}).join('|');
  page.setAttribute('data-inbox-filter',state.filter);
  var localVisible=0;local.forEach(function(n){var matches=state.filter==='all'||(state.filter==='unread'?n.getAttribute('data-local-read')!=='true':n.getAttribute('data-local-kind')===state.filter);if(n.hidden===matches)n.hidden=!matches;if(matches)localVisible++;});
  var all=select(p.rows,'all'),unread=all.filter(function(r){return !r.read_at;}).length+local.filter(function(n){return n.getAttribute('data-local-read')!=='true';}).length;
  state.count.textContent=String(unread);state.caption.textContent=en?'unread notifications':'إشعارات غير مقروءة';
  state.refresh.setAttribute('aria-label',en?'Refresh notifications':'تحديث الإشعارات');state.refresh.title=state.refresh.getAttribute('aria-label');
  state.refresh.disabled=!!p.loading;state.refresh.setAttribute('aria-busy',String(!!p.loading));
  state.tabs.setAttribute('aria-label',en?'Notification categories':'أنواع الإشعارات');
  state.buttons.forEach(function(button,key){button.textContent=labels[key][en?1:0];button.setAttribute('aria-selected',String(state.filter===key));button.tabIndex=state.filter===key?0:-1;});
  state.section.dir=en?'ltr':'rtl';state.section.setAttribute('aria-label',en?'Notifications':'الإشعارات');
  var visible=select(all,state.filter),keep=new Set(visible.map(function(r){return r.id;}));
  state.rows.forEach(function(record,id){if(!keep.has(id)){record.button.remove();state.rows.delete(id);}});
  visible.forEach(function(item,index){
   var relativeTime=p.time(item.created_at),signature=JSON.stringify([p.language,item]),record=state.rows.get(item.id);
   if(!record){var button=node('button','lf-cloud-notification'),symbol=node('span','lf-inbox-symbol'),content=node('span','lf-cloud-notification-copy'),title=node('strong'),body=node('span'),time=node('time'),dot=node('span','lf-cloud-notification-dot');
    button.type='button';content.appendChild(title);content.appendChild(body);content.appendChild(time);button.appendChild(symbol);button.appendChild(content);button.appendChild(dot);
    record={button:button,symbol:symbol,title:title,body:body,time:time,dot:dot};button.addEventListener('click',function(){state.props.open(record.item);});state.rows.set(item.id,record);
   }
   record.item=item;if(record.signature!==signature){var text=copy(item,p.language),kind=category(item),glyph={mentions:'at-sign',replies:'message-circle',likes:'heart',follows:'user-plus',other:'bell'}[kind];
    record.button.className='lf-cloud-notification'+(!item.read_at?' is-unread':'');record.button.setAttribute('data-notification-id',item.id);record.button.setAttribute('data-kind',kind);
    record.title.textContent=text.title;record.body.textContent=text.body;record.time.setAttribute('datetime',item.created_at||'');record.dot.hidden=!!item.read_at;
    record.symbol.textContent='';record.symbol.appendChild(icon(glyph));record.signature=signature;
   }
   var accessibleCopy=record.body.textContent+' · '+relativeTime+(!item.read_at?(en?' · Unread':' · غير مقروء'):'');
   if(record.time.textContent!==relativeTime)record.time.textContent=relativeTime;
   if(record.button.getAttribute('aria-label')!==accessibleCopy)record.button.setAttribute('aria-label',accessibleCopy);
   var at=state.section.children[index];if(at!==record.button)state.section.insertBefore(record.button,at||null);
  });
  state.empty.hidden=!!visible.length||!!localVisible||p.loading||p.status==='offline';state.empty.textContent=en?(state.filter==='all'?'You’re all caught up':'No notifications in this category'):(state.filter==='all'?'كل شيء هادئ الآن':'لا توجد إشعارات في هذا القسم');
  state.more.hidden=p.hasOlder===false;state.more.disabled=!!p.loadingOlder;state.more.textContent=p.loadingOlder?(en?'Loading…':'جارٍ التحميل…'):(p.olderError?(en?'Could not load older notifications · Retry':'تعذر تحميل الإشعارات السابقة · إعادة المحاولة'):(en?'Older notifications':'الإشعارات السابقة'));
  Array.from(page.children).forEach(function(n){if(n.tagName==='P'&&/No notifications|لا إشعارات/.test(n.textContent||''))n.setAttribute('data-lf-core-empty','hidden');});
  try{root.lucide?.createIcons({root:state.toolbar});root.lucide?.createIcons({root:state.section});}catch(_){}
 }
 return {category:category,copy:copy,select:select,render:render};
});
