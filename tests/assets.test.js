import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSETS, SOURCE_ASSETS } from '../src/data/assets.js';

const repositoryRoot = resolve(import.meta.dirname, '..');
const manifestPath = resolve(repositoryRoot, 'tools/source-assets.json');

describe('source asset contract', () => {
  it('keeps every audited first-party visual in an allowlisted local registry', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest).toHaveLength(169);
    expect(new Set(manifest.map(({ id }) => id)).size).toBe(manifest.length);
    expect(new Set(manifest.map(({ local }) => local)).size).toBe(manifest.length);

    manifest.forEach((asset) => {
      expect(asset.required).toBe(true);
      expect(asset.remote).toMatch(/^https:\/\/cdn\.prod\.website-files\.com\//);
      expect(asset.local).toMatch(/^public\/assets\/source\/[a-z0-9-]+\/[a-z0-9-]+\.[a-z0-9]+$/);
      expect(asset.mediaType).toMatch(/^(image|video)$/);
      expect(asset.section).toMatch(/^[a-z0-9-]+$/);
      expect(SOURCE_ASSETS[asset.id]).toBe(asset.local.replace(/^public/, ''));
      expect(ASSETS[asset.id]).toBe(asset.local.replace(/^public/, ''));
    });
  });

  it('stores each required source asset as non-empty local media', () => {
    Object.entries(SOURCE_ASSETS).forEach(([id, publicPath]) => {
      const localPath = resolve(repositoryRoot, 'public', `.${publicPath}`);
      expect(existsSync(localPath), id).toBe(true);
      expect(statSync(localPath).size, id).toBeGreaterThan(64);
    });
  });
});
