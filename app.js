const $ = (id) => document.getElementById(id);
const safe = (value, fallback = '') => value ?? fallback;

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = safe(value);
}

function setLink(id, href, label) {
  const el = $(id);
  if (!el) return;
  el.href = href || '#';
  if (label !== undefined) el.textContent = label;
}

function formatDate(input) {
  if (!input) return '';
  const date = new Date(`${input}T12:00:00`);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function applyTheme(site) {
  const root = document.documentElement;
  const theme = site.theme || {};
  if (theme.accent) root.style.setProperty('--accent', theme.accent);
  if (theme.accent_secondary) root.style.setProperty('--accent-2', theme.accent_secondary);
  if (theme.accent_red) root.style.setProperty('--accent-red', theme.accent_red);
  if (theme.background) root.style.setProperty('--bg', theme.background);
}

function buildNav(site) {
  const nav = $('nav');
  nav.innerHTML = '';
  const visibility = site.navigation || {};
  const links = [
    ['Home', '#home', true],
    ['Updates', '#updatesSection', visibility.show_updates !== false],
    ['Projects', '#projectsSection', visibility.show_projects !== false],
    ['Staff', '#staffSection', visibility.show_staff !== false],
    ['Applications', '#applicationsSection', visibility.show_applications !== false],
    ['Community', '#communitySection', visibility.show_community !== false]
  ];
  links.filter(([, , show]) => show).forEach(([label, href]) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.addEventListener('click', () => nav.classList.remove('open'));
    nav.appendChild(a);
  });
}

