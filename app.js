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

function previewCandidates(url, ogImage) {
  const encoded = encodeURIComponent(url);
  const list = [];
  if (ogImage) list.push(ogImage);
  list.push(`https://image.thum.io/get/width/900/noanimate/${url}`);
  list.push(`https://s.wordpress.com/mshots/v1/${encoded}?w=900`);
  return list;
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

    for (const item of category.items) {
      total++;
      const card = document.createElement('article');
      card.className = 'card';

      const shouldShowPreview = ['字体 / Type', '设计工作室 / Studios'].includes(category.category);
      const previews = shouldShowPreview ? previewCandidates(item.url, item.image) : [];
      const previewSrc = previews[0] || '';
      card.innerHTML = `
        ${shouldShowPreview ? `<img class="preview" src="${previewSrc}" alt="${item.name}" loading="lazy" referrerpolicy="no-referrer" data-fallback-index="0" data-fallbacks="${previews.join('||')}" onerror="imgFallback(this)" />` : ''}
        <div class="cardHead">
          <img class="favicon" src="${faviconFor(item.url)}" alt="" loading="lazy" />
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name}</a>
        </div>
        <div class="meta">${domainFrom(item.url)}</div>
        <div class="tags">${(item.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
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

fetch('./data/resources.json')
  .then(r => r.json())
  .then(data => {
    allData = data;
    render(allData);
  })
  .catch(err => {
    categoriesEl.innerHTML = `<p>加载失败：${err.message}</p>`;
  });

searchEl.addEventListener('input', () => {
  render(filterData(searchEl.value.trim()));
});