const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const folder = path.join(root, 'qa/elf-concepts');

test('elf concepts remain twelve preliminary choices outside the runtime catalog', () => {
  const file = path.join(folder, 'concepts.json');
  assert.ok(fs.existsSync(file), 'The four-family concept manifest must exist');
  const data = JSON.parse(fs.readFileSync(file));
  assert.equal(data.stage, 'static-concepts');
  assert.equal(data.runtimeEnabled, false);
  assert.equal(data.localOnly, true);
  assert.equal(data.families.length, 4);
  const ids = new Set();
  for (const [i, family] of data.families.entries()) {
    assert.equal(family.options.length, 3);
    assert.match(family.board, /^[a-z-]+\.png$/);
    const png = fs.readFileSync(path.join(folder, family.board));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1536);
    assert.equal(png.readUInt32BE(20), 1024);
    assert.equal(png[25], 6, 'Artwork must retain RGBA transparency');
    for (const [column, option] of family.options.entries()) {
      assert.equal(option.code, `${i + 1}${'ABC'[column]}`);
      assert.ok(option.motion.length > 35);
      assert.ok(!ids.has(option.code));
      ids.add(option.code);
    }
  }
  assert.equal(ids.size, 12);
  assert.deepEqual(data.approvedCodes, ['1A', '1B', '1C', '2A', '2B', '2C']);
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'qa/motion-atelier/collections.json')));
  assert.equal(catalog.length, 6, 'Existing Atelier catalog stays unchanged');
  assert.ok(!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('elf-concepts'));
});

test('ear twitch is small, intermittent and independently timed with an exact resting pose', () => {
  const file = path.join(folder, 'ear-motion.js');
  assert.ok(fs.existsSync(file), 'A separate ear-motion preview rig must exist');
  const rig = require(file);
  for (const code of ['1A', '1B', '1C']) {
    assert.deepEqual(rig.sample(code, 0), {left: 0, right: 0});
    assert.deepEqual(rig.sample(code, 3), {left: 0, right: 0});
    let resting = 0, independent = false, moving = false;
    for (let t = 0; t < 12; t += .02) {
      const pose = rig.sample(code, t);
      assert.ok(Math.abs(pose.left) <= .055 && Math.abs(pose.right) <= .055);
      if (pose.left === 0 && pose.right === 0) resting++;
      if (Math.abs(pose.left - pose.right) > .002) independent = true;
      if (Math.abs(pose.left) > .01) moving = true;
      const loop = rig.sample(code, t + 12);
      assert.ok(Math.abs(loop.left - pose.left) < 1e-9 && Math.abs(loop.right - pose.right) < 1e-9);
    }
    assert.ok(resting > 400, 'Most of the loop is a resting pose, not continuous wobble');
    assert.ok(independent && moving);
    for (const ear of rig.geometry(code)) {
      assert.ok(ear.polygon.every(([x, y]) => x >= 0 && x <= 517 && y >= 0 && y < 300));
      assert.ok(ear.pivot[1] > 200 && ear.pivot[1] < 280);
    }
  }
  assert.throws(() => rig.sample('2A', 1), /Unknown/);
});
