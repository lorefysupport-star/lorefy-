// A read-only conversation fixture for the isolated loopback phone preview.
(function(){
  var params=new URLSearchParams(location.search);
  if(!['localhost','127.0.0.1'].includes(location.hostname)||params.get('postDemo')!=='1'||params.get('preview')!=='demo')return;
  var en=params.get('lang')==='en',at=new Date().toISOString();
  var body=en?[
    'I went back to the first chapter after finishing the book.',
    'On the first read I watched the person who was speaking. This time I noticed the person listening.',
    'The same pause felt completely different.',
    'No new information. Just a different reader.',
    'I marked that page twice, for two different reasons.',
    'Which opening made you do that?'
  ]:[
    'رجعت للفصل الأول بعد ما خلصت الرواية.',
    'أول مرة كنت أراقب الشخصية اللي تتكلم. هالمرة انتبهت للي جالس يسمعها.',
    'حتى السكوت بين الجمل صار له معنى ثاني.',
    'النص نفسه، بس أنا اللي تغيّرت قراءتي له.',
    'لقيتني معلّم على نفس الصفحة مرتين، وكل مرة لسبب مختلف.',
    'وش افتتاحية رجعتوا لها بعد النهاية؟'
  ];
  window.LorefyDemoCommunity={isEnabled:function(){return false;},buildPosts:function(){return [
    {id:'demo-post-reading',userId:'reader-noura',user:en?'Noura':'نورة',un:'noura_reads',created_at:at,body:body.join('\n'),likes:7,demoReplies:[
      {id:'demo-post-reading-reply',parent_id:'demo-post-reading',userId:'reader-fahad',user:en?'Fahad':'فهد',un:'fahad_reads',created_at:at,body:en?'The opening letter in Frankenstein. It reads like a warning the second time.':'أول رسالة في فرانكنشتاين. ثاني مرة حسّيتها تحذير.'}
    ]}
  ];}};
  var observer=new MutationObserver(function(){
    var card=document.querySelector('.lf-home-screen [data-community-post-id="demo-post-reading"]');
    if(!card)return;
    observer.disconnect();
    requestAnimationFrame(function(){
      var screen=card.closest('.lf-home-screen'),mast=screen.querySelector('.lf-social-header'),tabs=screen.querySelector('.lf-home-community-heading');
      screen.scrollTo({top:screen.scrollTop+card.getBoundingClientRect().top-screen.getBoundingClientRect().top-mast.offsetHeight-tabs.offsetHeight,behavior:'instant'});
    });
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
