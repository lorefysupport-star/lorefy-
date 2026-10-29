(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyProfileLayout = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const normalize = value => value === 'immersive' || value === 'reader' ? value : 'normal';
  const forProfile = profile => normalize(profile && profile.profile_layout);
  const options = lang => [
    {value:'normal', label:lang === 'en' ? 'Normal' : '\u0639\u0627\u062f\u064a'},
    {value:'immersive', label:lang === 'en' ? 'Panoramic' : '\u0628\u0627\u0646\u0648\u0631\u0627\u0645\u064a'},
    {value:'reader', label:lang === 'en' ? 'Reader' : '\u0627\u0644\u0642\u0627\u0631\u0626'}
  ];
  function Picker(props) {
    const h = root.React.createElement;
    const en = props.lang === 'en';
    return h('fieldset', {className:'lf-profile-layout-picker', disabled:!!props.disabled, 'data-no-translate':'1'},
      h('legend', null, en ? 'Profile layout' : '\u0648\u0627\u062c\u0647\u0629 \u0627\u0644\u0628\u0631\u0648\u0641\u0627\u064a\u0644'),
      h('div', {className:'lf-profile-layout-options'}, options(props.lang).map(option =>
        h('label', {key:option.value, className:'lf-profile-layout-option', 'data-layout-option':option.value},
          h('input', {type:'radio', name:'profile-layout', value:option.value, checked:normalize(props.value) === option.value,
            onChange:() => props.onChange(option.value)}),
          h('span', {className:'lf-profile-layout-mini', 'data-mini-layout':option.value, 'aria-hidden':true},
            props.banner && h('img', {className:'lf-layout-mini-banner', src:props.banner, alt:'', decoding:'async'}),
            h('span', {className:'lf-layout-mini-avatar'}, props.avatar && h('img', {src:props.avatar, alt:'', decoding:'async'})),
            h('i', {className:'lf-layout-mini-name'}), h('i', {className:'lf-layout-mini-stats'})),
          h('strong', null, option.label)))));
  }
  return {normalize, forProfile, options, Picker};
});
