(() => {
  if (!document.querySelector('link[href$="p-content.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('p-content.css', document.currentScript?.src || location.href).href;
    document.head.append(stylesheet);
  }
  const contentRoot = document.body.dataset.contentRoot || '../content-public';
  const navToggle = document.querySelector('[data-p-menu]');
  const navLinks = document.querySelector('[data-p-nav]');
  navToggle?.addEventListener('click', () => navLinks?.classList.toggle('is-open'));
  const label = (article) => `${article.category}｜${article.content_nature.join('+')}｜${article.evidence_status}`;
  const articleUrl = (slug) => `article.html?slug=${encodeURIComponent(slug)}`;
  const getJson = async (path) => (await fetch(path)).json();

  const renderArticles = (target, articles) => {
    if (!target) return;
    const category = new URLSearchParams(location.search).get('category');
    const visible = category ? articles.filter((article) => article.category === category) : articles;
    target.innerHTML = visible.length ? visible.map((article) => `<article><time>${article.published_at}</time><div><h2><a href="${articleUrl(article.slug)}">${article.title}</a></h2><p>${article.summary}</p><div class="p-content-tags">${label(article)}</div></div><a class="p-link" href="${articleUrl(article.slug)}">阅读全文</a></article>`).join('') : '<p class="p-empty">该分类的公开内容正在整理中。</p>';
  };

  const renderHomeFeed = (target, articles, home) => {
    if (!target) return;
    const selected = (home.featured_articles || []).map((slug) => articles.find((item) => item.slug === slug)).filter(Boolean);
    const updates = selected.map((item) => ({ kind: '文章', date: item.published_at, title: item.title, note: item.summary, href: `observations/${articleUrl(item.slug)}` }));
    target.innerHTML = updates.map((item) => `<article class="p-feed-item"><time>${item.date}<br>${item.kind}</time><div><h3><a href="${item.href}">${item.title}</a></h3><p>${item.note}</p></div><a class="p-link" href="${item.href}">查看</a></article>`).join('');
  };

  const renderTimeline = (target, timeline, home) => {
    if (!target) return;
    const confirmed = timeline.filter((item) => item.status === '可发布' && item.public_status === '可发布');
    if (!confirmed.length) {
      target.innerHTML = `<p class="p-empty">${home.timeline?.empty_message || '人物年表正在依据原始资料逐项核验，确认后持续补充。'}</p>`;
      return;
    }
    target.innerHTML = confirmed.map((item) => `<article><time>${item.year}</time><strong>${item.event}</strong><small>${item.description}</small></article>`).join('');
  };

  const renderHome = (home) => {
    document.querySelector('[data-home-kicker]')?.replaceChildren(home.hero?.kicker || '东方生命文化探索者｜《收神记》创立者');
    document.querySelector('[data-home-title]')?.replaceChildren(home.hero?.title || '寻找人与天地之间失去的连接。');
    document.querySelector('[data-home-lead]')?.replaceChildren(home.hero?.lead || '');
    const portrait = document.querySelector('.p-hero-bg');
    if (portrait && home.hero?.portrait) portrait.src = home.hero.portrait;
    const unknown = document.querySelector('[data-unknown-observation]');
    if (unknown && home.unknown_observation) {
      unknown.innerHTML = `<p class="p-section-label">未知观察</p><h2>面对未知，先记录，再判断。</h2><p>${home.unknown_observation.title}：${home.unknown_observation.description}</p><a class="p-link" href="${home.unknown_observation.href}">进入观察栏目</a><span class="p-status">${home.unknown_observation.note}</span>`;
    }
  };

  const renderVideos = (target, videos) => {
    if (!target) return;
    if (!videos.length) {
      target.innerHTML = '<p class="p-empty">首批影像正在完成授权与公开范围确认。</p>';
      return;
    }
    target.innerHTML = videos.map((video) => `<article><div class="p-meta">${video.type}｜${video.content_nature.join('+')}｜${video.evidence_status}</div><div><h2>${video.title}</h2><p>${video.summary}</p></div><span class="p-status">${video.status}</span></article>`).join('');
  };

  const renderArchive = (target, events, projects) => {
    if (!target) return;
    const blocks = [
      { title: '人物年表', note: '首批只使用已经收录、待公开复核的人物资料。' },
      { title: '公开活动', note: `${events.length} 条候选记录，需确认时间、地点与肖像授权。` },
      { title: '探索项目', note: `${projects.length} 条公开记录，持续更新。` },
      { title: '探索记录原则', note: '面对传统保持敬畏；面对未知保持开放；面对事实坚持记录；面对经验等待验证。' }
    ];
    target.innerHTML = blocks.map((block) => `<article><strong>${block.title}</strong><p>${block.note}</p></article>`).join('');
  };

  const renderArticle = async () => {
    const target = document.querySelector('[data-article]');
    if (!target) return;
    const slug = new URLSearchParams(location.search).get('slug');
    const articles = await getJson(`${contentRoot}/articles/index.json`);
    const article = articles.find((item) => item.slug === slug) || articles[0];
    const text = await (await fetch(`${contentRoot}/articles/${article.id}-${article.slug}.md`)).text();
    const body = text.replace(/^---[\s\S]*?---\s*/, '').trim().split(/\n\s*\n/).map((paragraph) => {
      if (/^##\s+/.test(paragraph)) return `<h2>${paragraph.replace(/^##\s+/, '')}</h2>`;
      return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('');
    document.title = `${article.title}｜东方生命观察`;
    target.innerHTML = `<header class="p-article-header"><p class="p-kicker">${label(article)}</p><h1>${article.title}</h1><p class="p-article-meta">${article.published_at}｜东方生命观察</p></header><div class="p-article-body">${body}</div>`;
  };

  Promise.all([getJson(`${contentRoot}/home.json`), getJson(`${contentRoot}/articles/index.json`), getJson(`${contentRoot}/videos/index.json`), getJson(`${contentRoot}/timeline/timeline.json`), getJson(`${contentRoot}/events/index.json`), getJson(`${contentRoot}/projects/index.json`)]).then(([home, articles, videos, timeline, events, projects]) => {
    renderHome(home);
    renderArticles(document.querySelector('[data-articles]'), articles);
    renderHomeFeed(document.querySelector('[data-home-observations]'), articles, home);
    renderTimeline(document.querySelector('[data-timeline]'), timeline, home);
    renderVideos(document.querySelector('[data-videos]'), videos);
    renderArchive(document.querySelector('[data-archive]'), events, projects);
  }).catch(() => {
    document.querySelectorAll('[data-articles],[data-home-observations],[data-timeline],[data-videos],[data-archive]').forEach((target) => { target.innerHTML = '<p class="p-empty">内容正在整理中。</p>'; });
  });
  renderArticle().catch(() => {});
})();
