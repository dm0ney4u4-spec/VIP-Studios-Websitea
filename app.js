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
    ['Milestones', '#milestonesSection', visibility.show_milestones !== false],
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

function animateCounter(element, target, duration = 1500) {
  if (!element || !Number.isFinite(target)) return;
  const start = Number(String(element.textContent || '0').replace(/,/g, '')) || 0;
  const difference = target - start;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + difference * eased);
    element.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function getNextMilestone(memberCount, goals) {
  const cleanGoals = Array.isArray(goals)
    ? goals.map(Number).filter(Number.isFinite).sort((a,b) => a-b)
    : [];
  let next = cleanGoals.find(goal => goal > memberCount);
  if (!next) {
    const step = memberCount < 10000 ? 1000 : 5000;
    next = Math.ceil((memberCount + 1) / step) * step;
  }
  const previousGoals = cleanGoals.filter(goal => goal <= memberCount);
  const previous = previousGoals.length ? previousGoals[previousGoals.length - 1] : 0;
  return { previous, next };
}

async function updateDiscordMilestones(site, animate = true) {
  const note = $('memberDataNote');
  try {
    const response = await fetch('/.netlify/functions/discord-stats', { cache: 'no-store' });
    if (!response.ok) throw new Error('Discord stats unavailable');
    const data = await response.json();
    const members = Number(data.memberCount) || 0;
    const online = Number(data.onlineCount) || 0;

    if (animate) {
      animateCounter($('memberCount'), members);
      animateCounter($('onlineCount'), online, 1250);
    } else {
      setText('memberCount', members.toLocaleString());
      setText('onlineCount', online.toLocaleString());
    }

    const { previous, next } = getNextMilestone(members, site.milestones?.goals);
    setText('nextMilestone', next.toLocaleString());

    const span = Math.max(next - previous, 1);
    const progress = Math.max(0, Math.min(100, ((members - previous) / span) * 100));
    const bar = $('milestoneProgressBar');
    if (bar) requestAnimationFrame(() => { bar.style.width = `${progress}%`; });

    const remaining = Math.max(next - members, 0);
    setText('milestoneProgressText', remaining === 0
      ? 'Milestone reached!'
      : `${remaining.toLocaleString()} more member${remaining === 1 ? '' : 's'} to reach ${next.toLocaleString()}.`);

    if (note) note.textContent = data.guildName
      ? `Live estimate for ${data.guildName} • refreshed automatically`
      : 'Live Discord estimate • refreshed automatically';
  } catch (error) {
    console.error(error);
    if (note) note.textContent = 'Live count temporarily unavailable. Check back shortly.';
    setText('milestoneProgressText', 'Discord statistics will refresh automatically.');
  }
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

function renderMaintenance(site) {
  const cfg = site.maintenance || {};
  if (!cfg.enabled) return false;

  document.title = `${site.site_name || 'VIP Studios'} — Under Construction`;
  const logo = site.logo || '/assets/media/vip-studios-round.png';

  document.body.innerHTML = `
    <main class="maintenance-page">
      <div class="maintenance-glow maintenance-glow-one"></div>
      <div class="maintenance-glow maintenance-glow-two"></div>
      <section class="maintenance-card">
        <div class="maintenance-badge">VIP STUDIOS</div>
        <img class="maintenance-logo" src="${logo}" alt="${site.site_name || 'VIP Studios'} logo">
        <div class="maintenance-tape">UNDER CONSTRUCTION • UNDER CONSTRUCTION • UNDER CONSTRUCTION</div>
        <h1>${cfg.title || 'WEBSITE UNDER CONSTRUCTION'}</h1>
        <p>${cfg.message || 'We are currently working on the website. Please check back soon!'}</p>
        <div class="maintenance-countdown-wrap">
          <span class="maintenance-countdown-label">WEBSITE RELEASE COUNTDOWN</span>
          <strong class="maintenance-countdown" id="maintenanceCountdown">05:00</strong>
          <small>Release time: 6:15 PM CDT</small>
        </div>
        <div class="maintenance-actions">
          ${cfg.show_discord_button !== false ? `<a class="maintenance-button primary" href="${site.discord_url || '#'}" target="_blank" rel="noopener noreferrer">JOIN DISCORD</a>` : ''}
          ${cfg.show_roblox_button !== false ? `<a class="maintenance-button secondary" href="${site.roblox_group_url || '#'}" target="_blank" rel="noopener noreferrer">ROBLOX GROUP</a>` : ''}
        </div>
        <span class="maintenance-note">VIP Studios • Check back soon</span>
      </section>
    </main>
    <style>
      body{margin:0;background:#07090d;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}
      .maintenance-page{position:relative;min-height:100vh;display:grid;place-items:center;padding:28px;background:
        linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px),
        radial-gradient(circle at 20% 20%,rgba(246,197,21,.14),transparent 30%),
        radial-gradient(circle at 80% 75%,rgba(239,51,64,.10),transparent 30%),#07090d;
        background-size:42px 42px,42px 42px,auto,auto,auto}
      .maintenance-card{position:relative;z-index:2;width:min(760px,calc(100vw - 42px));text-align:center;padding:58px 34px 42px;border:1px solid rgba(255,255,255,.11);background:rgba(10,13,18,.90);box-shadow:0 30px 90px rgba(0,0,0,.55);overflow:hidden}
      .maintenance-logo{width:170px;height:170px;object-fit:contain;margin:8px auto 22px;filter:drop-shadow(0 16px 35px rgba(246,197,21,.22))}
      .maintenance-badge{display:inline-block;padding:7px 12px;border:1px solid rgba(246,197,21,.45);color:#f6c515;font:800 12px/1 Inter,sans-serif;letter-spacing:.18em}
      .maintenance-card h1{margin:30px 0 16px;font-family:"Barlow Condensed",Inter,sans-serif;font-size:clamp(48px,8vw,88px);line-height:.88;letter-spacing:-.02em}
      .maintenance-card p{max-width:610px;margin:0 auto;color:#aeb7c4;font-size:16px;line-height:1.75}
      .maintenance-countdown-wrap{margin:26px auto 0;max-width:360px;padding:18px 20px;border:1px solid rgba(246,197,21,.35);background:rgba(246,197,21,.06);box-shadow:inset 0 0 30px rgba(246,197,21,.035)}
      .maintenance-countdown-label{display:block;color:#f6c515;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
      .maintenance-countdown{display:block;margin-top:8px;font-size:clamp(48px,8vw,76px);line-height:1;font-variant-numeric:tabular-nums;letter-spacing:.02em;text-shadow:0 0 24px rgba(246,197,21,.16)}
      .maintenance-countdown-wrap small{display:block;margin-top:8px;color:#7f8997;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
      .maintenance-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:30px}
      .maintenance-button{min-width:160px;padding:15px 22px;font-weight:900;letter-spacing:.05em;text-decoration:none}
      .maintenance-button.primary{background:linear-gradient(135deg,#f6c515,#ff8a00);color:#090b0e}
      .maintenance-button.secondary{border:1px solid rgba(246,197,21,.55);color:#fff;background:rgba(246,197,21,.07)}
      .maintenance-note{display:block;margin-top:34px;color:#5f6875;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
      .maintenance-tape{position:absolute;left:-12%;right:-12%;top:25px;padding:9px 0;background:repeating-linear-gradient(135deg,#f6c515 0 24px,#111 24px 48px);color:#0b0c0f;font-weight:1000;letter-spacing:.08em;transform:rotate(-4deg);box-shadow:0 8px 24px rgba(0,0,0,.35)}
      .maintenance-glow{position:absolute;border-radius:50%;filter:blur(80px);opacity:.28}
      .maintenance-glow-one{width:320px;height:320px;background:#f6c515;left:-100px;top:-100px}
      .maintenance-glow-two{width:280px;height:280px;background:#ef3340;right:-80px;bottom:-80px}
      @media(max-width:600px){.maintenance-card{padding:54px 20px 34px}.maintenance-logo{width:135px;height:135px}.maintenance-card p{font-size:14px}.maintenance-button{width:100%}}
    </style>`;

  const countdownEl = document.getElementById('maintenanceCountdown');
  const releaseTime = new Date('2026-10-03T18:15:00-05:00').getTime();
  let countdownTimer;

  function updateMaintenanceCountdown() {
    if (!countdownEl) return;
    const remaining = Math.max(0, releaseTime - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    countdownEl.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

    if (remaining <= 0) {
      countdownEl.textContent = 'RELEASING NOW';
      if (countdownTimer) clearInterval(countdownTimer);
    }
  }

  updateMaintenanceCountdown();
  countdownTimer = setInterval(updateMaintenanceCountdown, 1000);
  return true;
}

function configureVisibility(site) {
  const v = site.navigation || {};
  $('updatesSection').hidden = v.show_updates === false;
  $('milestonesSection').hidden = v.show_milestones === false;
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
    if (renderMaintenance(site)) return;
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
    setText('milestonesEyebrow', site.milestones?.eyebrow);
    setText('milestonesTitle', site.milestones?.title);
    setText('milestonesDescription', site.milestones?.description);
    setLink('milestonesDiscord', site.discord_url);
    setText('projectsEyebrow', site.projects?.eyebrow);
    setText('projectsTitle', site.projects?.title);
    setText('projectsDescription', site.projects?.description);
    setText('staffEyebrow', site.staff?.eyebrow);
    setText('staffTitle', site.staff?.title);
    setText('staffDescription', site.staff?.description);
    setText('ranksTitle', site.staff?.ranks_title);
    setText('portfoliosTitle', site.staff?.portfolios_title);
    const applicationState = String(site.applications?.status || 'closed').toLowerCase();
    const applicationStatus = $('applicationStatus');
    if (applicationStatus) {
      const isOpen = applicationState === 'open';
      applicationStatus.textContent = isOpen ? 'APPLICATIONS OPEN' : 'APPLICATIONS CLOSED';
      applicationStatus.classList.toggle('is-open', isOpen);
      applicationStatus.classList.toggle('is-closed', !isOpen);
    }
    setText('applicationStatusMessage', site.applications?.status_message);
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
    updateDiscordMilestones(site);
    setInterval(() => updateDiscordMilestones(site, true), 60000);
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
