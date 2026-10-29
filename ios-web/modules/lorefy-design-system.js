(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LorefyDesignSystem = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // React and the imperative screens use the same semantic palette.
  function normalizeMode(value) {
    if (value === false || value === 'light') return 'light';
    if (typeof value === 'string' && /^custom-(light|dark)-[\da-f]{6}$/i.test(value)) return value.toLowerCase();
    return value === 'pink' ? 'pink' : 'dark';
  }

  function customMode(color, base) {
    if (typeof color !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color) || !['light','dark'].includes(base)) return null;
    var hex=color.slice(1).toLowerCase();
    if(hex.length===3)hex=hex.split('').map(function(c){return c+c;}).join('');
    return 'custom-'+base+'-'+hex;
  }
  function isCustom(mode){return normalizeMode(mode).startsWith('custom-');}
  function baseMode(mode){mode=normalizeMode(mode);return isCustom(mode)?mode.split('-')[1]:mode;}
  function isDark(mode){return baseMode(mode)==='dark';}
  function customSettings(mode){mode=normalizeMode(mode);return {color:isCustom(mode)?'#'+mode.split('-')[2]:'#3687bb',base:isDark(mode)?'dark':'light'};}
  function saveMode(mode,storage){
    if(typeof mode!=='string' || normalizeMode(mode)!==mode.toLowerCase())return false;
    try{storage.setItem('lorefy.ui.theme.v1',normalizeMode(mode));return true;}catch(_){return false;}
  }
  function readMode(storage){try{return normalizeMode(storage.getItem('lorefy.ui.theme.v1'));}catch(_){return 'dark';}}
  function rgb(hex){return hex.slice(1).match(/../g).map(function(c){return parseInt(c,16);});}
  function mix(a,b,weight){var other=rgb(b);return '#'+rgb(a).map(function(c,i){return Math.round(c*(1-weight)+other[i]*weight).toString(16).padStart(2,'0');}).join('');}
  function luminance(hex){return rgb(hex).map(function(c){c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);}).reduce(function(sum,c,i){return sum+c*[.2126,.7152,.0722][i];},0);}
  function contrast(a,b){var x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function readable(color,backgrounds,dark){
    for(var step=0;step<=100;step++){
      var candidate=mix(color,dark?'#ffffff':'#000000',step/100);
      if(backgrounds.every(function(bg){return contrast(candidate,bg)>=4.5;}))return candidate;
    }
    return dark?'#ffffff':'#000000';
  }
  function themeSurface(color,dark,amount,ceiling){
    // Bound dark luminance without washing the chosen hue back into neutral grey.
    var seed=dark?mix(color,'#ffffff',.08):(luminance(color)>.95?'#bdbdbd':color);
    var surface=mix(dark?'#000000':'#ffffff',seed,amount);
    while(dark && luminance(surface)>ceiling && amount>0){amount-=.01;surface=mix('#000000',seed,Math.max(0,amount));}
    return surface;
  }
  function customPalette(mode){
    var settings=customSettings(mode),color=settings.color,dark=settings.base==='dark',p=Object.assign({},palette(settings.base));
    p.customColor=color;
    p.bg=themeSurface(color,dark,dark?.5:.3,.055);
    p.card=p.card2=p.sheet=p.elevated=themeSurface(color,dark,dark?.6:.2,.085);
    p.field=p.fill=p.card3=themeSurface(color,dark,dark?.7:.4,.12);
    p.fill2=themeSurface(color,dark,dark?.55:.25,.07);
    p.accentSoft=mix(color,p.bg,dark?.75:.78);
    var surfaces=[p.bg,p.card,p.field,p.fill2,p.accentSoft];
    p.accent=p.accentText=p.rating=readable(color,surfaces,dark);
    p.text=readable(p.text,surfaces,dark);p.text2=readable(p.text2,surfaces,dark);
    p.sub=p.sub2=p.placeholder=readable(p.sub,surfaces,dark);
    p.onAccent=contrast(p.accent,'#ffffff')>=contrast(p.accent,'#000000')?'#ffffff':'#000000';
    p.accentPressed=mix(p.accent,p.onAccent==='#ffffff'?'#000000':'#ffffff',.12);
    p.border=mix(color,p.bg,.78);p.hairline=mix(color,p.bg,.58);
    p.trackOff=p.hairline;p.toggleBg=p.border;
    p.navBg=p.card;p.barBg=p.bg;
    return p;
  }

  function tokens(mode){
    var p=palette(mode),map={bg:'bg',surface:'card',fill:'fill','fill-soft':'fill2',ink:'text',secondary:'text2',muted:'sub',line:'border',separator:'hairline',
      action:'accent','on-action':'onAccent',selected:'accentSoft',rating:'rating',danger:'red',success:'green',gold:'gold',nav:'navBg',bar:'barBg',shadow:'shadow'};
    var result={};Object.keys(map).forEach(function(key){result['--ui-'+key]=p[map[key]];});
    result['--ui-action-pressed']=p.accentPressed || mix(p.accent,p.onAccent==='#FFFFFF'||p.onAccent==='#fff'?'#000000':'#ffffff',.12);
    // Keep literal palette aliases: cinema screens can override --ui-* locally.
    if(normalizeMode(mode)!=='dark')Object.keys(map).forEach(function(key){result['--custom-'+key]=p[map[key]];});
    // Bound glass labels against both backdrop extremes and the reflection peak.
    var dark=isDark(mode),alpha=dark?.68:.62,glare=dark?.12:.44;
    var glassSamples=['#000000',dark?'#7a7a7a':'#ffffff'].flatMap(function(backdrop){
      var base=mix(backdrop,p.card,alpha);
      return [mix(base,'#ffffff',.015),mix(base,'#ffffff',glare)];
    });
    result['--ui-glass-fill']='rgba('+rgb(p.card).join(',')+','+alpha+')';
    result['--ui-glass-sheet']='rgba('+rgb(p.card).join(',')+',.86)';
    result['--ui-glass-ink']=readable(p.text,glassSamples,dark);
    result['--ui-glass-secondary']=readable(p.text2,glassSamples,dark);
    result['--ui-glass-action']=readable(p.accent,glassSamples,dark);
    result['--ui-glass-backdrop']='blur(26px) saturate(150%) brightness('+(dark?'.48':'1.05')+')';
    result['--ui-glass-reflection']='linear-gradient(132deg,rgba(255,255,255,'+glare+'),rgba(255,255,255,.015) 43%,rgba(255,255,255,'+(dark?'.07':'.2')+'))';
    result['--ui-page-wash']='linear-gradient(145deg,'+mix(p.bg,p.accent,.16)+' 0%,'+p.bg+' 48%,'+mix(p.bg,p.fill2,.7)+' 100%)';
    return result;
  }

  function palette(mode) {
    mode = normalizeMode(mode);
    if(isCustom(mode))return customPalette(mode);
    if (mode === 'pink') return Object.assign({}, palette('light'), {
      card:'#FFFAFC',card2:'#FFFAFC',sheet:'#FFFAFC',elevated:'#FFFAFC',
      blue:'#A53662',green:'#A53662',gold:'#A53662',
      shadow:'0 12px 32px rgba(92,35,60,.10)',scrim:'rgba(48,22,35,.38)',
      bg: '#FFF7FA', card3: '#F9EAF0', field: '#F9EAF0', fill: '#F9EAF0', fill2: '#FFF0F5',
      accent: '#A53662', accentText: '#A53662', accentSoft: '#F7DFE9', rating: '#A53662',
      text: '#30222A', text2: '#59434D', sub: '#79616C', sub2: '#79616C', placeholder: '#79616C',
      border: '#EBD9E1', hairline: '#DDC3CF', trackOff: '#BCA0AD', toggleBg: '#EBD9E1',
      navBg: 'rgba(255,250,252,.96)', barBg: 'rgba(255,247,250,.97)'
    });
    return mode === 'dark' ? {
      bg: '#0B0B0C', card: '#171719', card2: '#171719', card3: '#242426',
      field: '#242426', elevated: '#242426', sheet: '#171719',
      accent: '#F0F0F3', accentText: '#F0F0F3', accentSoft: '#29292C', onAccent: '#171719', rating: '#E7E7EC',
      text: '#F5F5F7', text2: '#D8D8DC', sub: '#A8A8B0', sub2: '#A8A8B0', placeholder: '#A8A8B0',
      border: '#303033', hairline: '#45454A', fill: '#242426', fill2: '#1D1D1F',
      green: '#73D49A', gold: '#F4B65E', red: '#FF8C8C', blue: '#91BEF6',
      scrim: 'rgba(0,0,0,.68)', navBg: 'rgba(23,23,25,.96)', barBg: 'rgba(11,11,12,.97)',
      shadow: '0 12px 32px rgba(0,0,0,.26)', cardShadow: 'none',
      trackOff: '#45454A', toggleBg: '#303033'
    } : {
      bg: '#F7F9F9', card: '#FFFFFF', card2: '#FFFFFF', card3: '#EEF3F3',
      field: '#EEF3F3', elevated: '#FFFFFF', sheet: '#FFFFFF',
      accent: '#006F6B', accentText: '#006F6B', accentSoft: '#E1F1EE', onAccent: '#FFFFFF', rating: '#006F6B',
      text: '#17282B', text2: '#344D51', sub: '#566C70', sub2: '#566C70', placeholder: '#566C70',
      border: '#DCE5E6', hairline: '#C6D5D7', fill: '#EEF3F3', fill2: '#F3F6F6',
      green: '#187A48', gold: '#A85D00', red: '#B83240', blue: '#2867AD',
      scrim: 'rgba(12,29,32,.42)', navBg: 'rgba(255,255,255,.96)', barBg: 'rgba(247,249,249,.97)',
      shadow: '0 12px 32px rgba(23,40,43,.1)', cardShadow: 'none',
      trackOff: '#BCCDD0', toggleBg: '#E3EBEC'
    };
  }

  function subtitle(work) {
    var value = String(work && work.ar || '').trim();
    if (/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(value)) return '';
    return value.toLocaleLowerCase() === String(work && work.title || '').trim().toLocaleLowerCase() ? '' : value;
  }

  function withBase(mode,base){return isCustom(mode)?customMode(customSettings(mode).color,base):normalizeMode(base);}
  return Object.freeze({palette:palette,subtitle:subtitle,normalizeMode:normalizeMode,customMode:customMode,customSettings:customSettings,withBase:withBase,
    isCustom:isCustom,baseMode:baseMode,isDark:isDark,tokens:tokens,readMode:readMode,saveMode:saveMode});
});
