import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const context = { window: {} };
for (const file of ['content.js', 'catalog-data.js', 'catalog-translations.js', 'catalog-core.js']) {
  vm.runInNewContext(readFileSync(join(root, 'dist', file), 'utf8'), context);
}
const core = context.window.ND_CORE;
const json = value => JSON.parse(JSON.stringify(value));

test('every catalogue product has a unique ID, both names, a known category and a real image', () => {
  const categories = new Set(context.window.ND_CONTENT.categories.map(group => group.id));
  assert.equal(core.products.length, 121);
  assert.equal(new Set(core.products.map(product => product.id)).size, 121);
  for (const product of core.products) {
    assert.ok(product.en && product.ar && categories.has(product.category));
    assert.ok(existsSync(join(root, 'dist/assets/products', `${product.image}.jpg`)));
    assert.ok(product.sourcePage >= 4 && product.sourcePage <= 11);
  }
});

test('search works for English, Arabic, vowel marks and mixed-case input', () => {
  assert.ok(core.searchProducts({query: 'DRILL'}).some(product => product.id === 'drills'));
  assert.ok(core.searchProducts({query: 'أقطاب'}).some(product => product.id === 'welding-rods'));
  assert.ok(core.searchProducts({query: 'اقطاب'}).some(product => product.id === 'welding-rods'));
  assert.ok(core.searchProducts({query: 'قُفّازات'}).some(product => product.id === 'gloves'));
  assert.ok(core.searchProducts({query: 'مثقاب'}).some(product => product.id === 'drills'));
  assert.ok(core.searchProducts({query: 'tire repair'}).some(product => product.id === 'repair-kits'));
  assert.equal(core.searchProducts({query: 'does-not-exist-xyz'}).length, 0);
});

test('category filtering and ordering preserve the complete source catalogue', () => {
  const all = [];
  for (const category of context.window.ND_CONTENT.categories) {
    const results = core.searchProducts({category: category.id});
    assert.ok(results.length > 0);
    assert.ok(results.every(product => product.category === category.id));
    all.push(...results);
  }
  assert.equal(all.length, 121);
  const sorted = core.searchProducts({sort: 'name', language: 'en'});
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i-1].en.localeCompare(sorted[i].en, 'en') <= 0);
  assert.equal(core.products[0].id, 'coveralls', 'Sorting must not change source order');
});

test('corrupt saved data and impossible quantities cannot become enquiry lines', () => {
  for (const value of [null, {}, 'bad', false]) assert.deepEqual(json(core.sanitizeItems(value)), []);
  const invalid = [0, -1, 1000000, Infinity, NaN, '', 'not-a-number', null, true, [], [1], 0.001];
  for (const qty of invalid) {
    assert.equal(core.validQuantity(qty), false, String(qty));
    assert.deepEqual(json(core.sanitizeItems([{id:'helmets',qty}])), []);
  }
  assert.deepEqual(json(core.sanitizeItems([{id:'unknown',qty:1}])), []);
});

test('decimal quantities, duplicate updates, units and notes survive storage round trips', () => {
  let list = core.upsertItem([], {id:'cables',qty:'2.5',unit:'m',note:'Required cable size: 4 mm²'});
  list = core.upsertItem(list, {id:'helmets',qty:10,unit:'pcs',note:'Yellow'});
  list = core.upsertItem(list, {id:'cables',qty:25,unit:'m',note:'Updated requirement'});
  assert.equal(list.length, 2);
  assert.equal(list[0].qty, 25);
  assert.equal(list[0].unit, 'm');
  assert.equal(list[0].note, 'Updated requirement');
  assert.deepEqual(json(core.sanitizeItems(JSON.parse(JSON.stringify(list)))), json(list));
  assert.throws(() => core.upsertItem(list, {id:'cables',qty:-1,unit:'m'}));
  assert.throws(() => core.upsertItem(list, {id:'cables',qty:1,unit:'bad-unit'}));
});

test('message contains exactly the selected products, quantities, requirements and contact data', () => {
  const list = [{id:'helmets',qty:12,unit:'pcs',note:'White'},{id:'cables',qty:2.5,unit:'m',note:'Size to be confirmed'}];
  const contact = {name:'Sample Customer',contact:'customer@example.com',company:'Example Project',notes:'Please confirm collection options.'};
  const en = core.buildMessage(list, contact, 'en');
  for (const part of ['Safety helmets','12 Pieces','Electrical cables','2.5 Metres','White','Example Project','Please confirm collection options.','Sample Customer']) assert.ok(en.includes(part));
  assert.equal(en.includes('Paint brushes'), false);
  const ar = core.buildMessage(list, contact, 'ar');
  assert.ok(ar.includes('خوذات السلامة (Safety helmets)'));
  assert.ok(ar.includes('2.5 أمتار'));
  assert.ok(ar.includes('Sample Customer'));
});

test('large enquiries retain every item for copy/download, without truncation', () => {
  const items = core.products.map(product => ({id:product.id,qty:3,unit:'pcs',note:'Required specification to confirm.'}));
  const text = core.buildMessage(items, {name:'Customer',contact:'customer@example.com',notes:'Final project note'}, 'ar');
  assert.ok(text.length > 10000);
  for (const product of core.products) assert.ok(text.includes(product.en));
  assert.ok(text.includes('Final project note'));
  assert.ok(text.includes('customer@example.com'));
});

test('general enquiries work without selecting a catalogue item', () => {
  const text = core.buildMessage([], {name:'Customer',contact:'customer@example.com',notes:'I need an item not shown in the catalogue.'}, 'en');
  assert.ok(text.includes('I need an item not shown in the catalogue.'));
  assert.ok(text.includes('customer@example.com'));
});

// Enquiry validation must reject malformed addresses without excluding common business aliases.
test('email constraints reject malformed addresses and accept common valid formats', () => {
  for (const value of ['name@example.com', 'first.last+sales@company.com.kw', "o'connor@example.co.uk", ' USER@EXAMPLE.COM ']) {
    assert.equal(core.validEmail(value), true, value);
  }
  for (const value of ['', '   ', null, 'name', 'name@', '@example.com', 'name@example', 'name@@example.com', 'first last@example.com', 'name@exam ple.com', '.name@example.com', 'name..last@example.com', 'name.@example.com', 'name@-example.com', 'name@example-.com', 'name@example..com', 'name@example.c', 'a'.repeat(65)+'@example.com', 'a@'+ 'b'.repeat(64)+'.com', 'a@'+('b'.repeat(60)+'.').repeat(4)+'example.com']) {
    assert.equal(core.validEmail(value), false, String(value));
  }
});
