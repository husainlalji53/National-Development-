import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(project, 'dist');
const context = { window: {} };
for (const file of ['content.js', 'catalog-data.js', 'catalog-translations.js']) vm.runInNewContext(readFileSync(join(dist, file), 'utf8'), context);
const { translations, business, categories } = context.window.ND_CONTENT;
const pages = readdirSync(dist).filter(file => file.endsWith('.html'));
let elements = 0;
for (const file of pages) {
  const html = readFileSync(join(dist, file), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-aria|-placeholder|-alt)?="([^"]+)"/g)].map(match => match[1]);
  elements += keys.length;
  for (const [language, words] of Object.entries(translations)) {
    for (const key of keys) assert.equal(typeof words[key], 'string', `Missing ${language} translation: ${file}/${key}`);
    assert.deepEqual(Object.keys(words).sort(), Object.keys(translations.en).sort(), `Mismatched translation keys: ${language}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs in ${file}`);
  for (const [, references] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
    for (const id of references.split(/\s+/)) assert.ok(ids.includes(id), `Broken accessibility reference: ${file}#${id}`);
  }
  assert.ok(html.includes('class="skip-link" href="#main"'), `Missing keyboard skip link: ${file}`);
  assert.ok(html.includes('id="main" tabindex="-1"'), `Skip destination must accept focus: ${file}`);

  for (const [, hash] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(hash), `Missing anchor: ${file}#${hash}`);
  for (const [, asset] of html.matchAll(/(?:src|href)="\.\/([^"?#]+)"/g)) assert.ok(existsSync(join(dist, asset)), `Missing asset: ${asset}`);
  for (const [, attributes] of html.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/g)) assert.ok(attributes.includes('noopener'), 'Unprotected external link');
  for (const [, href] of html.matchAll(/<a\b[^>]*data-map[^>]*href="([^"]+)"/g)) assert.equal(href, business.mapsUrl);
  for (const [, target, hash] of html.matchAll(/href="\.\/([^"?#]+\.html)#[^"]*?([^"#]+)"/g)) {
    const linked = readFileSync(join(dist, target), 'utf8');
    assert.ok(linked.includes(`id="${hash}"`), `Missing cross-page anchor ${target}#${hash}`);
  }
  assert.ok(html.includes('name="viewport"'), `Missing mobile viewport in ${file}`);
  assert.ok(html.includes('noindex,nofollow'), `Private review must stay unindexed: ${file}`);
  for (const script of ['content.js', 'catalog-data.js', 'catalog-translations.js', 'catalog-core.js', 'app.js', 'catalogue.js']) assert.ok(html.includes(`src="./${script}"`), `Missing script ${script} in ${file}`);
}
for (const file of ['styles.css', 'catalogue.css']) {
  const css = readFileSync(join(dist, file), 'utf8');
  for (const [, asset] of css.matchAll(/url\(['"]?\.\/([^)'"?]+)['"]?\)/g)) assert.ok(existsSync(join(dist, asset)), `Missing CSS asset: ${asset}`);
  assert.ok(css.includes('prefers-reduced-motion'), `Missing reduced motion support: ${file}`);
}
assert.equal(business.mapsUrl, 'https://share.google/79rN9pEdDhILrTdNx');
assert.equal(business.phone, '+96597212685');
assert.equal(business.email, 'sales.ndgtc@gmail.com');
assert.equal(new Set(categories.map(category => category.id)).size, categories.length, 'Duplicate category IDs');
for (const category of categories) for (const locale of ['en', 'ar']) {
  assert.ok(category[locale].title && category[locale].description && category[locale].items.length, `Incomplete category: ${category.id}/${locale}`);
  assert.equal(category.itemImages.length, category[locale].items.length, `Image/name mismatch: ${category.id}/${locale}`);
  for (const images of category.itemImages) for (const file of images) assert.ok(existsSync(join(dist, 'assets/products', `${file}.jpg`)), `Missing photograph: ${file}`);
}
const html = readFileSync(join(dist, 'index.html'), 'utf8');
assert.equal((html.match(/href="\.\/assets\/national-development-profile\.pdf"/g) || []).length, 1, 'Homepage must retain exactly one profile link');
assert.ok(statSync(join(dist, 'assets/hero.webp')).size < 700_000, 'Oversized hero');
assert.ok(statSync(join(dist, 'assets/categories.webp')).size < 700_000, 'Oversized categories');
console.log(`PASS: ${pages.length} pages, ${elements} translated elements in two languages, local assets and anchors, exact Maps links, category previews, and image budgets.`);
console.log('Source checks do not replace visual browser QA.');
