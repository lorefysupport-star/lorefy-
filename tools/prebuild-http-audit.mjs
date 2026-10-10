import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'config/lorefy-release.json'), 'utf8'));
const publicConfig = JSON.parse(await fs.readFile(path.join(root, 'config/lorefy-build-public.json'), 'utf8'));
const mediaGateway = config.catalogProxyUrl || publicConfig.catalogProxyUrl;
const headers = { apikey: config.supabasePublishableKey, 'Content-Type': 'application/json' };
const checks = [];
async function request(url, options = {}) {
  return fetch(url, { headers, signal: AbortSignal.timeout(20000), ...options });
}
async function check(name, run) {
  try { checks.push({ name, ...await run() }); }
  catch (error) { checks.push({ name, passed: false, error: error.name }); }
  console.log(JSON.stringify(checks.at(-1)));
}

await check('live-auth-providers', async () => {
  const response = await request(config.supabaseUrl + '/auth/v1/settings');
  const data = await response.json();
  const providers = { google: data.external?.google, apple: data.external?.apple, email: data.external?.email };
  return { passed: response.ok && providers.google === true && providers.apple === true && providers.email === false, status: response.status, providers };
});
for (const provider of ['google', 'apple']) {
  await check(provider + '-authorization-redirect', async () => {
    const url = new URL(config.supabaseUrl + '/auth/v1/authorize');
    url.searchParams.set('provider', provider);
    url.searchParams.set('redirect_to', 'com.lorefy.app://auth/callback');
    const response = await request(url, { redirect: 'manual' });
    const location = response.headers.get('location');
    const host = location ? new URL(location).hostname : null;
    return { passed: response.status === 302 && host === (provider === 'google' ? 'accounts.google.com' : 'appleid.apple.com'), status: response.status, host };
  });
}
for (const name of ['privacyPolicyUrl', 'supportUrl', 'appUrl']) {
  await check(name, async () => {
    const response = await request(config[name]);
    await response.arrayBuffer();
    return { passed: response.ok, status: response.status };
  });
}
for (const name of ['delete-account', 'apple-authorization']) {
  await check(name + '-rejects-anonymous', async () => {
    const response = await request(config.supabaseUrl + '/functions/v1/' + name, { method: 'POST', body: JSON.stringify({ confirm: true }) });
    return { passed: [401, 403].includes(response.status), status: response.status };
  });
}
const rpcBodies = {
  sync_user_state: { state_patch: {}, removed_keys: [], expected_version: 0 },
  save_my_profile: { profile_name: 'Unauthorized request', requested_username: 'unauthorized_request', profile_bio: '', profile_avatar: '', profile_banner: '', profile_genres: [], profile_social_links: {}, profile_is_private: false }
};
for (const [name, body] of Object.entries(rpcBodies)) {
  await check(name + '-rejects-anonymous', async () => {
    const response = await request(config.supabaseUrl + '/rest/v1/rpc/' + name, { method: 'POST', body: JSON.stringify(body) });
    return { passed: [401, 403].includes(response.status), status: response.status };
  });
}
const images = [
  'https://s4.anilist.co/file/anilistcdn/character/large/b7857-W7WpcGlw2aeH.png',
  'https://s4.anilist.co/file/anilistcdn/character/large/b423-AmVFCaJJOBsc.png',
  'https://s4.anilist.co/file/anilistcdn/character/large/b424-Jfrsf8I7zBps.png',
  'https://covers.openlibrary.org/b/id/10544254-L.jpg',
  'https://cdn.myanimelist.net/images/manga/2/253119l.jpg'
];
for (const [index, source] of images.entries()) {
  await check('share-media-' + (index + 1), async () => {
    const response = await request(mediaGateway + '/media?url=' + encodeURIComponent(source));
    const bytes = (await response.arrayBuffer()).byteLength;
    const type = response.headers.get('content-type');
    const cors = response.headers.get('access-control-allow-origin');
    return { passed: response.ok && /^image\//.test(type) && bytes > 1000 && cors === '*', status: response.status, type, bytes, cors };
  });
}
const report = { checkedAt: new Date().toISOString(), passed: checks.every(item => item.passed), checks };
await fs.mkdir(path.join(root, 'output/prebuild'), { recursive: true });
await fs.writeFile(path.join(root, 'output/prebuild/http-audit.json'), JSON.stringify(report, null, 2) + '\n');
if (!report.passed) process.exitCode = 1;