function renderUpdates(items) {
  const grid = $('updatesGrid');
  grid.innerHTML = '';
  const visible = items.filter(i => i.visible !== false).sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')));
  if (!visible.length) {
    grid.innerHTML = '<div class="empty-state">No updates have been published yet.</div>';
    return;
  }
  visible.forEach(item => {
    const card = document.createElement('article');
    card.className = 'update-card reveal';
    if (item.image) {
      const img = document.createElement('img');
      img.className = 'update-image';
      img.src = item.image;
      img.alt = item.title || 'Update image';
      card.appendChild(img);
    }
    const body = document.createElement('div');
    body.className = 'update-body';
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.innerHTML = `<span>${safe(item.category,'UPDATE')}</span><span>${formatDate(item.date)}</span>`;
    const title = document.createElement('h3');
    title.textContent = safe(item.title, 'Update');
    const p = document.createElement('p');
    p.textContent = safe(item.summary);
    body.append(meta,title,p);
    if (item.link) {
      const a = document.createElement('a');
      a.className = 'card-link';
      a.href = item.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'READ MORE →';
      body.appendChild(a);
    }
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function renderProjects(site, items) {
  const wrap = $('projectsContent');
  wrap.innerHTML = '';
  const cfg = site.projects || {};
  if (cfg.mode !== 'live') {
    const block = document.createElement('div');
    block.className = 'construction reveal';
    block.innerHTML = `
      <div class="tape tape-one">UNDER CONSTRUCTION</div>
      <div class="tape tape-two">UNDER CONSTRUCTION</div>
      <div class="construction-copy"><h3></h3><p></p></div>`;
    block.querySelector('h3').textContent = cfg.construction_title || 'Under Construction, Coming Soon!';
    block.querySelector('p').textContent = cfg.construction_text || '';
    wrap.appendChild(block);
    return;
  }
  const visible = items.filter(i => i.visible !== false).sort((a,b) => Number(a.order||999)-Number(b.order||999));
  if (!visible.length) {
    wrap.innerHTML = '<div class="empty-state">Project mode is live, but no visible projects have been added yet.</div>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'project-grid';
  visible.forEach(item => {
    const card = document.createElement('article');
    card.className = 'project-card reveal';
    if (item.image) {
      const img = document.createElement('img');
      img.className = 'project-image';
      img.src = item.image;
      img.alt = item.title || 'Project';
      card.appendChild(img);
    }
    const body = document.createElement('div');
    body.className = 'project-body';
    body.innerHTML = '<div class="card-meta"><span></span></div><h3></h3><p></p>';
    body.querySelector('.card-meta span').textContent = safe(item.status, 'PROJECT');
    body.querySelector('h3').textContent = safe(item.title, 'Project');
    body.querySelector('p').textContent = safe(item.description);
    if (item.link) {
      const a = document.createElement('a');
      a.className = 'card-link';
      a.href = item.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = `${safe(item.button_label,'VIEW PROJECT')} →`;
      body.appendChild(a);
    }
    card.appendChild(body);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
}

function renderRanks(items) {
  const grid = $('rankGrid');
  grid.innerHTML = '';
  items.filter(i => i.visible !== false).sort((a,b) => Number(a.order||999)-Number(b.order||999)).forEach((item,index) => {
    const card = document.createElement('article');
    card.className = 'rank-card reveal';
    const number = document.createElement('div');
    number.className = 'rank-number';
    number.textContent = item.order || index + 1;
    const h = document.createElement('h4');
    h.textContent = item.name || 'Rank';
    const p = document.createElement('p');
    p.textContent = item.description || '';
    card.append(number,h,p);
    grid.appendChild(card);
  });
}

function renderStaff(site, items) {
  const grid = $('portfolioGrid');
  grid.innerHTML = '';
  const visible = items.filter(i => i.visible !== false).sort((a,b) => Number(a.order||999)-Number(b.order||999));
  if (!visible.length) {
    grid.innerHTML = '<div class="empty-state">No staff portfolios are currently visible.</div>';
    return;
  }
  visible.forEach(item => {
    const card = document.createElement('article');
    card.className = 'portfolio-card reveal';
    const photoWrap = document.createElement('div');
    photoWrap.className = 'portfolio-photo-wrap';
    if (item.photo) {
      const img = document.createElement('img');
      img.className = 'portfolio-photo';
      img.src = item.photo;
      img.alt = `${item.display_name || item.username || 'Staff'} Roblox avatar`;
      photoWrap.appendChild(img);
    }
    const copy = document.createElement('div');
    copy.className = 'portfolio-copy';
    const label = document.createElement('p');
    label.className = 'portfolio-label';
    label.textContent = item.portfolio_label || 'STAFF PORTFOLIO';
    const name = document.createElement('h4');
    name.textContent = item.display_name || item.username || 'Staff Member';
    const rank = document.createElement('p');
    rank.className = 'portfolio-rank';
    rank.textContent = item.rank || '';
    const desc = document.createElement('p');
    desc.textContent = item.description || '';
    const action = document.createElement('a');
    action.className = 'button button-outline';
    action.href = site.discord_url || '#';
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
    action.textContent = 'LEAVE A SUGGESTION';
    copy.append(label,name,rank,desc,action);
    card.append(photoWrap,copy);
    grid.appendChild(card);
  });
}

function configureVisibility(site) {
  const v = site.navigation || {};
  $('updatesSection').hidden = v.show_updates === false;
  $('projectsSection').hidden = v.show_projects === false;
  $('staffSection').hidden = v.show_staff === false;
  $('applicationsSection').hidden = v.show_applications === false;
  $('communitySection').hidden = v.show_community === false;
}

function setupReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

async function init() {
  try {
    const [site, ranks, staff, projects, updates] = await Promise.all([
      loadJSON('/content/site.json'),
      loadJSON('/content/ranks.json'),
      loadJSON('/content/staff.json'),
      loadJSON('/content/projects.json'),
      loadJSON('/content/updates.json')
    ]);

    applyTheme(site);
    buildNav(site);
    configureVisibility(site);

    document.title = site.site_name || 'VIP Studios';
    const logo = site.logo || '/assets/media/vip-studios-round.png';
    $('headerLogo').src = logo; $('heroLogo').src = logo; $('footerLogo').src = logo;
    setText('headerName', site.site_name);
    setText('heroEyebrow', site.hero?.eyebrow);
    setText('heroBefore', site.hero?.title_before);
    setText('heroHighlight', site.hero?.title_highlight);
    setText('heroAfter', site.hero?.title_after);
    setText('heroDescription', site.hero?.description);
    setLink('headerDiscord', site.discord_url, 'JOIN DISCORD');
    setLink('heroDiscord', site.discord_url, site.hero?.primary_button || 'JOIN DISCORD');
    setLink('heroRoblox', site.roblox_group_url, site.hero?.secondary_button || 'ROBLOX GROUP');

    setText('updatesEyebrow', site.updates?.eyebrow);
    setText('updatesTitle', site.updates?.title);
    setText('updatesDescription', site.updates?.description);
    setText('projectsEyebrow', site.projects?.eyebrow);
    setText('projectsTitle', site.projects?.title);
    setText('projectsDescription', site.projects?.description);
    setText('staffEyebrow', site.staff?.eyebrow);
    setText('staffTitle', site.staff?.title);
    setText('staffDescription', site.staff?.description);
    setText('ranksTitle', site.staff?.ranks_title);
    setText('portfoliosTitle', site.staff?.portfolios_title);
    setText('applicationsEyebrow', site.applications?.eyebrow);
    setText('applicationsTitle', site.applications?.title);
    setText('applicationsText', site.applications?.text);
    setText('applicationsNote', site.applications?.note);
    setLink('applicationsButton', site.discord_url, site.applications?.button_label || 'OPEN DISCORD');
    setText('communityEyebrow', site.community?.eyebrow);
    setText('communityTitle', site.community?.title);
    setText('communityDescription', site.community?.description);
    setLink('communityDiscord', site.discord_url);
    setLink('communityRoblox', site.roblox_group_url);
    setText('footerName', site.site_name);
    setText('footerTagline', site.footer?.tagline);
    setText('footerDisclaimer', site.footer?.disclaimer);
    setText('footerCopyright', site.site_name);
    setText('year', new Date().getFullYear());

    renderUpdates(updates);
    renderProjects(site, projects);
    renderRanks(ranks);
    renderStaff(site, staff);
    setupReveal();
  } catch (error) {
    console.error(error);
    $('loadError').hidden = false;
    setText('year', new Date().getFullYear());
  }
}

$('menuButton').addEventListener('click', () => {
  const open = $('nav').classList.toggle('open');
  $('menuButton').setAttribute('aria-expanded', String(open));
});

init();
