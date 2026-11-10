const fs = require('node:fs');
const path = require('node:path');
const { minify } = require('terser');

async function generate(source) {
  // Keep the full API and Lorefy's scoped hydration patch; never mangle properties.
  const result = await minify(source, {
    compress: true,
    mangle: true,
    keep_fnames: true,
    format: { comments: 'some' }
  });
  const code = result.code + '\n';
  if (!result.code || !code.includes('@license lucide v0.469.0 - ISC')) {
    throw new Error('Lucide runtime must retain its code and license');
  }
  if (Buffer.byteLength(code) >= 400 * 1024) {
    throw new Error('Lucide runtime exceeds its 400 KiB loading budget');
  }
  return code;
}

async function build() {
  const root = path.resolve(__dirname, '..');
  const source = fs.readFileSync(path.join(root, 'vendor/lucide.js'), 'utf8');
  const runtime = await generate(source);
  fs.writeFileSync(path.join(root, 'vendor/lucide.runtime.min.js'), runtime);
  return { sourceBytes: Buffer.byteLength(source), runtimeBytes: Buffer.byteLength(runtime) };
}

if (require.main === module) {
  build().then(result => console.log(JSON.stringify(result))).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { generate, build };
