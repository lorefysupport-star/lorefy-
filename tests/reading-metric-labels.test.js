const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const i18n = require('../modules/lorefy-i18n.js');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const h = (type, props, ...children) => ({type, props:props || {}, children:children.flat(Infinity)});
const nodes = tree => tree && typeof tree === 'object' ? [tree, ...tree.children.flatMap(nodes)] : [];
const text = tree => tree && typeof tree === 'object' ? tree.children.map(text).join(' ') : String(tree ?? '');

function stats(hours) {
  const window = {React:{createElement:h}, NenIcons:{}};
  vm.runInNewContext(source('modules/lorefy-v2.js'), {window});
  return window.LorefyV2.StatsScreen({ctx:{readHours:hours, achStats:{}}});
}

test('estimated hour labels translate explicitly in Arabic and English', () => {
  assert.equal(i18n.translate('ساعات تقديرية', 'en'), 'Estimated hours');
  assert.equal(i18n.translate('ساعة تقديرية', 'en'), 'Estimated hour');
  assert.equal(i18n.translate('من التقدم المحفوظ', 'en'), 'From saved progress');
  assert.equal(i18n.translate('ساعات تقديرية', 'ar'), 'ساعات تقديرية');
});

test('recap estimate counters keep their value and localize without mixed-language text', () => {
  assert.equal(i18n.translate('≈ 84 ساعات تقديرية', 'en'), '≈ 84 estimated hours');
  assert.equal(i18n.translate('≈ 1 ساعات تقديرية', 'en'), '≈ 1 estimated hour');
  assert.equal(i18n.translate('≈ 0 ساعات تقديرية', 'en'), '≈ 0 estimated hours');
});

test('owner metric labels the unchanged saved hour value as estimated', () => {
  const app = source('uploads/files/lorefy-app.js');
  const match = app.match(/val:Ut,label:("(?:[^"\\]|\\.)*")/);
  assert.ok(match);
  assert.equal(JSON.parse(match[1]), 'ساعات تقديرية');
  assert.ok(app.includes('"ساعات تقديرية":Number(n.val)===1?"Estimated hour":"Estimated hours"'));
});

test('visitor hour metric is an estimate without changing the projected number', () => {
  const window = {React:{createElement:h, useState:value => [typeof value === 'function' ? value() : value, () => {}], useEffect:() => {},useRef:value=>({current:value})}, NenIcons:{}};
  vm.runInNewContext(source('modules/lorefy-public-profile.js'), {window, URL});
  const tree = window.LorefyPublicProfile({profile:{id:'fixture-reader', read_hours:237}, reviews:[], workById:() => null});
  const clock = nodes(tree).find(node => node.props['data-profile-stat'] === 'Clock');
  assert.match(text(clock), /237/);
  assert.match(text(clock), /ساعات تقديرية/);
});

test('statistics do not claim cumulative saved hours are a yearly timer', () => {
  const tree = stats(84);
  assert.match(text(tree), /من التقدم المحفوظ/);
  assert.match(text(tree), /ساعات تقديرية/);
  assert.doesNotMatch(text(tree), /ساعة تقديرية/);
  assert.doesNotMatch(text(tree), /هذا العام/);
});

test('estimate method is a native disclosure with the existing fallback weights', () => {
  const detail = nodes(stats(84)).find(node => node.type === 'details');
  assert.ok(detail);
  assert.equal(detail.props.dir, 'auto');
  assert.ok(detail.children.some(node => node.type === 'summary'));
  const explanation = text(detail);
  for (const value of ['12', '1.5', '90', 'ليس مؤقّت قراءة']) assert.ok(explanation.includes(value));
  assert.notEqual(i18n.translate(text(detail.children.find(node => node.type === 'p')), 'en'), text(detail.children.find(node => node.type === 'p')));
});

test('estimated-hour card labels wrap instead of being clipped on small phones', () => {
  const label = nodes(stats(84)).find(node => node.type === 'small' && text(node) === 'ساعات تقديرية');
  assert.ok(label);
  assert.equal(label.props.style.whiteSpace, 'normal');
  assert.notEqual(label.props.style.overflow, 'hidden');
});

test('zero hour estimates stay zero instead of inventing a reading session', () => {
  const tree = stats(0);
  const metric = nodes(tree).find(node => node.type === 'div' && node.props.key === 'ساعات تقديرية');
  assert.ok(metric);
  assert.ok(nodes(metric).some(node => node.type === 'strong' && text(node) === (0).toLocaleString('ar-SA')));
});

test('legacy visitor and recap labels also identify estimated hours', () => {
  const growth = source('modules/lorefy-growth-features.js');
  assert.ok(growth.includes('[Number(profile.read_hours) || 0, "ساعات تقديرية"]'));
  assert.ok(growth.includes('s.hours + " ساعات تقديرية"'));
});
