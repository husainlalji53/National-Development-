'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const copy = {
    en: { prefix: 'Find your', words: ['Tools', 'Safety supplies', 'Hardware', 'Electrical supplies'], all: 'Find tools, safety supplies, hardware and electrical supplies.' },
    ar: { prefix: 'اكتشف', words: ['الأدوات', 'معدات السلامة', 'مستلزمات البناء', 'المستلزمات الكهربائية'], all: 'اكتشف الأدوات ومعدات السلامة ومستلزمات البناء والمستلزمات الكهربائية.' }
  };
  let timer, index = 0, visible = true;
  const hero = document.querySelector('.hero');
  const title = document.querySelector('#hero-title');
  let rotator, current;
  const language = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const words = () => copy[language()];
  function stop() { clearTimeout(timer); }
  function schedule() {
    stop();
    if (!current || reduced.matches || !visible || document.hidden || index >= 3) return;
    timer = setTimeout(() => {
      index += 1;
      current.textContent = words().words[index];
      current.classList.remove('word-arrive');
      void current.offsetWidth;
      current.classList.add('word-arrive');
      schedule();
    }, 1300);
  }
  function setupHero() {
    if (!hero) return;
    stop(); index = 0;
    title.setAttribute('aria-label', [...title.children].map(line => line.textContent).join(' '));
    let n = 0;
    [...title.children].forEach(line => {
      const value = line.textContent;
      line.setAttribute('aria-hidden', 'true');
      line.replaceChildren();
      value.split(/\s+/).forEach((word, i) => {
        if (i) line.append(document.createTextNode(' '));
        const span = document.createElement('b'); span.className = 'hero-word'; span.textContent = word;
        span.style.setProperty('--word-delay', `${n++ * 100}ms`); line.append(span);
      });
    });
    if (!rotator) {
      rotator = document.createElement('div'); rotator.className = 'hero-rotator';
      title.after(rotator);
    }
    rotator.replaceChildren();
    const accessible = document.createElement('span'); accessible.className = 'sr-only'; accessible.textContent = words().all;
    const visual = document.createElement('span'); visual.className = 'rotator-copy'; visual.setAttribute('aria-hidden', 'true');
    const prefix = document.createElement('span'); prefix.textContent = words().prefix;
    const track = document.createElement('span'); track.className = 'rotator-track';
    current = document.createElement('span'); current.textContent = words().words[0]; track.append(current);
    visual.append(prefix, track);
    rotator.append(accessible, visual); schedule();
  }
  const targets = new Set();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.remove('motion-wait'); target.classList.add('motion-entered'); observer.unobserve(target); targets.delete(target);
    });
  }, {threshold: 0.08}) : null;
  function observe(target, delay = 0) {
    if (!observer || reduced.matches) return;
    target.style.setProperty('--entry-delay', `${delay}ms`); target.classList.add('motion-wait'); targets.add(target); observer.observe(target);
  }
  const grid = document.querySelector('#category-grid');
  function categories() {
    [...targets].filter(node => !node.isConnected).forEach(node => { observer?.unobserve(node); targets.delete(node); });
    grid?.querySelectorAll('.category-card').forEach((node, i) => observe(node, Math.min(i % 3, 2) * 90));
  }
  if (grid) new MutationObserver(categories).observe(grid, { childList: true });
  const process = document.querySelector('.enquiry-steps');
  if (process) { process.classList.add('process-motion'); observe(process); }
  if (hero && observer) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(hero);
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('nd:language', setupHero);
  reduced.addEventListener?.('change', () => {
    if (reduced.matches) { targets.forEach(node => { node.classList.remove('motion-wait'); observer?.unobserve(node); }); targets.clear(); }
    setupHero();
  });
  setupHero(); categories();
})();
