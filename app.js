const categoriesEl = document.getElementById('categories');
const searchEl = document.getElementById('search');
const countEl = document.getElementById('count');

let allData = [];

function domainFrom(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

function faviconFor(url) {
  const domain = domainFrom(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function previewCandidates(url) {
  return [
    `https://image.thum.io/get/width/640/noanimate/${url}`
  ];
}

function imgFallback(el) {
  const next = Number(el.dataset.fallbackIndex || '0') + 1;
  const sources = (el.dataset.fallbacks || '').split('||').filter(Boolean);
  if (next < sources.length) {
    el.dataset.fallbackIndex = String(next);
    el.src = sources[next];
  } else {
    el.style.display = 'none';
  }
}

function sortItems(items, categoryName) {
  if (!['字体 / Type', '设计工作室 / Studios'].includes(categoryName)) return items;
  return [...items].sort((a, b) =>
    (a.country || '').localeCompare(b.country || '', 'zh-Hans-CN') ||
    (a.city || '').localeCompare(b.city || '', 'zh-Hans-CN') ||
    (a.name || '').localeCompare(b.name || '', 'en')
  );
}

function render(data) {
  categoriesEl.innerHTML = '';
  let total = 0;

  for (const category of data) {
    const section = document.createElement('section');
    section.className = 'category';

    const h2 = document.createElement('h2');
    h2.textContent = category.category;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'grid';

    for (const item of sortItems(category.items, category.category)) {
      total++;
      const card = document.createElement('article');
      card.className = 'card';

      const shouldShowPreview = ['字体 / Type', '设计工作室 / Studios'].includes(category.category);
      const previews = shouldShowPreview ? previewCandidates(item.url) : [];
      const previewSrc = previews[0] || '';
      card.innerHTML = `
        ${shouldShowPreview ? `<a class="previewLink" href="${item.url}" target="_blank" rel="noopener noreferrer"><img class="preview" src="${previewSrc}" alt="${item.name}" loading="lazy" referrerpolicy="no-referrer" data-fallback-index="0" data-fallbacks="${previews.join('||')}" onerror="imgFallback(this)" /></a>` : ''}
        <div class="cardHead">
          <img class="favicon" src="${faviconFor(item.url)}" alt="" loading="lazy" />
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name}</a>
        </div>
        <div class="meta">${domainFrom(item.url)}</div>
        <div class="meta">${[item.country, item.city].filter(Boolean).join(' · ')}</div>
      `;

      grid.appendChild(card);
    }

    section.appendChild(grid);
    categoriesEl.appendChild(section);
  }

  countEl.textContent = `${total} 个资源`;
}

function filterData(keyword) {
  if (!keyword) return allData;
  const q = keyword.toLowerCase();

  return allData
    .map(c => ({
      category: c.category,
      items: c.items.filter(i => {
        const joined = [i.name, i.url, i.note || '', ...(i.tags || [])].join(' ').toLowerCase();
        return joined.includes(q);
      })
    }))
    .filter(c => c.items.length > 0);
}

const CACHE_KEY = 'design_resources_cache_v1';
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.cachedAt) return null;
    if (Date.now() - parsed.cachedAt > CACHE_MAX_AGE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // localStorage may be unavailable (private mode / quota)
  }
}

const cachedData = loadCache();
if (cachedData) {
  allData = cachedData;
  render(allData);
}

fetch('./data/resources.json')
  .then(r => r.json())
  .then(data => {
    allData = data;
    saveCache(data);
    render(allData);
  })
  .catch(err => {
    if (!cachedData) {
      categoriesEl.innerHTML = `<p>加载失败：${err.message}</p>`;
    }
  });

searchEl.addEventListener('input', () => {
  render(filterData(searchEl.value.trim()));
});