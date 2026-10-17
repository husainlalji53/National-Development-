'use strict';

(() => {
  const { business, translations, categories } = window.ND_CONTENT;
  const root = document.documentElement;
  const search = document.querySelector('#category-search');
  const grid = document.querySelector('#category-grid');
  const extra = document.querySelector('#extra-categories');
  const dialog = document.querySelector('#category-dialog');
  const menuToggle = document.querySelector('#menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');
  const languageButtons = [...document.querySelectorAll('[data-lang]')];
  let activeCategory = null;
  let lastDialogTrigger = null;
  let language = 'en';
  let searchTimer;
  const urlLanguage = new URLSearchParams(window.location.search).get('lang');
  if (['en', 'ar'].includes(urlLanguage)) language = urlLanguage;
  else {
    try {
      const savedLanguage = window.localStorage.getItem('nd-language');
      if (['en', 'ar'].includes(savedLanguage)) language = savedLanguage;
    } catch { /* Explicit language links still work when storage is blocked. */ }
  }

  const normalize = text => text.toLocaleLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').trim();
  const icon = name => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon directional');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${name}`);
    svg.append(use);
    return svg;
  };
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  };
  const mailLink = (subject, body) => `mailto:${business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const productImage = (file, label) => {
    const image = make('img', 'product-photo');
    image.src = `./assets/products/${file}.jpg`;
    image.alt = label;
    image.width = 360;
    image.height = 180;
    image.loading = 'lazy';
    image.decoding = 'async';
    return image;
  };

  function closeMenu({ restoreFocus = false } = {}) {
    const wasOpen = !mobileMenu.hidden;
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', translations[language].openMenu);
    menuToggle.querySelector('use').setAttribute('href', '#menu');
    if (wasOpen && restoreFocus) menuToggle.focus();
  }

  function fillDialog(category) {
    const value = category[language];
    document.querySelector('#dialog-title').textContent = value.title;
    document.querySelector('#dialog-description').textContent = value.description;
    document.querySelector('#dialog-items').replaceChildren(...value.items.map((item, index) => {
      const card = make('li', 'product-preview');
      const photos = make('div', 'product-photos');
      const images = category.itemImages[index];
      if (images.length > 1) photos.classList.add('product-photos-pair');
      images.forEach(file => photos.append(productImage(file, item)));
      card.append(photos, make('span', 'product-name', item));
      return card;
    }));
    const words = translations[language];
    document.querySelector('#category-enquiry').href = `./catalogue.html?category=${encodeURIComponent(category.id)}&lang=${language}`;
  }

  function openCategory(category, trigger) {
    activeCategory = category;
    lastDialogTrigger = trigger;
    fillDialog(category);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      document.body.classList.add('dialog-open');
    } else {
      // Old browsers still have a working enquiry route.
      window.location.href = document.querySelector('#category-enquiry').href;
    }
  }

  function renderCategories(announce = false) {
    if (!grid) return;
    const query = normalize(search.value);
    const words = translations[language];
    const results = categories.filter(category => {
      const terms = [category.en.title, category.en.subtitle, ...category.en.items, category.ar.title, category.ar.subtitle, ...category.ar.items, ...category.keywords];
      return normalize(terms.join(' ')).includes(query);
    });
    grid.replaceChildren();
    extra.replaceChildren();
    results.forEach(category => {
      const value = category[language];
      if (category.atlas === null && !query) {
        const button = make('button', 'extra-category');
        button.type = 'button';
        button.setAttribute('aria-haspopup', 'dialog');
        const thumbnail = make('span', 'extra-category-image');
        thumbnail.append(productImage(category.itemImages[0][0], ''));
        button.append(thumbnail, make('span', '', value.title));
        button.append(icon('arrow'));
        button.addEventListener('click', () => openCategory(category, button));
        extra.append(button);
      } else {
        const button = make('button', 'category-card');
        button.type = 'button';
        button.setAttribute('aria-label', `${words.categoryButton} ${value.title}`);
        button.setAttribute('aria-haspopup', 'dialog');
        if (category.atlas !== null) {
          const image = make('div', 'category-image');
          image.setAttribute('aria-hidden', 'true');
          image.append(make('div', `category-art atlas-${category.atlas}`));
          image.append(make('span', 'category-index', String(categories.indexOf(category) + 1).padStart(2, '0')));
          button.append(image);
        } else {
          const image = make('div', 'category-image category-source-image');
          image.append(productImage(category.itemImages[0][0], ''));
          button.append(image);
        }
        const title = make('span', 'category-title', value.title);
        title.append(icon('arrow'));
        button.append(title, make('span', 'category-subtitle', value.subtitle));
        button.addEventListener('click', () => openCategory(category, button));
        grid.append(button);
      }
    });
    document.querySelector('.extra-range').hidden = Boolean(query) || extra.children.length === 0;
    document.querySelector('#empty-state').hidden = results.length !== 0;
    document.querySelector('#clear-search').hidden = search.value.length === 0;
    if (announce) document.querySelector('#search-status').textContent = `${results.length} ${words.resultLabel}`;
  }

  function setLanguage(nextLanguage, persist = true) {
    if (!translations[nextLanguage]) return;
    language = nextLanguage;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    const words = translations[language];
    document.title = words.pageTitle;
    document.querySelector('meta[name="description"]').content = words.metaDescription;
    document.querySelector('meta[property="og:title"]').content = words.pageTitle;
    document.querySelector('meta[property="og:description"]').content = words.metaDescription;
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = words[element.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', words[element.dataset.i18nAria]); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.placeholder = words[element.dataset.i18nPlaceholder]; });
    document.querySelectorAll('[data-i18n-alt]').forEach(element => { element.alt = words[element.dataset.i18nAlt]; });
    document.querySelectorAll('[data-quote]').forEach(element => { element.href = `./enquiry.html?lang=${language}`; });
    document.querySelectorAll('[data-local]').forEach(element => {
      const url = new URL(element.dataset.local, window.location.href);
      url.searchParams.set('lang', language);
      element.href = url.href;
    });
    document.querySelectorAll('[data-map]').forEach(element => { element.href = business.mapsUrl; });
    languageButtons.forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.lang === language)); });
    document.querySelector('.language-switch').setAttribute('aria-label', language === 'ar' ? 'اختر اللغة' : 'Choose language');
    closeMenu();
    renderCategories();
    if (activeCategory) fillDialog(activeCategory);
    if (persist) {
      try { window.localStorage.setItem('nd-language', language); } catch { /* Privacy mode is supported. */ }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', language);
        window.history.replaceState(null, '', url);
      } catch { /* file:// and restricted embeds retain the in-memory selection. */ }
    }
    document.dispatchEvent(new CustomEvent('nd:language', { detail: { language } }));
  }

  languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  menuToggle.addEventListener('click', () => {
    const open = mobileMenu.hidden;
    mobileMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', translations[language][open ? 'closeMenu' : 'openMenu']);
    menuToggle.querySelector('use').setAttribute('href', open ? '#close' : '#menu');
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    const url = new URL(link.href, location.href);
    const target = url.pathname === location.pathname && url.hash ? document.querySelector(url.hash) : null;
    closeMenu();
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  }));
  document.addEventListener('focusin', event => {
    if (!mobileMenu.hidden && !event.target.closest('.header')) closeMenu();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu({ restoreFocus: true }); });
  document.addEventListener('click', event => { if (!mobileMenu.hidden && !event.target.closest('.header')) closeMenu(); });
  const desktop = window.matchMedia('(min-width: 961px)');
  desktop.addEventListener?.('change', event => { if (event.matches) closeMenu(); });
  document.querySelector('#close-dialog')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog?.addEventListener('close', () => {
    activeCategory = null;
    document.body.classList.remove('dialog-open');
    if (lastDialogTrigger?.isConnected) lastDialogTrigger.focus();
  });
  search?.addEventListener('input', () => {
    renderCategories();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderCategories(true), 250);
  });
  const resetSearch = () => { search.value = ''; renderCategories(true); search.focus(); };
  document.querySelector('#clear-search')?.addEventListener('click', resetSearch);
  document.querySelector('#reset-search')?.addEventListener('click', resetSearch);
  document.querySelector('#year').textContent = new Date().getFullYear();
  window.ND_SITE = { get language() { return language; }, setLanguage };
  setLanguage(language, false);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const elements = [...document.querySelectorAll('.reveal')];
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    elements.forEach(element => { element.classList.add('is-pending'); observer.observe(element); });
    reducedMotion.addEventListener?.('change', event => {
      if (event.matches) { observer.disconnect(); elements.forEach(element => element.classList.remove('is-pending')); }
    });
  }
})();
