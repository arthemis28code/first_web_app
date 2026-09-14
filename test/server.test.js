import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handler } from '../server.js';

let base;
let instance;

before(async () => {
  instance = createServer(handler);
  await new Promise((resolve) => instance.listen(0, resolve));
  const { port } = instance.address();
  base = `http://127.0.0.1:${port}`;
});

after(() => new Promise((resolve) => instance.close(resolve)));

function get(pathname, headers = {}) {
  return fetch(base + pathname, { headers });
}

test('GET /api/health returns ok', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/json');
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('GET /api/hello greets default name', async () => {
  const res = await get('/api/hello');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { message: 'Hello, World!' });
});

test('GET /api/hello echoes provided name', async () => {
  const res = await get('/api/hello?name=Mew');
  assert.deepEqual(await res.json(), { message: 'Hello, Mew!' });
});

test('GET /api/treasures returns 5 treasures', async () => {
  const res = await get('/api/treasures');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.length, 5);
  assert.equal(data[0].id, 'acqua-alta');
  assert.equal(data[0].ordinal, 1);
  assert.ok(data.every((t) => t.title && t.body && t.catQuote));
});

test('GET / serves index.html', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const body = await res.text();
  assert.match(body, /Venice Treasure Quest/);
  assert.match(body, /<main id="app"/);
});

test('GET /index.html serves index.html', async () => {
  const res = await get('/index.html');
  assert.equal(res.status, 200);
  assert.match(await res.text(), /id="app"/);
});

test('GET /app.js serves javascript', async () => {
  const res = await get('/app.js');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/javascript/);
  assert.match(await res.text(), /init\(\)/);
});

test('GET /style.css serves css', async () => {
  const res = await get('/style.css');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/css/);
  assert.match(await res.text(), /\.sheet/);
});

test('unknown route returns 404', async () => {
  const res = await get('/nope');
  assert.equal(res.status, 404);
});

test('path traversal attempts are rejected', async () => {
  for (const p of ['/../server.js', '/%2e%2e/server.js', '/..%2fserver.js', '/app.js/../../server.js']) {
    const res = await get(p);
    assert.equal(res.status, 404, `${p} should be rejected`);
  }
});
