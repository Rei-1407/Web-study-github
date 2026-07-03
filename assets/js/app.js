/* ============================================================
   Học GitHub cho Unreal Engine — app logic
   Vanilla JS SPA: hash routing, progress + XP, quizzes,
   command challenges, badges. State persists in localStorage.
   ============================================================ */
(function () {
  'use strict';

  const LESSONS = window.LESSON_CONTENT || [];
  const META = window.LESSON_META || { modules: [], nav: {} };
  const QUIZ = window.QUIZ_DATA || {};
  const CHALLENGE = window.CHALLENGE_DATA || {};

  const byId = {};
  LESSONS.forEach((l) => (byId[l.id] = l));
  const ORDER = LESSONS.map((l) => l.id);

  // ---- Spaced-repetition review pool (reuses existing quizzes + challenges) ----
  const REVIEW_ITEMS = [];
  Object.keys(QUIZ).forEach((lid) =>
    QUIZ[lid].forEach((q, i) => REVIEW_ITEMS.push({ id: `q:${lid}:${i}`, type: 'quiz', lid, i, data: q }))
  );
  Object.keys(CHALLENGE).forEach((lid) =>
    CHALLENGE[lid].forEach((c, i) => REVIEW_ITEMS.push({ id: `c:${lid}:${i}`, type: 'cmd', lid, i, data: c }))
  );
  const REVIEW_BY_ID = {};
  REVIEW_ITEMS.forEach((it) => (REVIEW_BY_ID[it.id] = it));

  const SRS_INTERVALS = [0, 1, 2, 4, 8, 16]; // days to next review, indexed by box (0..5)
  const MAX_BOX = 5;
  const NEW_PER_SESSION = 10; // cap on brand-new cards introduced per day
  const XP_REVIEW_CARD = 5;
  const XP_REVIEW_SESSION = 15;
  let reviewSession = null; // in-memory queue for the active session

  const XP_LESSON = 50;
  const XP_QUIZ = 10;
  const XP_CMD = 15;
  const XP_GRAD_BONUS = 100;
  const XP_PER_LEVEL = 150;

  const LEVEL_TITLES = [
    'Người mới', 'Tập sự', 'Học viên', 'Cộng tác viên', 'Thợ Git',
    'Thợ nhánh', 'Chuyên gia Merge', 'Bậc thầy LFS', 'Cao thủ Rebase', 'Bậc thầy GitHub',
  ];

  const GRAD_ITEMS = [
    'Giải thích được 4 khu vực của Git và <code>fetch</code> khác <code>pull</code> chỗ nào.',
    'Khởi tạo repo UE đúng thứ tự; kiểm chứng LFS bằng <code>git lfs ls-files</code>.',
    'Thành thạo vòng lặp pull → sửa → add → commit → push, với message chuẩn.',
    'Tạo nhánh, mở PR, squash-merge, dọn nhánh cả hai phía.',
    'Tự giải xung đột file văn bản; xử lý xung đột asset bằng <code>--ours</code> / <code>--theirs</code>.',
    'Lock trước khi sửa asset chung; đọc hiểu <code>git lfs locks</code>.',
    'Biết khi nào được (và không được) force push; có phản xạ dùng <code>--force-with-lease</code>.',
    'Tự cứu commit bằng <code>reflog</code> không cần trợ giúp.',
    'Tag và tạo Release cho một bản build.',
  ];

  const BADGES = [
    { id: 'setup', ico: '⚙️', name: 'Sẵn sàng', desc: 'Xong mục Cài đặt', test: (s) => s.lessons['muc-3'] },
    { id: 'daily', ico: '🔄', name: 'Nhịp làm việc', desc: 'Xong mọi thử thách mục 7', test: (s) => allCmdDone(s, 'muc-7') },
    { id: 'lfs', ico: '🗄️', name: 'Chủ LFS', desc: 'Xong mục 6 + thử thách', test: (s) => s.lessons['muc-6'] && allCmdDone(s, 'muc-6') },
    { id: 'brancher', ico: '🌿', name: 'Người rẽ nhánh', desc: 'Xong mục Nhánh & PR', test: (s) => s.lessons['muc-8'] },
    { id: 'rescuer', ico: '🛟', name: 'Đội cứu hộ', desc: 'Thành thạo reflog', test: (s) => s.challenge['muc-11:1'] },
    { id: 'quizace', ico: '🧠', name: 'Bậc thầy quiz', desc: 'Trả lời đúng 20 câu', test: (s) => quizCorrectCount(s) >= 20 },
    { id: 'halfway', ico: '🚀', name: 'Nửa chặng', desc: 'Hoàn thành 50% bài học', test: (s) => lessonDoneCount(s) >= Math.ceil(LESSONS.length / 2) },
    { id: 'graduate', ico: '🎓', name: 'Tốt nghiệp', desc: 'Xong checklist tốt nghiệp', test: (s) => GRAD_ITEMS.every((_, i) => s.grad[i]) },
    { id: 'streak7', ico: '🔥', name: 'Bền bỉ', desc: 'Ôn tập 7 ngày liên tiếp', test: (s) => (s.streak || 0) >= 7 },
    { id: 'memorize', ico: '📖', name: 'Nằm lòng', desc: 'Thuộc toàn bộ thẻ ôn tập', test: (s) => REVIEW_ITEMS.length > 0 && masteredCount(s) === REVIEW_ITEMS.length },
  ];

  // ---------------- State ----------------
  const KEY = 'git-ue-study-v1';
  const defaultState = () => ({
    lessons: {}, quiz: {}, challenge: {}, grad: {}, lastLesson: null, theme: null,
    srs: {}, streak: 0, lastReviewDate: null, reviewXp: 0,
  });
  let state = load();
  let spyObserver = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { return defaultState(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---------------- Derived ----------------
  function lessonDoneCount(s) { return Object.values(s.lessons).filter(Boolean).length; }
  function quizCorrectCount(s) { return Object.values(s.quiz).filter((q) => q && q.correct).length; }
  function cmdDoneCount(s) { return Object.values(s.challenge).filter(Boolean).length; }
  function allCmdDone(s, lid) {
    const list = CHALLENGE[lid] || [];
    if (!list.length) return false;
    return list.every((_, i) => s.challenge[lid + ':' + i]);
  }
  function gradDone(s) { return GRAD_ITEMS.filter((_, i) => s.grad[i]).length; }

  function computeXP(s) {
    let xp = lessonDoneCount(s) * XP_LESSON + quizCorrectCount(s) * XP_QUIZ + cmdDoneCount(s) * XP_CMD;
    if (GRAD_ITEMS.every((_, i) => s.grad[i])) xp += XP_GRAD_BONUS;
    xp += s.reviewXp || 0;
    return xp;
  }
  function levelFromXP(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
  function titleFor(level) { return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]; }
  function earnedBadges(s) { return BADGES.filter((b) => b.test(s)); }

  // ---------------- Spaced repetition (SRS) ----------------
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function addDays(dateStr, n) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  function masteredCount(s) {
    return REVIEW_ITEMS.reduce((n, it) => n + ((s.srs[it.id] && s.srs[it.id].box >= MAX_BOX) ? 1 : 0), 0);
  }
  function srsStats() {
    const today = todayStr();
    let mastered = 0, learning = 0, due = 0, fresh = 0;
    REVIEW_ITEMS.forEach((it) => {
      const rec = state.srs[it.id];
      if (!rec) { fresh++; return; }
      if (rec.box >= MAX_BOX) mastered++; else learning++;
      if (rec.due <= today) due++;
    });
    const dueToday = due + Math.min(fresh, NEW_PER_SESSION);
    return { total: REVIEW_ITEMS.length, mastered, learning, fresh, due, dueToday };
  }
  // Build today's session: overdue/seen cards first, then a capped batch of new ones.
  function buildSession() {
    const today = todayStr();
    const dueItems = [];
    const freshItems = [];
    REVIEW_ITEMS.forEach((it) => {
      const rec = state.srs[it.id];
      if (!rec) freshItems.push(it);
      else if (rec.due <= today) dueItems.push(it);
    });
    dueItems.sort((a, b) => (state.srs[a.id].due < state.srs[b.id].due ? -1 : 1));
    return dueItems.concat(freshItems.slice(0, NEW_PER_SESSION));
  }
  function gradeCard(id, correct) {
    const today = todayStr();
    const rec = state.srs[id] || { box: 0, seen: 0, due: today };
    rec.seen = (rec.seen || 0) + 1;
    rec.box = correct ? Math.min((rec.box || 0) + 1, MAX_BOX) : 1;
    rec.due = addDays(today, SRS_INTERVALS[rec.box]);
    rec.last = today;
    state.srs[id] = rec;
    if (correct) state.reviewXp = (state.reviewXp || 0) + XP_REVIEW_CARD;
    save();
    refreshChrome();
  }
  function finishSessionBookkeeping(correctCount) {
    const today = todayStr();
    const before = earnedBadges(state).map((b) => b.id);
    if (state.lastReviewDate !== today) {
      state.streak = state.lastReviewDate === addDays(today, -1) ? (state.streak || 0) + 1 : 1;
      state.lastReviewDate = today;
    }
    state.reviewXp = (state.reviewXp || 0) + XP_REVIEW_SESSION;
    save();
    refreshChrome();
    const gained = earnedBadges(state).filter((b) => !before.includes(b.id));
    gained.forEach((b, k) => setTimeout(() => toast(`${b.ico} Mở khóa huy hiệu: ${b.name}!`), 500 + k * 900));
  }

  // ---------------- Mutation wrapper (handles XP/level feedback) ----------------
  function mutate(fn) {
    const oldXP = computeXP(state);
    const oldLevel = levelFromXP(oldXP);
    const oldBadges = earnedBadges(state).map((b) => b.id);
    fn(state);
    save();
    const newXP = computeXP(state);
    const newLevel = levelFromXP(newXP);
    refreshChrome();
    if (newXP > oldXP) {
      const gained = newXP - oldXP;
      if (newLevel > oldLevel) {
        toast(`⭐ Lên cấp ${newLevel} — ${titleFor(newLevel)}! (+${gained} XP)`);
        confetti();
      } else {
        toast(`+${gained} XP`);
      }
    }
    const newBadges = earnedBadges(state).filter((b) => !oldBadges.includes(b.id));
    newBadges.forEach((b) => setTimeout(() => toast(`${b.ico} Mở khóa huy hiệu: ${b.name}!`), 400));
  }

  // ---------------- Chrome (sidebar + xp chip) ----------------
  function refreshChrome() {
    const xp = computeXP(state);
    const level = levelFromXP(xp);
    const q = (sel) => document.querySelector(sel);
    q('#xp-level').textContent = 'Lv ' + level;
    q('#xp-val').textContent = xp + ' XP';

    // sidebar progress
    const done = lessonDoneCount(state);
    const pct = LESSONS.length ? Math.round((done / LESSONS.length) * 100) : 0;
    q('#sidebar-progress').innerHTML =
      `<div class="sp-bar"><div class="sp-fill" style="width:${pct}%"></div></div>` +
      `<div class="sp-label"><span>Tiến độ</span><span>${done}/${LESSONS.length} bài · ${pct}%</span></div>`;

    const route = currentRoute();
    // nav checkmarks + active
    document.querySelectorAll('.nav-link').forEach((el) => {
      const id = el.dataset.id;
      el.classList.toggle('done', !!state.lessons[id]);
      el.classList.toggle('active', route.view === 'lesson' && route.id === id);
      const chk = el.querySelector('.nav-check');
      if (chk) chk.textContent = state.lessons[id] ? '✓' : '';
    });

    // review link: due badge + streak + active state
    const st = srsStats();
    const reviewLink = document.querySelector('.nav-review');
    if (reviewLink) reviewLink.classList.toggle('active', route.view === 'review');
    const badge = document.getElementById('nr-badge');
    if (badge) {
      badge.textContent = st.dueToday > 0 ? st.dueToday : '✓';
      badge.classList.toggle('zero', st.dueToday === 0);
    }
    const sub = document.getElementById('nr-sub');
    if (sub) {
      sub.textContent = state.streak > 0
        ? `🔥 ${state.streak} ngày · ${st.dueToday > 0 ? st.dueToday + ' thẻ cần ôn' : 'xong hôm nay'}`
        : (st.dueToday > 0 ? `${st.dueToday} thẻ cần ôn` : 'Bắt đầu ngay');
    }
  }

  // ---------------- Sidebar nav ----------------
  function renderNav() {
    const nav = document.getElementById('nav');
    let html =
      `<a class="nav-review" data-review href="#/review">
        <span class="nr-ico">🔁</span>
        <span class="nr-main"><b>Ôn tập hàng ngày</b><small class="nr-sub" id="nr-sub"></small></span>
        <span class="nr-badge" id="nr-badge"></span>
      </a>`;
    META.modules.forEach((mod) => {
      html += `<div class="nav-module"><div class="nav-module-title">${mod.title}</div>`;
      mod.lessons.forEach((id) => {
        const meta = META.nav[id] || {};
        html +=
          `<a class="nav-link" data-id="${id}" href="#/lesson/${id}">` +
          `<span class="nav-ico">${meta.icon || '📘'}</span>` +
          `<span class="nav-title">${meta.short || (byId[id] && byId[id].title) || id}</span>` +
          `<span class="nav-check"></span></a>`;
      });
      html += `</div>`;
    });
    nav.innerHTML = html;
  }

  // ---------------- Routing ----------------
  function currentRoute() {
    const h = location.hash.replace(/^#/, '');
    if (h === '/review') return { view: 'review', id: null };
    const m = h.match(/^\/lesson\/([\w-]+)$/);
    if (m && byId[m[1]]) return { view: 'lesson', id: m[1] };
    return { view: 'home', id: null };
  }

  function navTitleOf(id) {
    const meta = META.nav[id] || {};
    return meta.short || (byId[id] && byId[id].title) || id;
  }

  function render() {
    const route = currentRoute();
    const content = document.getElementById('content');
    if (route.view === 'lesson') renderLesson(route.id, content);
    else if (route.view === 'review') renderReview(content);
    else renderHome(content);
    refreshChrome();
    content.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    document.body.classList.remove('nav-open');
  }

  // ---------------- Home / Dashboard ----------------
  function renderHome(root) {
    document.getElementById('crumb').innerHTML = '<b>Trang chủ</b>';
    document.getElementById('page-nav').innerHTML = '';

    const xp = computeXP(state);
    const level = levelFromXP(xp);
    const inLevel = xp % XP_PER_LEVEL;
    const levelPct = Math.round((inLevel / XP_PER_LEVEL) * 100);
    const done = lessonDoneCount(state);
    const totalPct = LESSONS.length ? Math.round((done / LESSONS.length) * 100) : 0;
    const nextId = firstIncomplete();
    const resumeId = state.lastLesson && byId[state.lastLesson] ? state.lastLesson : (nextId || ORDER[0]);
    const rst = srsStats();
    const rstreak = state.streak || 0;

    const circ = 2 * Math.PI * 52;
    const dash = circ * (1 - totalPct / 100);

    let statCards =
      statCard(done + '/' + LESSONS.length, 'Bài học hoàn thành') +
      statCard(quizCorrectCount(state), 'Câu quiz đúng') +
      statCard(cmdDoneCount(state), 'Lệnh đã luyện') +
      statCard(earnedBadges(state).length + '/' + BADGES.length, 'Huy hiệu');

    let modRows = META.modules.map((mod) => {
      const total = mod.lessons.length;
      const d = mod.lessons.filter((id) => state.lessons[id]).length;
      const p = total ? Math.round((d / total) * 100) : 0;
      return (
        `<div class="module-row" data-goto="${mod.lessons[0]}">` +
        `<span class="mr-name">${mod.title}</span>` +
        `<span class="mr-bar"><i style="width:${p}%"></i></span>` +
        `<span class="mr-count">${d}/${total}</span></div>`
      );
    }).join('');

    let badgeHtml = BADGES.map((b) => {
      const earned = b.test(state);
      return (
        `<div class="badge ${earned ? 'earned' : ''}" title="${b.desc}">` +
        `<div class="b-ico">${b.ico}</div><div class="b-name">${b.name}</div>` +
        `<div class="b-desc">${b.desc}</div></div>`
      );
    }).join('');

    root.innerHTML =
      `<section class="hero">
        <h1>Thành thạo GitHub cho dự án Unreal Engine 🎮</h1>
        <p>Học theo bài, kiểm tra bằng quiz, và luyện phản xạ gõ lệnh thật. Mỗi việc bạn hoàn thành đều cộng XP — cứ thoải mái thực hành, tiến độ được lưu ngay trên máy này.</p>
        <div class="hero-cta">
          <a class="btn" href="#/lesson/${resumeId}">${state.lastLesson ? '▶ Tiếp tục học' : '▶ Bắt đầu học'} · ${navTitleOf(resumeId)}</a>
          <a class="btn ghost" href="#/lesson/muc-14">📋 Bảng tra lệnh</a>
        </div>
      </section>

      <a class="review-banner ${rst.dueToday > 0 ? 'due' : ''}" href="#/review">
        <div class="rb-ico">🔁</div>
        <div class="rb-text">
          <b>${rst.dueToday > 0 ? `Ôn tập hàng ngày · ${rst.dueToday} thẻ cần ôn` : 'Ôn tập hàng ngày · đã xong hôm nay 🎉'}</b>
          <span>${rstreak > 0 ? `🔥 Chuỗi ${rstreak} ngày · ` : ''}Đã thuộc ${rst.mastered}/${rst.total} thẻ — lặp lại ngắt quãng để nhớ lâu.</span>
        </div>
        <span class="rb-cta">${rst.dueToday > 0 ? 'Ôn ngay →' : 'Ôn thêm →'}</span>
      </a>

      <div class="stat-grid">${statCards}</div>

      <div class="dash-cols">
        <div>
          <div class="panel">
            <h2>Tiến độ tổng thể</h2>
            <p class="panel-sub">Tiếp tục để mở khóa cấp độ và huy hiệu mới.</p>
            <div class="ring-wrap">
              <div class="ring" style="--p:${totalPct}">
                <svg width="120" height="120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="12"/>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="12"
                    stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${dash.toFixed(1)}"/>
                </svg>
                <div class="ring-txt">${totalPct}%</div>
              </div>
              <div class="level-info">
                <div class="lv-title">Lv ${level} · ${titleFor(level)}</div>
                <div class="lv-sub">${xp} XP tích lũy</div>
                <div class="xp-track"><i style="width:${levelPct}%"></i></div>
                <div class="lv-next">Còn ${XP_PER_LEVEL - inLevel} XP để lên cấp ${level + 1}</div>
              </div>
            </div>
          </div>

          <div class="panel">
            <h2>Lộ trình theo chương</h2>
            <p class="panel-sub">Bấm để nhảy tới chương bất kỳ.</p>
            ${modRows}
          </div>
        </div>

        <div>
          <div class="panel">
            <h2>Huy hiệu</h2>
            <p class="panel-sub">Đã mở ${earnedBadges(state).length}/${BADGES.length}.</p>
            <div class="badges">${badgeHtml}</div>
          </div>
          <div class="panel">
            <h2>Cách học hiệu quả</h2>
            <p class="panel-sub">Gợi ý nhỏ để tối đa hóa kết quả.</p>
            <ul style="margin:0;padding-left:20px;color:var(--text-soft);font-size:14.5px;line-height:1.8">
              <li>Tạo repo thí nghiệm <code>git-lab-ue</code> ở Mục 4 rồi làm mọi bài 🧪 trên đó.</li>
              <li>Đọc xong mỗi mục thì làm quiz &amp; thử thách gõ lệnh ngay để nhớ lâu.</li>
              <li>Không sợ sai — cả tài liệu xoay quanh việc "tự gây tai nạn rồi tự cứu".</li>
            </ul>
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-goto]').forEach((el) =>
      el.addEventListener('click', () => (location.hash = '#/lesson/' + el.dataset.goto))
    );
  }

  function statCard(num, label) {
    return `<div class="stat-card"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>`;
  }
  function firstIncomplete() { return ORDER.find((id) => !state.lessons[id]) || null; }

  // ---------------- Daily review (spaced repetition) view ----------------
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function reviewStat(num, label) {
    return `<div class="stat-card"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>`;
  }

  function renderReview(root) {
    document.getElementById('crumb').innerHTML = '<b>Ôn tập hàng ngày</b>';
    document.getElementById('page-nav').innerHTML = '';
    reviewSession = null;

    const st = srsStats();
    const streak = state.streak || 0;
    const masteryPct = st.total ? Math.round((st.mastered / st.total) * 100) : 0;

    root.innerHTML =
      `<div class="review-wrap">
        <div class="review-hero">
          <div class="rh-left">
            <div class="rh-eyebrow">🔁 Ôn tập hàng ngày</div>
            <h1>${st.dueToday > 0 ? `Hôm nay có ${st.dueToday} thẻ cần ôn` : 'Bạn đã ôn hết cho hôm nay 🎉'}</h1>
            <p>Lặp lại ngắt quãng: trả lời đúng thì thẻ giãn ra xa dần, trả lời sai thì quay lại sớm — "xào đi xào lại" đúng thứ bạn hay quên để nhớ thật lâu.</p>
            <div class="rh-actions">
              ${st.dueToday > 0
                ? `<button class="btn" data-start>▶ Bắt đầu ôn (${st.dueToday} thẻ)</button>`
                : `<button class="btn" data-extra>Ôn thêm 10 thẻ ngẫu nhiên</button>`}
            </div>
          </div>
          <div class="rh-streak">
            <div class="streak-flame ${streak > 0 ? 'on' : ''}">🔥</div>
            <div class="streak-num">${streak}</div>
            <div class="streak-lbl">ngày liên tiếp</div>
          </div>
        </div>

        <div class="review-stats">
          ${reviewStat(st.dueToday, 'Cần ôn hôm nay')}
          ${reviewStat(st.mastered + '/' + st.total, 'Thẻ đã thuộc')}
          ${reviewStat(st.learning, 'Đang học')}
          ${reviewStat(st.fresh, 'Chưa gặp')}
        </div>

        <div class="panel">
          <h2>Mức độ thuộc bài</h2>
          <p class="panel-sub">Một thẻ vào nhóm "đã thuộc" sau khoảng 5 lần trả lời đúng cách quãng. Thuộc hết là bạn gần như nằm lòng cả tài liệu.</p>
          <div class="mastery-track"><i style="width:${masteryPct}%"></i></div>
          <div class="mastery-lbl">${st.mastered}/${st.total} thẻ · ${masteryPct}%</div>
        </div>

        <div class="panel">
          <h2>Cơ chế hoạt động</h2>
          <ul class="review-how">
            <li><b>Không có nội dung mới</b> — bộ thẻ chính là ${st.total} câu quiz và thử thách lệnh bạn đã gặp trong các bài học.</li>
            <li><b>Trả lời đúng</b> → thẻ hẹn gặp lại sau 1 → 2 → 4 → 8 → 16 ngày.</li>
            <li><b>Trả lời sai</b> → thẻ quay lại ngay ngày hôm sau để bạn luyện lại.</li>
            <li><b>Ôn mỗi ngày</b> để giữ chuỗi 🔥 và mở khóa huy hiệu <b>Bền bỉ</b> / <b>Nằm lòng</b>.</li>
          </ul>
        </div>
      </div>`;

    root.querySelector('[data-start]')?.addEventListener('click', () => startReview(buildSession(), root));
    root.querySelector('[data-extra]')?.addEventListener('click', () => startReview(shuffle(REVIEW_ITEMS.slice()).slice(0, 10), root));
  }

  function startReview(items, root) {
    if (!items || !items.length) return;
    reviewSession = { queue: items.map((it) => it.id), pos: 0, total: items.length, correct: 0, answered: false };
    renderReviewCard(root);
  }

  function renderReviewCard(root) {
    const s = reviewSession;
    if (!s) { renderReview(root); return; }
    if (s.pos >= s.queue.length) { renderReviewSummary(root); return; }
    const item = REVIEW_BY_ID[s.queue[s.pos]];
    const progressPct = Math.round((s.pos / s.total) * 100);
    s.answered = false;

    const body = item.type === 'quiz' ? reviewQuizBody(item) : reviewCmdBody(item);
    root.innerHTML =
      `<div class="review-wrap">
        <div class="review-topbar">
          <button class="rt-quit" data-quit type="button">✕ Kết thúc</button>
          <div class="rt-progress"><div class="rt-bar"><i style="width:${progressPct}%"></i></div>
            <span>Thẻ ${s.pos + 1}/${s.total}</span></div>
          <div class="rt-streak">🔥 ${state.streak || 0}</div>
        </div>
        <div class="review-card">
          <div class="rc-source">Từ mục <b>${navTitleOf(item.lid)}</b> · ${item.type === 'quiz' ? 'Câu hỏi' : 'Thử thách lệnh'}</div>
          ${body}
          <div class="rc-foot"><button class="btn rc-next" data-next disabled>Tiếp theo →</button></div>
        </div>
      </div>`;

    if (item.type === 'quiz') wireReviewQuiz(root, item); else wireReviewCmd(root, item);
    root.querySelector('[data-quit]').addEventListener('click', () => { reviewSession = null; renderReview(root); });
    root.querySelector('[data-next]').addEventListener('click', () => { s.pos++; renderReviewCard(root); window.scrollTo({ top: 0 }); });
  }

  function reviewQuizBody(item) {
    const q = item.data;
    const opts = q.options.map((opt, oi) =>
      `<div class="quiz-opt" data-o="${oi}"><span class="opt-key">${String.fromCharCode(65 + oi)}</span><span>${opt}</span></div>`
    ).join('');
    return `<div class="rc-prompt">${q.q}</div><div class="quiz-opts">${opts}</div><div class="quiz-explain rc-explain"></div>`;
  }

  function wireReviewQuiz(root, item) {
    const q = item.data;
    const opts = root.querySelectorAll('.quiz-opt');
    const explain = root.querySelector('.rc-explain');
    const nextBtn = root.querySelector('[data-next]');
    opts.forEach((opt) => {
      opt.addEventListener('click', () => {
        if (reviewSession.answered) return;
        reviewSession.answered = true;
        const oi = +opt.dataset.o;
        const correct = oi === q.answer;
        opts.forEach((o) => { o.classList.add('locked'); if (+o.dataset.o === q.answer) o.classList.add('correct'); });
        if (!correct) opt.classList.add('wrong');
        explain.innerHTML = (correct ? '✅ Chính xác! ' : '❌ Chưa đúng. ') + q.explain;
        explain.classList.add('show');
        if (correct) reviewSession.correct++;
        gradeCard(item.id, correct);
        nextBtn.disabled = false; nextBtn.focus();
      });
    });
  }

  function reviewCmdBody(item) {
    const c = item.data;
    return `<div class="rc-prompt">${c.task}</div>
      <div class="cmd-input-row"><span class="cmd-prompt-sign">$</span>
        <input class="cmd-input rc-input" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="gõ lệnh git…" aria-label="Ô nhập lệnh" />
        <button class="cmd-btn" data-check type="button">Kiểm tra</button></div>
      <div class="cmd-feedback rc-fb"></div>
      <button class="link-btn rc-reveal" data-reveal type="button">Chịu, hiện đáp án</button>`;
  }

  function wireReviewCmd(root, item) {
    const c = item.data;
    const input = root.querySelector('.rc-input');
    const checkBtn = root.querySelector('[data-check]');
    const revealBtn = root.querySelector('[data-reveal]');
    const fb = root.querySelector('.rc-fb');
    const nextBtn = root.querySelector('[data-next]');
    const lock = (correct) => {
      reviewSession.answered = true;
      input.disabled = true; checkBtn.disabled = true; revealBtn.style.display = 'none';
      if (correct) reviewSession.correct++;
      gradeCard(item.id, correct);
      nextBtn.disabled = false; nextBtn.focus();
    };
    const doCheck = () => {
      if (reviewSession.answered) return;
      const val = normalizeCmd(input.value);
      if (!val) { input.focus(); return; }
      if (c.accept.some((re) => re.test(val))) {
        input.classList.add('ok'); fb.className = 'cmd-feedback rc-fb ok'; fb.textContent = '✅ Chuẩn!'; lock(true);
      } else {
        input.classList.add('no'); fb.className = 'cmd-feedback rc-fb no';
        fb.innerHTML = `❌ Chưa đúng. Đáp án: <span class="cmd-reveal">${c.answer}</span>`; lock(false);
      }
    };
    checkBtn.addEventListener('click', doCheck);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doCheck(); } });
    revealBtn.addEventListener('click', () => {
      if (reviewSession.answered) return;
      input.value = c.answer; fb.className = 'cmd-feedback rc-fb no';
      fb.innerHTML = `Đáp án: <span class="cmd-reveal">${c.answer}</span>`; lock(false);
    });
    setTimeout(() => input.focus(), 30);
  }

  function renderReviewSummary(root) {
    const s = reviewSession;
    finishSessionBookkeeping(s.correct);
    confetti();
    const st = srsStats();
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    root.innerHTML =
      `<div class="review-wrap">
        <div class="review-done">
          <div class="rd-emoji">${pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📈'}</div>
          <h1>Xong buổi ôn hôm nay!</h1>
          <p>Bạn trả lời đúng <b>${s.correct}/${s.total}</b> thẻ. Chuỗi hiện tại: <b>🔥 ${state.streak || 0} ngày</b>.</p>
          <div class="review-stats">
            ${reviewStat(s.correct + '/' + s.total, 'Đúng buổi này')}
            ${reviewStat(st.mastered + '/' + st.total, 'Đã thuộc')}
            ${reviewStat(st.dueToday, 'Còn cần ôn')}
          </div>
          <div class="rd-actions">
            ${st.dueToday > 0
              ? `<button class="btn" data-continue>Ôn tiếp ${st.dueToday} thẻ còn lại</button>`
              : `<button class="btn ghost" data-extra>Ôn thêm 10 thẻ ngẫu nhiên</button>`}
            <a class="btn ghost" href="#/">Về trang chủ</a>
          </div>
          <p class="rd-tip">Quay lại vào ngày mai để giữ chuỗi 🔥 và cho spaced-repetition phát huy tác dụng nhé!</p>
        </div>
      </div>`;
    root.querySelector('[data-continue]')?.addEventListener('click', () => startReview(buildSession(), root));
    root.querySelector('[data-extra]')?.addEventListener('click', () => startReview(shuffle(REVIEW_ITEMS.slice()).slice(0, 10), root));
  }

  // ---------------- Lesson ----------------
  function renderLesson(id, root) {
    const lesson = byId[id];
    mutate((s) => { s.lastLesson = id; }); // silent (no XP change)

    const idx = ORDER.indexOf(id);
    const meta = META.nav[id] || {};
    const kicker = lesson.kind === 'appendix' ? 'Phụ lục ' + lesson.num : 'Mục ' + lesson.num;
    document.getElementById('crumb').innerHTML = `Bài học · <b>${meta.short || lesson.title}</b>`;

    let practiceInner = '';
    if (QUIZ[id]) practiceInner += buildQuiz(id);
    if (CHALLENGE[id]) practiceInner += buildChallenges(id);
    if (id === 'muc-15') practiceInner += buildGraduation();
    const practiceSection = practiceInner
      ? `<section class="practice" id="luyen-tap">
           <div class="practice-head">
             <span class="practice-eyebrow">✏️ Luyện tập</span>
             <h2>Đến lượt bạn</h2>
             <p>Củng cố phần vừa đọc và luyện phản xạ gõ lệnh — mỗi câu đúng đều cộng XP.</p>
           </div>
           ${practiceInner}
         </section>`
      : '';

    const cleanTitle = lesson.title.replace(/`([^`]+)`/g, '$1');
    const bodyHtml = lesson.html.replace(/\s*<hr>\s*$/, ''); // drop trailing rule (practice adds its own divider)

    root.innerHTML =
      `<div class="lesson-grid">
        <div class="lesson-main">
          <article class="lesson">
            <div class="lesson-kicker">${meta.icon || ''} ${kicker}</div>
            <h1>${cleanTitle}</h1>
            <div class="article">${bodyHtml}</div>
          </article>
          ${practiceSection}
          ${buildCompleteBar(id)}
          ${buildPageNav(idx)}
        </div>
        <aside class="lesson-rail" id="lesson-rail"></aside>
      </div>`;

    if (id === 'muc-14') enhanceCheatsheet(root);

    enhanceCode(root);
    buildTOC(root, !!practiceInner);
    wireQuiz(root, id);
    wireChallenges(root, id);
    wireGraduation(root);
    wireCompleteBar(root, id);
    document.getElementById('page-nav').innerHTML = ''; // external footer unused on lessons
  }

  // Build the "Trong mục này" rail from the article headings, with scroll-spy.
  function buildTOC(root, hasPractice) {
    const rail = root.querySelector('#lesson-rail');
    const grid = root.querySelector('.lesson-grid');
    if (!rail) return;
    const heads = Array.from(root.querySelectorAll('.article h2[id], .article h3[id]'));
    if (heads.length < 2) { grid.classList.add('no-rail'); rail.remove(); return; }

    let html = '<div class="toc"><div class="toc-title">Trong mục này</div><nav class="toc-nav">';
    heads.forEach((h) => {
      const sub = h.tagName === 'H3' ? ' toc-sub' : '';
      html += `<a class="toc-link${sub}" href="#${h.id}" data-target="${h.id}">${h.textContent}</a>`;
    });
    html += '</nav>';
    if (hasPractice) html += '<a class="toc-practice" href="#luyen-tap">✏️ Luyện tập &amp; kiểm tra</a>';
    html += '</div>';
    rail.innerHTML = html;

    // in-page scroll without touching the router hash
    rail.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById(a.getAttribute('href').slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    wireScrollSpy(root, heads);
  }

  function wireScrollSpy(root, heads) {
    const links = {};
    root.querySelectorAll('.toc-link').forEach((l) => (links[l.dataset.target] = l));
    if (spyObserver) spyObserver.disconnect();
    spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            Object.values(links).forEach((l) => l.classList.remove('active'));
            if (links[e.target.id]) links[e.target.id].classList.add('active');
          }
        });
      },
      { rootMargin: '-80px 0px -72% 0px', threshold: 0 }
    );
    heads.forEach((h) => spyObserver.observe(h));
  }

  function buildCompleteBar(id) {
    const doneNow = !!state.lessons[id];
    return (
      `<div class="complete-bar">
        <div class="cb-text">
          <b>${doneNow ? '✅ Bạn đã hoàn thành mục này' : 'Đã nắm được nội dung mục này?'}</b>
          <span>${doneNow ? 'Có thể bỏ đánh dấu bất cứ lúc nào.' : 'Đánh dấu hoàn thành để cộng ' + XP_LESSON + ' XP và theo dõi tiến độ.'}</span>
        </div>
        <button class="btn ${doneNow ? 'done' : ''}" data-complete="${id}">
          ${doneNow ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}
        </button>
      </div>`
    );
  }

  function wireCompleteBar(root, id) {
    const btn = root.querySelector('[data-complete]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const willComplete = !state.lessons[id];
      mutate((s) => {
        if (willComplete) s.lessons[id] = true; else delete s.lessons[id];
      });
      if (willComplete) confetti();
      // re-render just the bar
      const bar = root.querySelector('.complete-bar');
      const wrap = document.createElement('div');
      wrap.innerHTML = buildCompleteBar(id);
      bar.replaceWith(wrap.firstElementChild);
      wireCompleteBar(root, id);
      if (willComplete && lessonDoneCount(state) === LESSONS.length) {
        setTimeout(() => toast('🏆 Bạn đã hoàn thành TẤT CẢ bài học! Tuyệt vời!'), 500);
      }
    });
  }

  function buildPageNav(idx) {
    const prev = idx > 0 ? ORDER[idx - 1] : null;
    const next = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
    let html = '<nav class="page-nav in-content">';
    if (prev) html += `<a href="#/lesson/${prev}"><span class="pn-label">← Trước</span><span class="pn-title">${navTitleOf(prev)}</span></a>`;
    else html += `<a href="#/"><span class="pn-label">←</span><span class="pn-title">Trang chủ</span></a>`;
    if (next) html += `<a class="next" href="#/lesson/${next}"><span class="pn-label">Tiếp →</span><span class="pn-title">${navTitleOf(next)}</span></a>`;
    else html += `<a class="next" href="#/"><span class="pn-label">→</span><span class="pn-title">Hoàn tất · Về trang chủ</span></a>`;
    html += '</nav>';
    return html;
  }

  // ---------------- Quiz ----------------
  function buildQuiz(id) {
    const qs = QUIZ[id];
    let items = qs.map((q, qi) => {
      const opts = q.options.map((opt, oi) =>
        `<div class="quiz-opt" data-q="${qi}" data-o="${oi}">` +
        `<span class="opt-key">${String.fromCharCode(65 + oi)}</span><span>${opt}</span></div>`
      ).join('');
      return (
        `<div class="quiz-q" data-qi="${qi}">
          <div class="quiz-prompt">${qi + 1}. ${q.q}</div>
          <div class="quiz-opts">${opts}</div>
          <div class="quiz-explain"></div>
        </div>`
      );
    }).join('');
    return (
      `<div class="widget" data-quiz="${id}">
        <div class="widget-head"><span class="widget-badge">Quiz</span>
          <h3 class="widget-title">Kiểm tra nhanh</h3></div>
        <p class="widget-sub">Chọn đáp án đúng — mỗi câu đúng +${XP_QUIZ} XP. Bạn có thể thử lại nếu sai.</p>
        ${items}
      </div>`
    );
  }

  function wireQuiz(root, id) {
    const qs = QUIZ[id];
    if (!qs) return;
    const widget = root.querySelector('.widget[data-quiz="' + id + '"]');
    // restore prior answers
    qs.forEach((q, qi) => {
      const saved = state.quiz[id + ':' + qi];
      if (saved && saved.correct) lockQuiz(widget, qi, q, saved.picked);
    });
    widget.querySelectorAll('.quiz-opt').forEach((opt) => {
      opt.addEventListener('click', () => {
        const qi = +opt.dataset.q, oi = +opt.dataset.o;
        const key = id + ':' + qi;
        if (state.quiz[key] && state.quiz[key].correct) return; // already solved
        const q = qs[qi];
        const correct = oi === q.answer;
        const qBlock = widget.querySelector('.quiz-q[data-qi="' + qi + '"]');
        qBlock.querySelectorAll('.quiz-opt').forEach((o) => o.classList.remove('wrong'));
        if (correct) {
          mutate((s) => { s.quiz[key] = { picked: oi, correct: true }; });
          lockQuiz(widget, qi, q, oi);
        } else {
          opt.classList.add('wrong');
          const ex = qBlock.querySelector('.quiz-explain');
          ex.innerHTML = '❌ Chưa đúng. Thử lại nhé!';
          ex.classList.add('show');
          if (!state.quiz[key]) { state.quiz[key] = { picked: oi, correct: false }; save(); }
        }
      });
    });
  }

  function lockQuiz(widget, qi, q, picked) {
    const qBlock = widget.querySelector('.quiz-q[data-qi="' + qi + '"]');
    qBlock.querySelectorAll('.quiz-opt').forEach((o) => {
      o.classList.add('locked');
      const oi = +o.dataset.o;
      o.classList.remove('wrong');
      if (oi === q.answer) o.classList.add('correct');
    });
    const ex = qBlock.querySelector('.quiz-explain');
    ex.innerHTML = '✅ Chính xác! ' + q.explain;
    ex.classList.add('show');
  }

  // ---------------- Command challenges ----------------
  function buildChallenges(id) {
    const list = CHALLENGE[id];
    let items = list.map((c, ci) =>
      `<div class="cmd-item" data-ci="${ci}">
        <div class="cmd-task">${ci + 1}. ${c.task}</div>
        <div class="cmd-input-row">
          <span class="cmd-prompt-sign">$</span>
          <input class="cmd-input" type="text" spellcheck="false" autocomplete="off"
            autocapitalize="off" placeholder="gõ lệnh git ở đây…" aria-label="Ô nhập lệnh" />
          <button class="cmd-btn" type="button">Kiểm tra</button>
        </div>
        <div class="cmd-feedback"></div>
      </div>`
    ).join('');
    return (
      `<div class="widget" data-cmd="${id}">
        <div class="widget-head"><span class="widget-badge cmd">Thực hành lệnh</span>
          <h3 class="widget-title">Luyện gõ lệnh git</h3></div>
        <p class="widget-sub">Gõ đúng lệnh cho từng yêu cầu — mỗi lệnh đúng +${XP_CMD} XP. Cần gợi ý thì cứ đoán, hệ thống sẽ nhắc.</p>
        ${items}
      </div>`
    );
  }

  function normalizeCmd(str) { return str.trim().replace(/\s+/g, ' '); }

  function wireChallenges(root, id) {
    const list = CHALLENGE[id];
    if (!list) return;
    const widget = root.querySelector('.widget[data-cmd="' + id + '"]');
    widget.querySelectorAll('.cmd-item').forEach((item) => {
      const ci = +item.dataset.ci;
      const c = list[ci];
      const input = item.querySelector('.cmd-input');
      const btn = item.querySelector('.cmd-btn');
      const fb = item.querySelector('.cmd-feedback');
      const key = id + ':' + ci;
      let attempts = 0;

      if (state.challenge[key]) {
        input.value = c.answer;
        input.classList.add('ok');
        input.disabled = true; btn.disabled = true;
        fb.className = 'cmd-feedback ok';
        fb.textContent = '✅ Đã hoàn thành';
      }

      const check = () => {
        if (state.challenge[key]) return;
        const val = normalizeCmd(input.value);
        if (!val) return;
        const ok = c.accept.some((re) => re.test(val));
        if (ok) {
          input.classList.remove('no'); input.classList.add('ok');
          input.disabled = true; btn.disabled = true;
          fb.className = 'cmd-feedback ok';
          fb.textContent = '✅ Chuẩn! Đúng lệnh cần dùng.';
          mutate((s) => { s.challenge[key] = true; });
        } else {
          attempts++;
          input.classList.add('no');
          fb.className = 'cmd-feedback no';
          if (attempts >= 2) {
            fb.innerHTML = `❌ Chưa đúng. Gợi ý: <span class="cmd-hint">${c.hint}</span>` +
              (attempts >= 3 ? `<br>Đáp án: <span class="cmd-reveal">${c.answer}</span>` : '');
          } else {
            fb.innerHTML = `❌ Chưa đúng. <span class="cmd-hint">Kiểm tra lại cú pháp rồi thử lần nữa.</span>`;
          }
        }
      };
      btn.addEventListener('click', check);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      input.addEventListener('input', () => input.classList.remove('no'));
    });
  }

  // ---------------- Cheatsheet search (muc-14) ----------------
  // The section is authored as <p><strong>Group</strong></p> + <pre> blocks
  // of "command  # description" lines. Turn it into a searchable grouped table.
  function enhanceCheatsheet(root) {
    const article = root.querySelector('.article');
    const groups = [];
    let current = null;
    Array.from(article.children).forEach((el) => {
      const strong = el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'STRONG';
      if (strong) { current = { title: el.textContent.trim(), rows: [] }; groups.push(current); return; }
      if (el.tagName === 'PRE' && current) {
        const code = el.querySelector('code');
        if (!code) return;
        code.innerText.split('\n').forEach((line) => {
          if (!line.trim()) return;
          const hash = line.indexOf('#');
          const cmd = (hash >= 0 ? line.slice(0, hash) : line).trim();
          const desc = hash >= 0 ? line.slice(hash + 1).trim() : '';
          if (cmd) current.rows.push({ cmd, desc });
        });
      }
    });

    if (!groups.length) return; // nothing to transform; leave content as-is

    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let html =
      `<input class="cheat-search" type="search" placeholder="🔎 Tìm lệnh… (vd: push, lfs, reset, tag)" aria-label="Tìm lệnh" />` +
      `<div class="cheat-hint">Gõ để lọc nhanh toàn bộ ${groups.reduce((n, g) => n + g.rows.length, 0)} lệnh bên dưới.</div>` +
      `<div class="cheat-groups">`;
    groups.forEach((g, gi) => {
      html += `<h3 class="cheat-group-title" data-group="${gi}">${esc(g.title)}</h3>`;
      html += `<table class="cheat-table"><tbody>`;
      g.rows.forEach((r) => {
        html += `<tr class="cheat-row" data-group="${gi}"><td><code>${esc(r.cmd)}</code></td><td>${esc(r.desc)}</td></tr>`;
      });
      html += `</tbody></table>`;
    });
    html += `</div>`;
    article.innerHTML = html;

    const box = article.querySelector('.cheat-search');
    const rows = Array.from(article.querySelectorAll('.cheat-row'));
    const titles = Array.from(article.querySelectorAll('.cheat-group-title'));
    box.addEventListener('input', () => {
      const q = box.value.trim().toLowerCase();
      const shown = {};
      rows.forEach((r) => {
        const hit = !q || r.textContent.toLowerCase().includes(q);
        r.classList.toggle('cheat-hidden', !hit);
        if (hit) shown[r.dataset.group] = true;
      });
      titles.forEach((t) => {
        const has = shown[t.dataset.group];
        t.style.display = (!q || has) ? '' : 'none';
        const tbl = t.nextElementSibling;
        if (tbl) tbl.style.display = (!q || has) ? '' : 'none';
      });
    });
  }

  // ---------------- Graduation checklist (muc-15) ----------------
  function buildGraduation() {
    const items = GRAD_ITEMS.map((t, i) =>
      `<li class="grad-item ${state.grad[i] ? 'checked' : ''}" data-grad="${i}">
        <span class="grad-box">✓</span><span class="grad-text">${t}</span></li>`
    ).join('');
    const done = gradDone(state);
    return (
      `<div class="widget" data-grad-widget>
        <div class="widget-head"><span class="widget-badge">Tốt nghiệp</span>
          <h3 class="widget-title">Checklist "tốt nghiệp"</h3></div>
        <p class="widget-sub" data-grad-sub>Tự tin đánh dấu hết ${GRAD_ITEMS.length} mục là bạn sẵn sàng dùng Git trên dự án UE thật. Hoàn thành cả checklist: +${XP_GRAD_BONUS} XP và huy hiệu 🎓.</p>
        <ul class="grad-list">${items}</ul>
      </div>`
    );
  }

  function wireGraduation(root) {
    const widget = root.querySelector('[data-grad-widget]');
    if (!widget) return;
    widget.querySelectorAll('.grad-item').forEach((item) => {
      item.addEventListener('click', () => {
        const i = +item.dataset.grad;
        const wasAll = GRAD_ITEMS.every((_, k) => state.grad[k]);
        mutate((s) => { if (s.grad[i]) delete s.grad[i]; else s.grad[i] = true; });
        item.classList.toggle('checked', !!state.grad[i]);
        const nowAll = GRAD_ITEMS.every((_, k) => state.grad[k]);
        const sub = widget.querySelector('[data-grad-sub]');
        if (sub) sub.textContent = `Đã đánh dấu ${gradDone(state)}/${GRAD_ITEMS.length} mục.`;
        if (nowAll && !wasAll) { confetti(); setTimeout(() => toast('🎓 Chúc mừng bạn đã "tốt nghiệp"!'), 300); }
      });
    });
  }

  // ---------------- Code enhance (highlight + copy) ----------------
  function enhanceCode(root) {
    root.querySelectorAll('pre code').forEach((block) => {
      try { if (window.hljs) window.hljs.highlightElement(block); } catch (e) {}
      const pre = block.parentElement;
      if (pre.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = 'Sao chép';
      btn.addEventListener('click', () => {
        const text = block.innerText;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✓ Đã chép'; btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Sao chép'; btn.classList.remove('copied'); }, 1400);
        }).catch(() => {});
      });
      pre.appendChild(btn);
    });
  }

  // ---------------- Toast + confetti ----------------
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.innerHTML = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#6c47ff', '#1a9d5a', '#ffb703', '#ff6b61', '#4cc9f0'];
    for (let i = 0; i < 80; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(p);
      const dur = 1400 + Math.random() * 1200;
      const drift = (Math.random() - 0.5) * 200;
      p.animate(
        [
          { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${drift}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`, opacity: 1 },
        ],
        { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)' }
      ).onfinish = () => p.remove();
    }
  }

  // ---------------- Theme ----------------
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.getElementById('theme-toggle').textContent = t === 'dark' ? '☀️' : '🌙';
  }
  function initTheme() {
    let t = state.theme;
    if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(t);
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      state.theme = next; save();
    });
  }

  // ---------------- Init ----------------
  function init() {
    if (!LESSONS.length) {
      document.getElementById('content').innerHTML =
        '<p style="padding:40px">Không tải được nội dung bài học. Hãy chạy lại bước build (tools/npm run build).</p>';
      return;
    }
    renderNav();
    initTheme();

    document.getElementById('sidebar-toggle').addEventListener('click', () =>
      document.body.classList.toggle('nav-open'));
    document.getElementById('reset-progress').addEventListener('click', () => {
      if (confirm('Xóa toàn bộ tiến độ, XP và huy hiệu đã lưu trên máy này?')) {
        state = defaultState(); save(); render(); toast('Đã đặt lại tiến độ.');
      }
    });

    window.addEventListener('hashchange', render);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
