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

      card.innerHTML = `
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