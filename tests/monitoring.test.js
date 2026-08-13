const test = require('node:test');
const assert = require('node:assert/strict');

const { sanitizeMessage, createEventBuffer } = require('../monitoring/lorefy-sentry.js');

test('monitoring redacts query strings and common secrets', () => {
  const clean = sanitizeMessage('Failed https://api.example.test/path?token=secret&user=1 Bearer abc.def');
  assert.equal(clean.includes('secret'), false);
  assert.equal(clean.includes('abc.def'), false);
  assert.match(clean, /\?\[redacted\]/);
});

test('monitoring redacts structured credentials and account identifiers', () => {
  const clean = sanitizeMessage(JSON.stringify({ access_token: 'secret-token', email: 'reader@example.com', user_id: 'user-123' }));
  assert.equal(clean.includes('secret-token'), false);
  assert.equal(clean.includes('reader@example.com'), false);
  assert.equal(clean.includes('user-123'), false);
  assert.match(clean, /\[redacted\]/);
});

test('monitoring keeps only the newest bounded events', () => {
  const buffer = createEventBuffer(2);
  buffer.push({ id: 1 });
  buffer.push({ id: 2 });
  buffer.push({ id: 3 });
  assert.deepEqual(buffer.list().map((event) => event.id), [3, 2]);
});
