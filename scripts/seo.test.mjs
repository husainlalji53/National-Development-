import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const context = {window:{}, URL, URLSearchParams};
for (const file of ['catalog-data.js','seo.js']) vm.runInNewContext(readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8'),context);
const seo = context.window.ND_SEO;
test('canonical URLs retain product identity and language but discard tracking', () => {
  assert.equal(seo.metadata('home','en','utm_source=test').canonical,seo.origin+'/');
  const en = seo.metadata('product','en','id=helmets&utm_source=test');
  const ar = seo.metadata('product','ar','id=helmets&utm_source=test');
  assert.equal(en.canonical,seo.origin+'/product.html?id=helmets');
  assert.equal(ar.canonical,seo.origin+'/product.html?id=helmets&lang=ar');
  assert.notEqual(en.canonical,seo.metadata('product','en','id=cables').canonical);
  assert.equal(seo.metadata('catalogue','en','page=2').canonical,seo.origin+'/catalogue.html?page=2');
});
test('enquiry, missing products and filtered searches remain out of search results', () => {
  for (const [page,params] of [['enquiry',''],['product',''],['product','id=unknown'],['catalogue','q=drill'],['catalogue','category=safety'],['catalogue','sort=name']]) assert.equal(seo.metadata(page,'en',params).indexable,false);
  for (const [page,params] of [['home',''],['catalogue',''],['product','id=helmets']]) assert.equal(seo.metadata(page,'en',params).indexable,true);
});
test('sitemap matches all public canonical URLs and reciprocal language alternatives', () => {
  const entries=seo.entries();
  assert.equal(entries.length,256);
  const urls=new Set(entries.map(entry=>entry.canonical));
  assert.equal(urls.size,entries.length);
  const xml=readFileSync(new URL('../dist/sitemap.xml',import.meta.url),'utf8');
  const locs=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1].replaceAll('&amp;','&'));
  assert.deepEqual(new Set(locs),urls);
  for(const entry of entries){assert.ok(entry.indexable);assert.ok(urls.has(entry.en)&&urls.has(entry.ar));assert.ok(entry.canonical.startsWith(seo.origin+'/'));}
  assert.ok(!xml.includes('enquiry.html'));
  assert.ok(readFileSync(new URL('../dist/robots.txt',import.meta.url),'utf8').includes(`Sitemap: ${seo.origin}/sitemap.xml`));
});
test('business metadata contains supplied contact details without invented ratings or hours', () => {
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(data['@type'],'HardwareStore');assert.equal(data.url,seo.origin+'/');
  assert.equal(data.telephone,'+96597212685');assert.equal(data.email,'sales.ndgtc@gmail.com');
  assert.equal(data.address.addressCountry,'KW');assert.equal(data.hasMap,'https://share.google/79rN9pEdDhILrTdNx');
  for(const key of ['aggregateRating','review','openingHours','openingHoursSpecification','geo'])assert.equal(data[key],undefined);
});
