'use strict';

// Shared by the browser and sitemap generator. Change this origin if the public domain changes.
(() => {
  const origin = 'https://national-development-building-mater.vercel.app';
  const products = window.ND_CATALOG.products;
  const ids = new Set(products.map(product => product.id));
  const pageCount = Math.ceil(products.length / 24);
  function metadata(page, language = 'en', search = '') {
    const params = new URLSearchParams(search);
    const file = {home: '/', catalogue: '/catalogue.html', product: '/product.html', enquiry: '/enquiry.html'}[page] || '/';
    const url = new URL(file, origin);
    let indexable = ['home', 'catalogue', 'product'].includes(page);
    if (page === 'product') {
      const id = params.get('id');
      if (ids.has(id)) url.searchParams.set('id', id);
      else indexable = false;
    }
    if (page === 'catalogue') {
      const filtered = Boolean(params.get('q')?.trim()) || Boolean(params.get('category') && params.get('category') !== 'all') || Boolean(params.get('sort') && params.get('sort') !== 'range');
      if (filtered) indexable = false;
      const requested = Number(params.get('page') || 1);
      const number = Number.isInteger(requested) ? Math.max(1, Math.min(pageCount, requested)) : 1;
      if (!filtered && number > 1) url.searchParams.set('page', String(number));
    }
    if (language === 'ar') url.searchParams.set('lang', 'ar');
    return {canonical: url.href, robots: indexable ? 'index,follow,max-image-preview:large' : 'noindex,follow', indexable};
  }
  function entries() {
    const routes = [{page:'home', search:''}];
    for (let page = 1; page <= pageCount; page++) routes.push({page:'catalogue',search:`page=${page}`});
    for (const product of products) routes.push({page:'product',search:`id=${encodeURIComponent(product.id)}`});
    return routes.flatMap(route => ['en','ar'].map(language => ({
      ...metadata(route.page,language,route.search),
      en: metadata(route.page,'en',route.search).canonical,
      ar: metadata(route.page,'ar',route.search).canonical
    })));
  }
  function update() {
    if (typeof document === 'undefined') return;
    const page = document.body.dataset.page;
    const language = document.documentElement.lang;
    const result = metadata(page, language, location.search);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    canonical.href = result.canonical;
    document.querySelector('meta[name="robots"]').content = result.robots;
    document.querySelectorAll('link[data-seo-alternate]').forEach(node => node.remove());
    if (result.indexable) {
      for (const locale of ['en','ar','x-default']) {
        const alternate = document.createElement('link');
        alternate.rel = 'alternate'; alternate.hreflang = locale; alternate.dataset.seoAlternate = '';
        alternate.href = metadata(page, locale === 'ar' ? 'ar' : 'en', location.search).canonical;
        document.head.append(alternate);
      }
    }
    let socialUrl = document.querySelector('meta[property="og:url"]');
    if (!socialUrl) { socialUrl = document.createElement('meta'); socialUrl.setAttribute('property','og:url'); document.head.append(socialUrl); }
    socialUrl.content = result.canonical;
  }
  window.ND_SEO = {origin, metadata, entries, update};
  if (typeof document !== 'undefined') {
    document.addEventListener('nd:language', update);
    window.addEventListener('popstate', update);
    update();
  }
})();
