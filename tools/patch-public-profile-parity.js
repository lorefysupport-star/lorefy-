const fs = require('node:fs');
const path = require('node:path');

const target = path.resolve(__dirname, '..', 'uploads', 'files', 'lorefy-app.js');
let source = fs.readFileSync(target, 'utf8');

const before = 'genres:p.genres||[],follower_count:Number(p.follower_count)||0,following_count:Number(p.following_count)||0,is_following:p.is_following===!0';
const after = 'genres:p.genres||[],social_links:p.social_links||{},favorite_work_ids:Array.isArray(p.favorite_work_ids)?p.favorite_work_ids:[],favorite_character_ids:Array.isArray(p.favorite_character_ids)?p.favorite_character_ids:[],completed_count:Number(p.completed_count)||0,follower_count:Number(p.follower_count)||0,following_count:Number(p.following_count)||0,is_following:p.is_following===!0';

if (!source.includes(after)) {
  const matches = source.split(before).length - 1;
  if (matches !== 1) throw new Error(`Public profile hydration: expected one match, found ${matches}`);
  source = source.replace(before, after);
}

const followBefore = 'o=cloudFollowing.some(y=>y.id===t.id),s=';
const followAfter = 'o=cloudFollowing.some(y=>y.id===t.id)||t.is_following===!0,s=';
if (!source.includes(followAfter)) {
  const matches = source.split(followBefore).length - 1;
  if (matches !== 1) throw new Error(`Public profile follow state: expected one match, found ${matches}`);
  source = source.replace(followBefore, followAfter);
}

fs.writeFileSync(target, source);

console.log('Public profile hydration patched.');
