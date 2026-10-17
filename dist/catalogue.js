'use strict';

(() => {
  const core = window.ND_CORE;
  const { categories, business, translations } = window.ND_CONTENT;
  const pageType = document.body.dataset.page;
  const storageKey = 'nd-enquiry-v1';
  const pageSize = 24;
  const lang = () => window.ND_SITE.language;
  const t = key => translations[lang()][key];
  const $ = selector => document.querySelector(selector);
  let toastTimer;
  let storageFailed = false;
  let message = '';

  function readItems() {
    try {
      const temporary = sessionStorage.getItem(`${storageKey}-fallback`);
      if (temporary) return core.sanitizeItems(JSON.parse(temporary));
    } catch { /* Session storage may also be unavailable. */ }
    try { return core.sanitizeItems(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
    catch { return []; }
  }
  let items = readItems();

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function route(file, params = {}) {
    return `./${file}?${new URLSearchParams({ ...params, lang: lang() })}`;
  }
  function image(product, className = '') {
    const node = el('img', className);
    node.src = `./assets/products/${product.image}.jpg`;
    node.alt = product[lang()];
    node.width = 360;
    node.height = 180;
    node.loading = 'lazy';
    node.decoding = 'async';
    return node;
  }
  function link(text, href, className = '') {
    const node = el('a', className, text);
    node.href = href;
    return node;
  }
  function button(text, callback, className = '') {
    const node = el('button', className, text);
    node.type = 'button';
    node.addEventListener('click', callback);
    return node;
  }
  function announce(text) {
    const toast = $('#site-toast');
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
  }
  function invalidateMessage() {
    message = '';
    if ($('#enquiry-review')) $('#enquiry-review').hidden = true;
  }
  function saveItems(next) {
    items = core.sanitizeItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items)); storageFailed = false;
      try { sessionStorage.removeItem(`${storageKey}-fallback`); } catch { /* Optional fallback cleanup. */ }
    }
    catch {
      try { sessionStorage.setItem(`${storageKey}-fallback`, JSON.stringify(items)); storageFailed = false; }
      catch { storageFailed = true; }
    }
    invalidateMessage();
    updateBadges();
    if (storageFailed) announce(t('storageWarning'));
  }
  function updateBadges() {
    document.querySelectorAll('[data-enquiry-count]').forEach(node => {
      node.textContent = items.length;
      node.setAttribute('aria-label', `${t('savedCount')}: ${items.length}`);
    });
    document.querySelectorAll('[data-add]').forEach(node => {
      const selected = items.some(item => item.id === node.dataset.add);
      node.textContent = t(selected ? 'inEnquiry' : 'addEnquiry');
      node.classList.toggle('is-added', selected);
      node.setAttribute('aria-label', `${t(selected ? 'viewEnquiry' : 'addEnquiry')}: ${core.byId.get(node.dataset.add)[lang()]}`);
    });
  }
  function addQuick(product) {
    if (items.some(item => item.id === product.id)) { location.href = route('enquiry.html'); return; }
    saveItems(core.upsertItem(items, { id: product.id, qty: 1, unit: 'pcs', note: '' }));
    if (!storageFailed) announce(t('addedMessage'));
  }
  function productCard(product) {
    const group = categories.find(category => category.id === product.category);
    const card = el('article', 'catalog-card');
    const photoLink = link('', route('product.html', { id: product.id }), 'catalog-photo');
    photoLink.append(image(product));
    const body = el('div', 'catalog-card-body');
    body.append(el('p', 'catalog-card-category', group[lang()].title));
    const heading = el('h3');
    heading.append(link(product[lang()], route('product.html', { id: product.id })));
    body.append(heading);
    const actions = el('div', 'catalog-card-actions');
    const add = button(t('addEnquiry'), () => addQuick(product), 'catalog-add');
    add.dataset.add = product.id;
    const view = link(t('viewProduct'), route('product.html', { id: product.id }), 'catalog-view');
    view.setAttribute('aria-label', `${t('viewProduct')}: ${product[lang()]}`);
    actions.append(view, add);
    body.append(actions);
    card.append(photoLink, body);
    return card;
  }
  function unitSelect(value = 'pcs', id = '') {
    const select = el('select');
    if (id) select.id = id;
    for (const unit of core.units) {
      const option = el('option', '', t(`unit_${unit}`));
      option.value = unit;
      option.selected = unit === value;
      select.append(option);
    }
    return select;
  }
  function quantityInput(value = 1, id = '') {
    const input = el('input');
    input.type = 'number';
    input.min = '0.01'; input.max = '999999'; input.step = '0.01'; input.required = true;
    input.value = value; input.inputMode = 'decimal';
    if (id) input.id = id;
    return input;
  }
  function field(label, input, className = '') {
    const wrapper = el('label', `field ${className}`);
    wrapper.append(el('span', '', label), input);
    return wrapper;
  }

  let catalogState = {};
  function readCatalogUrl() {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    catalogState = {
      query: (params.get('q') || '').slice(0, 160),
      category: categories.some(group => group.id === category) ? category : 'all',
      sort: params.get('sort') === 'name' ? 'name' : 'range',
      page: Math.max(1, Number.parseInt(params.get('page'), 10) || 1)
    };
  }
  function writeCatalogUrl(push = false) {
    try {
      const url = new URL(location.href);
      for (const key of ['q', 'category', 'sort', 'page']) url.searchParams.delete(key);
      if (catalogState.query) url.searchParams.set('q', catalogState.query);
      if (catalogState.category !== 'all') url.searchParams.set('category', catalogState.category);
      if (catalogState.sort !== 'range') url.searchParams.set('sort', catalogState.sort);
      if (catalogState.page > 1) url.searchParams.set('page', catalogState.page);
      url.searchParams.set('lang', lang());
      history[push ? 'pushState' : 'replaceState'](null, '', url);
    } catch { /* Restricted embeds still support in-page filtering. */ }
  }
  function renderCatalog() {
    const select = $('#catalog-category');
    select.replaceChildren();
    const all = el('option', '', t('allProducts')); all.value = 'all'; select.append(all);
    for (const category of categories) {
      const count = core.products.filter(product => product.category === category.id).length;
      const option = el('option', '', `${category[lang()].title} (${count})`);
      option.value = category.id;
      select.append(option);
    }
    select.value = catalogState.category;
    $('#catalog-search').value = catalogState.query;
    $('#catalog-sort').value = catalogState.sort;
    const matches = core.searchProducts({ ...catalogState, language: lang() });
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    catalogState.page = Math.min(catalogState.page, totalPages);
    const start = (catalogState.page - 1) * pageSize;
    $('#catalog-grid').replaceChildren(...matches.slice(start, start + pageSize).map(productCard));
    $('#catalog-empty').hidden = matches.length > 0;
    $('#catalog-results').textContent = matches.length ? `${t('showing')} ${start + 1}–${Math.min(start + pageSize, matches.length)} ${t('of')} ${matches.length} ${t('productsFound')}` : `0 ${t('productsFound')}`;
    const pagination = $('#catalog-pagination');
    pagination.replaceChildren();
    pagination.hidden = totalPages < 2;
    const movePage = nextPage => {
      catalogState.page = nextPage;
      renderCatalog();
      writeCatalogUrl(true);
      $('#catalog-results').focus({ preventScroll: true });
      $('#catalog-results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    };
    const prev = button(t('previous'), () => movePage(catalogState.page - 1), 'pagination-button');
    prev.disabled = catalogState.page === 1;
    pagination.append(prev);
    for (let index = 1; index <= totalPages; index++) {
      const pageButton = button(String(index), () => movePage(index), 'pagination-button page-number');
      pageButton.setAttribute('aria-label', `${t('page')} ${index}`);
      if (index === catalogState.page) pageButton.setAttribute('aria-current', 'page');
      pagination.append(pageButton);
    }
    const next = button(t('next'), () => movePage(catalogState.page + 1), 'pagination-button');
    next.disabled = catalogState.page === totalPages;
    pagination.append(next);
    updateBadges();
    setPageMeta(t('cataloguePageTitle'), t('catalogueMeta'));
  }
  function setPageMeta(title, description) {
    document.title = title;
    $('meta[name="description"]').content = description;
    $('meta[property="og:title"]').content = title;
    $('meta[property="og:description"]').content = description;
  }
  function resetFilters() {
    catalogState = { query: '', category: 'all', sort: 'range', page: 1 };
    renderCatalog(); writeCatalogUrl(true); $('#catalog-search').focus();
  }

  const product = core.byId.get(new URLSearchParams(location.search).get('id'));
  function renderProduct(preserve = false) {
    const existingForm = $('#product-request');
    const oldDraft = preserve && existingForm ? {
      qty: $('#product-qty').value, unit: $('#product-unit').value, note: $('#product-note').value
    } : null;
    const container = $('#product-detail');
    container.replaceChildren();
    if (!product) {
      const empty = el('div', 'not-found');
      empty.append(el('h1', '', t('productNotFound')), el('p', '', t('productNotFoundHint')), link(t('browseCatalogue'), route('catalogue.html'), 'button button-gold'));
      container.append(empty);
      $('#related-section').hidden = true;
      setPageMeta(t('productNotFound'), t('productNotFoundHint'));
      return;
    }
    const category = categories.find(group => group.id === product.category);
    const chosen = items.find(item => item.id === product.id);
    const draft = oldDraft || chosen || { qty: 1, unit: 'pcs', note: '' };
    const photos = el('div', 'detail-image');
    const photo = image(product); photo.loading = 'eager'; photos.append(photo);
    const photoColumn = el('div', 'detail-photo-column');
    photoColumn.append(photos, el('p', 'fine-print', t('profileImageNote')));
    const content = el('div', 'detail-content');
    content.append(link(category[lang()].title, route('catalogue.html', { category: category.id }), 'eyebrow category-crumb'), el('h1', '', product[lang()]), el('p', 'detail-description', t('productDescription')), el('p', 'price-on-request', t('priceOnRequest')));
    const promptKeys = { safety: 'safetyPrompt', 'power-electrical': 'electricalPrompt', 'hand-tools': 'toolsPrompt', fasteners: 'fastenersPrompt', 'paints-adhesives': 'paintsPrompt', 'welding-lifting': 'weldingPrompt', automotive: 'automotivePrompt', general: 'generalPrompt', plumbing: 'plumbingPrompt' };
    const form = el('form', 'product-request'); form.id = 'product-request';
    const row = el('div', 'field-row');
    const qty = quantityInput(draft.qty, 'product-qty');
    const unit = unitSelect(draft.unit, 'product-unit');
    row.append(field(t('quantity'), qty), field(t('unit'), unit));
    const note = el('textarea'); note.id = 'product-note'; note.rows = 2; note.maxLength = 240;
    note.value = draft.note; note.placeholder = t('requirementsPlaceholder');
    const submit = el('button', 'button button-gold', t(chosen ? 'updateEnquiry' : 'addEnquiry')); submit.type = 'submit';
    form.append(el('h2', 'form-subheading', t('beforeQuote')), el('p', 'field-hint', t(promptKeys[product.category])), row, field(t('requirements'), note), submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const alreadySelected = items.some(item => item.id === product.id);
      saveItems(core.upsertItem(items, { id: product.id, qty: qty.value, unit: unit.value, note: note.value }));
      submit.textContent = t('updateEnquiry');
      if (!storageFailed) announce(t(alreadySelected ? 'updatedMessage' : 'addedMessage'));
      $('#detail-enquiry-link').hidden = false;
    });
    const view = link(t('viewEnquiry'), route('enquiry.html'), 'text-link detail-enquiry-link'); view.id = 'detail-enquiry-link'; view.hidden = !chosen;
    content.append(form, view);
    container.append(photoColumn, content);
    $('#product-breadcrumb').textContent = product[lang()];
    $('#related-title').textContent = t('relatedTitle');
    $('#related-grid').replaceChildren(...core.products.filter(item => item.category === product.category && item.id !== product.id).slice(0, 4).map(productCard));
    $('#related-link').href = route('catalogue.html', { category: product.category });
    $('#related-link').textContent = t('fullCategory');
    updateBadges();
    setPageMeta(`${product[lang()]} | ${translations[lang()].copyrightName}`, t('productDescription'));
  }

  function renderEnquiryItems() {
    const list = $('#enquiry-items');
    list.replaceChildren();
    $('#empty-enquiry').hidden = items.length > 0;
    $('#clear-enquiry').hidden = items.length === 0;
    $('#enquiry-count').textContent = `${items.length} ${t('itemCount')}`;
    $('#request-notes').required = items.length === 0;
    $('#storage-warning').hidden = !storageFailed;
    for (const item of items) {
      const current = core.byId.get(item.id);
      const row = el('article', 'enquiry-row');
      const photoLink = link('', route('product.html', { id: item.id }), 'enquiry-row-photo'); photoLink.append(image(current));
      const details = el('div', 'enquiry-row-details');
      const heading = el('h3'); heading.append(link(current[lang()], route('product.html', { id: item.id })));
      const inputRow = el('div', 'enquiry-row-inputs');
      const qty = quantityInput(item.qty); qty.setAttribute('form', 'enquiry-form');
      const unit = unitSelect(item.unit);
      const note = el('input'); note.type = 'text'; note.value = item.note; note.maxLength = 240; note.placeholder = t('requirementsPlaceholder');
      const update = () => {
        if (!qty.reportValidity()) return;
        saveItems(core.upsertItem(items, { id: item.id, qty: qty.value, unit: unit.value, note: note.value }));
      };
      qty.addEventListener('input', () => { invalidateMessage(); });
      qty.addEventListener('change', update); unit.addEventListener('change', update);
      note.addEventListener('input', () => { update(); });
      inputRow.append(field(t('quantity'), qty), field(t('unit'), unit));
      const remove = button(t('remove'), () => {
        const index = items.findIndex(entry => entry.id === item.id);
        saveItems(items.filter(entry => entry.id !== item.id));
        renderEnquiryItems();
        const nextRow = list.children[Math.min(index, list.children.length - 1)];
        (nextRow?.querySelector('a') || $('#empty-enquiry a')).focus();
      }, 'remove-item');
      remove.setAttribute('aria-label', `${t('remove')}: ${current[lang()]}`);
      details.append(heading, inputRow, field(t('requirements'), note));
      row.append(photoLink, details, remove); list.append(row);
    }
    updateBadges();
    setPageMeta(t('enquiryPageTitle'), t('enquiryMeta'));
  }
  function validateEmail(showError = false) {
    const input = $('#customer-contact');
    const value = input.value.trim();
    const error = !value ? t('emailRequired') : !core.validEmail(value) ? t('emailInvalid') : '';
    input.setCustomValidity(error);
    const visible = showError && Boolean(error);
    input.setAttribute('aria-invalid', String(visible));
    $('#email-error').textContent = visible ? error : '';
    $('#email-error').hidden = !visible;
    return !error;
  }
  function prepareMessage(event) {
    event.preventDefault();
    const form = $('#enquiry-form');
    validateEmail(true);
    if (!form.reportValidity()) return;
    const details = {
      name: $('#customer-name').value.trim(), contact: $('#customer-contact').value.trim(),
      company: $('#customer-company').value.trim(), notes: $('#request-notes').value.trim()
    };
    if (!details.name || !details.contact) {
      const missing = !details.name ? $('#customer-name') : $('#customer-contact');
      missing.setCustomValidity(t('required')); missing.reportValidity(); return;
    }
    if (!items.length && !details.notes) {
      $('#request-notes').setCustomValidity(t('noOtherItems'));
      $('#request-notes').reportValidity(); return;
    }
    message = core.buildMessage(items, details, lang());
    $('#message-preview').value = message;
    const fullLink = `mailto:${business.email}?subject=${encodeURIComponent(t('messageSubject'))}&body=${encodeURIComponent(message)}`;
    const long = fullLink.length > 1800;
    $('#open-email').href = long ? `mailto:${business.email}?subject=${encodeURIComponent(t('messageSubject'))}` : fullLink;
    $('#open-email').textContent = t(long ? 'openEmail' : 'emailDraft');
    $('#email-explanation').textContent = t(long ? 'longMessageNote' : 'emailClientNote');
    $('#enquiry-review').hidden = false;
    $('#review-title').focus({ preventScroll: true });
    $('#enquiry-review').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  if (pageType === 'catalogue') {
    readCatalogUrl();
    let searchTimer;
    $('#catalog-search').addEventListener('input', event => {
      catalogState.query = event.target.value.slice(0, 160); catalogState.page = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { renderCatalog(); writeCatalogUrl(); }, 180);
    });
    $('#catalog-category').addEventListener('change', event => { catalogState.category = event.target.value; catalogState.page = 1; renderCatalog(); writeCatalogUrl(true); });
    $('#catalog-sort').addEventListener('change', event => { catalogState.sort = event.target.value; catalogState.page = 1; renderCatalog(); writeCatalogUrl(true); });
    document.querySelectorAll('[data-reset-filters]').forEach(node => node.addEventListener('click', resetFilters));
    window.addEventListener('popstate', () => {
      readCatalogUrl();
      const urlLanguage = new URLSearchParams(location.search).get('lang');
      if (['en', 'ar'].includes(urlLanguage) && urlLanguage !== lang()) window.ND_SITE.setLanguage(urlLanguage, false);
      else renderCatalog();
    });
  }
  if (pageType === 'enquiry') {
    $('#clear-enquiry').addEventListener('click', () => {
      if (confirm(t('clearConfirm'))) { saveItems([]); renderEnquiryItems(); $('#empty-enquiry a').focus(); }
    });
    $('#enquiry-form').addEventListener('submit', prepareMessage);
    $('#enquiry-form').addEventListener('input', event => {
      event.target.setCustomValidity?.('');
      if (event.target.id === 'customer-contact') validateEmail(event.target.getAttribute('aria-invalid') === 'true');
      invalidateMessage();
    });
    $('#customer-contact').addEventListener('blur', () => {
      $('#customer-contact').value = $('#customer-contact').value.trim();
      validateEmail(true);
    });
    $('#customer-contact').addEventListener('invalid', () => validateEmail(true));
    $('#copy-enquiry').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(message); announce(t('copied')); }
      catch { $('#message-preview').focus(); $('#message-preview').select(); announce(t('copyFallback')); }
    });
    $('#download-enquiry').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob(['\uFEFF', message], { type: 'text/plain;charset=utf-8' }));
      const anchor = link('', url); anchor.download = `National-Development-Enquiry-${lang()}.txt`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); announce(t('downloaded'));
    });
  }
  function renderPage(preserve = false) {
    if (pageType === 'catalogue') renderCatalog();
    if (pageType === 'product') renderProduct(preserve);
    if (pageType === 'enquiry') { invalidateMessage(); renderEnquiryItems(); validateEmail($('#customer-contact').getAttribute('aria-invalid') === 'true'); }
    updateBadges();
  }
  document.addEventListener('nd:language', () => renderPage(true));
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) { items = readItems(); renderPage(true); }
  });
  renderPage();
})();
