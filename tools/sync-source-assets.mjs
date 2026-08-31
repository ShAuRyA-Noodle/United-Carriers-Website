import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(repositoryRoot, 'tools/source-assets.json');
const sourceRoot = resolve(repositoryRoot, 'public/assets/source');
const allowedHost = 'cdn.prod.website-files.com';
const checkOnly = process.argv.includes('--check');

const readManifest = async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('Asset manifest must be a non-empty array.');
  }

  const ids = new Set();
  const locals = new Set();
  for (const asset of manifest) {
    const { id, remote, local, required, mediaType, section } = asset;
    if (![id, remote, local, mediaType, section].every((value) => typeof value === 'string' && value)) {
      throw new Error(`Invalid manifest record: ${JSON.stringify(asset)}`);
    }
    if (required !== true) throw new Error(`${id}: source assets must declare required: true.`);
    if (ids.has(id) || locals.has(local)) throw new Error(`${id}: duplicate asset id or local path.`);
    ids.add(id);
    locals.add(local);

    const url = new URL(remote);
    if (url.protocol !== 'https:' || url.hostname !== allowedHost) {
      throw new Error(`${id}: remote URL is not on the audited first-party CDN.`);
    }
    if (!local.startsWith('public/assets/source/')) throw new Error(`${id}: unsafe local path.`);
    const localPath = resolve(repositoryRoot, local);
    if (!localPath.startsWith(`${sourceRoot}/`)) throw new Error(`${id}: local path escapes source assets.`);
  }

  return manifest;
};

const hasPrefix = (bytes, prefix) => prefix.every((value, index) => bytes[index] === value);

const validPayload = (asset, bytes) => {
  if (bytes.byteLength < 64) return false;
  const head = bytes.subarray(0, 64);

  if (asset.mediaType === 'video') {
    return String.fromCharCode(...head.subarray(4, 8)) === 'ftyp'
      || hasPrefix(head, [0x1a, 0x45, 0xdf, 0xa3]);
  }

  return hasPrefix(head, [0x89, 0x50, 0x4e, 0x47])
    || hasPrefix(head, [0xff, 0xd8, 0xff])
    || hasPrefix(head, [0x47, 0x49, 0x46, 0x38])
    || (hasPrefix(head, [0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...head.subarray(8, 12)) === 'WEBP')
    || String.fromCharCode(...head.subarray(4, 8)) === 'ftyp'
    || new TextDecoder().decode(head).includes('<svg');
};

const localPathFor = (asset) => resolve(repositoryRoot, asset.local);

const inspectLocal = async (asset) => {
  const path = localPathFor(asset);
  if (!existsSync(path)) return false;
  try {
    const bytes = await readFile(path);
    return validPayload(asset, bytes);
  } catch {
    return false;
  }
};

const fetchAsset = async (asset) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(asset.remote, { redirect: 'error' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith(`${asset.mediaType}/`)) {
        throw new Error(`unexpected content type ${contentType || 'missing'}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!validPayload(asset, bytes)) throw new Error('response failed file-signature validation');
      return bytes;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveAttempt) => setTimeout(resolveAttempt, attempt * 250));
    }
  }
  throw new Error(`${asset.id}: ${lastError?.message ?? 'download failed'}`);
};

const writeAsset = async (asset, bytes) => {
  const path = localPathFor(asset);
  const temporaryPath = `${path}.part`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(temporaryPath, bytes);
  await rename(temporaryPath, path);
};

const run = async () => {
  const manifest = await readManifest();
  const invalid = [];
  const ready = [];

  for (const asset of manifest) {
    if (await inspectLocal(asset)) ready.push(asset);
    else invalid.push(asset);
  }

  if (checkOnly) {
    if (invalid.length) {
      throw new Error(`Missing or invalid source assets (${invalid.length}): ${invalid.map(({ id }) => id).join(', ')}`);
    }
    console.log(`Validated ${ready.length} source assets.`);
    return;
  }

  let downloaded = 0;
  for (const asset of invalid) {
    const bytes = await fetchAsset(asset);
    await writeAsset(asset, bytes);
    downloaded += 1;
    console.log(`Downloaded ${asset.id}`);
  }

  const failedChecks = [];
  for (const asset of manifest) {
    if (!(await inspectLocal(asset))) failedChecks.push(asset.id);
  }
  if (failedChecks.length) throw new Error(`Post-download validation failed: ${failedChecks.join(', ')}`);

  console.log(`Source asset sync complete: ${downloaded} downloaded, ${ready.length} already valid, ${manifest.length} validated.`);
};

run().catch(async (error) => {
  const partFiles = [];
  for (const asset of await readManifest().catch(() => [])) {
    const part = `${localPathFor(asset)}.part`;
    if (existsSync(part)) partFiles.push(part);
  }
  await Promise.all(partFiles.map((part) => unlink(part).catch(() => {})));
  console.error(`Source asset sync failed: ${error.message}`);
  process.exitCode = 1;
});
