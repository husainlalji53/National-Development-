'use strict';

// Pure catalogue and enquiry functions, shared by the UI and Node tests.
(() => {
  const products = window.ND_CATALOG.products;
  const byId = new Map(products.map(product => [product.id, product]));
  const units = ['pcs', 'sets', 'pairs', 'rolls', 'm', 'boxes'];
  const normalize = value => String(value ?? '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').trim();
  const clean = (value, limit) => typeof value === 'string' ? value.replace(/\u0000/g, '').slice(0, limit) : '';
  const validQuantity = value => ['string', 'number'].includes(typeof value) && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0.01 && Number(value) <= 999999 && Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 0.000001;

  function validEmail(value) {
    if (typeof value !== 'string') return false;
    const email = value.trim();
    if (email.length > 254 || /\s/.test(email)) return false;
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
    if (!/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/i.test(local)) return false;
    const labels = domain.split('.');
    return labels.length >= 2 && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
      && /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(labels.at(-1));
  }

  function sanitizeItems(value) {
    if (!Array.isArray(value)) return [];
    const result = new Map();
    for (const item of value.slice(0, 500)) {
      if (!item || !byId.has(item.id) || !validQuantity(item.qty)) continue;
      result.set(item.id, { id: item.id, qty: Number(item.qty), unit: units.includes(item.unit) ? item.unit : 'pcs', note: clean(item.note, 240) });
    }
    return [...result.values()];
  }

  function upsertItem(items, item) {
    if (!item || !byId.has(item.id) || !validQuantity(item.qty) || !units.includes(item.unit)) throw new Error('Invalid enquiry item');
    const result = sanitizeItems(items);
    const next = { id: item.id, qty: Number(item.qty), unit: item.unit, note: clean(item.note, 240) };
    const index = result.findIndex(entry => entry.id === next.id);
    if (index < 0) result.push(next); else result[index] = next;
    return result;
  }

  function searchProducts({ query = '', category = 'all', sort = 'range', language = 'en' } = {}) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const result = products.filter(product => {
      if (category !== 'all' && product.category !== category) return false;
      const group = window.ND_CONTENT.categories.find(item => item.id === product.category);
      const haystack = normalize([product.id, product.en, product.ar, ...(product.aliases || []), group.en.title, group.ar.title].join(' '));
      return terms.every(term => haystack.includes(term));
    });
    if (sort === 'name') result.sort((a, b) => a[language].localeCompare(b[language], language));
    return result;
  }

  function buildMessage(items, contact, language = 'en') {
    const words = window.ND_CONTENT.translations[language];
    const safeItems = sanitizeItems(items);
    const lines = [words.messageGreeting, '', words.messageRequest, ''];
    for (const [index, item] of safeItems.entries()) {
      const product = byId.get(item.id);
      const name = language === 'ar' ? `${product.ar} (${product.en})` : product.en;
      lines.push(`${index + 1}. ${name}`, `   ${words.quantity}: ${item.qty} ${words[`unit_${item.unit}`]}`);
      if (item.note.trim()) lines.push(`   ${words.requirements}: ${item.note.trim()}`);
      lines.push('');
    }
    if (contact.notes?.trim()) lines.push(`${words.projectNotes}:`, clean(contact.notes, 2000).trim(), '');
    lines.push(`${words.yourName}: ${clean(contact.name, 100).trim()}`, `${words.contactDetails}: ${clean(contact.contact, 254).trim()}`);
    if (contact.company?.trim()) lines.push(`${words.company}: ${clean(contact.company, 120).trim()}`);
    lines.push('', words.messageClosing);
    return lines.join('\n');
  }

  window.ND_CORE = { products, byId, units, normalize, validEmail, validQuantity, sanitizeItems, upsertItem, searchProducts, buildMessage };
})();
