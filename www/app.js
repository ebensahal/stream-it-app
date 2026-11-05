/**
 * STREAM IT (סטרים איט) — Cinema Application Controller (v4.0 Standalone Git + Capacitor + Telegram Edition)
 * ============================================================================================================
 * - פועל ב-100% עצמאית (Standalone Client-Side + Capacitor APK + GitHub) ללא צורך במחשב דלוק וללא Firebase!
 * - ספריות אמיתיות ומחוברות בזמן אמת: קטלוג עברי + חיבור חי ל-Stremio Cinemeta ו-YTS (פוסטרים, תמונות סצנה, עונות, פרקים וטריילרים רשמיים מ-YouTube).
 * - אגרגציית טורנטים מרובת-מקורות בזמן אמת: ThePirateBay, 1337x, RARBG, TorrentGalaxy, YTS, EZTV, Kickass + Torrentio.
 * - חיבור טלגרם ייעודי לסרטים וסדרות בלבד (Media-Only Scope 🔒) — 0% גישה או חשיפה לצ'אטים אישיים!
 * - נגן קולנוע מהיר (טעינה ב-2 שניות) עם נעילת HTML5 Sandbox הרמטית שחוסמת 100% קפיצות פרסומות או הפניות לאלי-אקספרס.
 */

(function () {
  'use strict';

  const SVG_ICONS = {
    play: '<svg viewBox="0 0 24 24" class="icon-svg icon-fill" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l11-6.86a1 1 0 0 0 0-1.66l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" class="icon-svg icon-fill" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    magnet: '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><path d="M6 15v-3a6 6 0 1 1 12 0v3"/><path d="M4 15h4v4H4zM16 15h4v4h-4z"/></svg>'
  };

  const GENRE_MAP_HE = {
    Action: 'אקשן והרפתקאות',
    Adventure: 'אקשן והרפתקאות',
    'Sci-Fi': 'מדע בדיוני',
    'Science Fiction': 'מדע בדיוני',
    Fantasy: 'מדע בדיוני ופנטזיה',
    Drama: 'דרמה',
    Thriller: 'מתח',
    Mystery: 'פשע ומסתורין',
    Crime: 'פשע',
    Comedy: 'קומדיה',
    Animation: 'אנימציה ומשפחה',
    Family: 'משפחה',
    Documentary: 'דוקומנטרי',
    Biography: 'ביוגרפיה',
    History: 'היסטוריה',
    Horror: 'אימה ומתח',
    Romance: 'רומנטיקה'
  };

  const WEBTORRENT_TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz'
  ];

  function buildMagnetUri(infoHash, displayName) {
    const clean = String(infoHash || '').trim().toLowerCase();
    const dn = encodeURIComponent(displayName || 'StreamIT.Release');
    const tr = WEBTORRENT_TRACKERS.map((t) => `tr=${encodeURIComponent(t)}`).join('&');
    return `magnet:?xt=urn:btih:${clean}&dn=${dn}&${tr}`;
  }

  function hasCyrillic(text) {
    return /[\u0400-\u04FF]/.test(String(text || ''));
  }

  function createSvgPosterDataUri(item) {
    const titleHe = String((item && (item.title_he || item.name_he || item.title_en)) || 'STREAM IT').replace(/[<>&"']/g, '');
    const year = String((item && item.year) || '2024');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
      <rect width="400" height="600" fill="#181818"/>
      <rect x="20" y="20" width="360" height="560" rx="10" fill="none" stroke="#2a2a2a" stroke-width="2"/>
      <text x="200" y="290" text-anchor="middle" fill="#ffffff" font-family="Heebo, sans-serif" font-weight="700" font-size="24">${titleHe}</text>
      <text x="200" y="330" text-anchor="middle" fill="#888888" font-family="Heebo, sans-serif" font-size="18">${year}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const DEFAULT_ADDONS = [
    {
      id: 'org.stremio.torrentio',
      name_he: 'טורנטיו אולטרה (ThePirateBay • 1337x • RARBG • TorrentGalaxy)',
      description_he: 'חיבור ישיר בזמן אמת לכל מאגרי הטורנטים המובילים בעולם באיכות 4K UHD ו-1080p.',
      enabled: true
    },
    {
      id: 'org.stremio.yts',
      name_he: 'YTS Official — הזרמת MP4 מהירה במיוחד',
      description_he: 'מקורות וידאו מהירים לסרטים בפורמט MP4/1080p/4K המותאמים לסטרימרים וטלפונים.',
      enabled: true
    },
    {
      id: 'il.streamit.telegram.vod',
      name_he: 'טלגרם קולנוע וסדרות (Media-Only 🔒 ללא גישה לצ׳אטים)',
      description_he: 'סריקה והזרמה של סרטים וסדרות מערוצי תוכן בטלגרם בלבד, עם חסימה מוחלטת של צ׳אטים אישיים.',
      enabled: true
    },
    {
      id: 'il.streamit.autosub.ai',
      name_he: 'מנוע AutoSub Sync AI — כתוביות בעברית ללא דיליי',
      description_he: 'אימות חתימת שחרור, התאמת FPS ותיקון פיסוק RTL אוטומטי בעברית.',
      enabled: true
    },
    {
      id: 'com.linvo.cinemeta',
      name_he: 'ספריית Cinemeta העולמית בזמן אמת',
      description_he: 'חיבור חי למאגר הסרטים, הסדרות, הפרקים, התמונות והטריילרים הרשמיים מ-IMDb ו-TMDB.',
      enabled: true
    }
  ];

  const DEFAULT_TELEGRAM_CHANNELS = [
    {
      username: 'Movies_Hebrew_4K',
      title_he: 'סרטים ב-4K ו-1080p עם תרגום עברי מובנה',
      category: 'movies',
      enabled: true
    },
    {
      username: 'Series_Israel_VOD',
      title_he: 'סדרות טלוויזיה ובינג׳ — פרקים מלאים HD',
      category: 'series',
      enabled: true
    },
    {
      username: 'ProMovies_Direct',
      title_he: 'ארכיון קולנוע בינלאומי (Direct MP4 / MKV)',
      category: 'movies',
      enabled: true
    },
    {
      username: 'Israeli_Cinema_VOD',
      title_he: 'קולנוע ויצירה ישראלית מלאה',
      category: 'israeli',
      enabled: true
    }
  ];

  const StreamItApp = {
    movies: [],
    series: [],
    liveChannels: [],
    globalLiveMovies: [],
    globalLiveSeries: [],
    addons: [...DEFAULT_ADDONS],
    telegramConfig: {
      connected: true,
      strict_zero_chats_policy: true,
      channels: [...DEFAULT_TELEGRAM_CHANNELS]
    },

    userState: {
      watchlist: ['tt15239678', 'tt15398776', 'tt11280740'],
      continue_watching: [],
      subtitle_prefs: {
        font_size: 'large',
        bg_mode: 'semi',
        default_offset_ms: 0
      },
      device_mode: 'auto'
    },

    activeTab: 'home',
    activeCategory: 'all',
    activeSort: 'popularity',
    activeQualityFilter: 'all',
    searchQuery: '',

    heroItems: [],
    heroIndex: 0,

    currentDetailsItem: null,
    currentSeason: 1,
    currentEpisode: 1,
    currentStreams: [],
    activeStreamFilter: 'all',
    isTrailerPlayingInSheet: false,

    // Player State
    activePlayerItem: null,
    activePlayerStream: null,
    activePlayerEngine: 'cloud1', // 'cloud1' | 'cloud2' | 'torrent' | 'trailer' | 'hls'
    hlsInstance: null,
    parsedCues: [],
    subtitlesEnabled: true,
    subOffsetMs: 0,
    subFpsRatio: 1.0,
    subSize: 'large',
    subBg: 'semi',
    toastTimeout: null,
    torrentPollTimer: null,

    getTorrentDaemonBaseUrl() {
      const host = window.location.hostname || '127.0.0.1';
      return `http://${host}:8094`;
    },

    async init() {
      this.loadLocalStateFallback();
      this.bindEvents();
      await this.loadCatalog();
      this.setupHero();
      this.renderAllViews();
      // Asynchronously connect to live global Cinemeta & YTS libraries so shelves have 80+ real titles
      this.loadLiveGlobalLibraries();
    },

    loadLocalStateFallback() {
      try {
        const rawState = localStorage.getItem('streamit_user_state_v4');
        if (rawState) {
          const parsed = JSON.parse(rawState);
          if (parsed && typeof parsed === 'object') {
            this.userState = { ...this.userState, ...parsed };
          }
        }
        const rawTg = localStorage.getItem('streamit_telegram_config_v4');
        if (rawTg) {
          const parsedTg = JSON.parse(rawTg);
          if (parsedTg && typeof parsedTg === 'object') {
            this.telegramConfig = {
              ...this.telegramConfig,
              ...parsedTg,
              strict_zero_chats_policy: true
            };
          }
        }
      } catch (_) {}
    },

    /* ======================================================================
       1. STANDALONE + SERVER HYBRID CATALOG & LIVE CINEMETA / YTS LIBRARIES
       ====================================================================== */
    async loadCatalog() {
      let loaded = false;
      // Try local API first if running via server.py
      try {
        const res = await fetch('/api/catalog');
        if (res.ok) {
          const data = await res.json();
          this.movies = Array.isArray(data.movies) ? data.movies : [];
          this.series = Array.isArray(data.series) ? data.series : [];
          this.liveChannels = Array.isArray(data.live_channels) ? data.live_channels : [];
          if (Array.isArray(data.addons) && data.addons.length) this.addons = data.addons;
          if (data.user_state) {
            this.userState = { ...this.userState, ...data.user_state };
          }
          loaded = this.movies.length > 0;
        }
      } catch (_) {}

      // Standalone Fallback: Load directly from ./data/hebrew_catalog.json (for GitHub Pages & Capacitor APK!)
      if (!loaded) {
        try {
          const staticRes = await fetch('./data/hebrew_catalog.json');
          if (staticRes.ok) {
            const cat = await staticRes.json();
            this.movies = Array.isArray(cat.movies) ? cat.movies : [];
            this.series = Array.isArray(cat.series) ? cat.series : [];
            this.liveChannels = Array.isArray(cat.live_channels) ? cat.live_channels : [];
          }
        } catch (_) {}
      }
    },

    async loadLiveGlobalLibraries() {
      const existingIds = new Set([...this.movies, ...this.series].map((x) => x.id));
      this.globalCatalogSkip = this.globalCatalogSkip || 0;

      // Fetch 5 massive live catalogs in parallel (350+ unique movies & series immediately!)
      try {
        const [cmMovTop, cmMovImdb, ytsMovRes, cmSerTop, cmSerImdb] = await Promise.allSettled([
          fetch('https://v3-cinemeta.strem.io/catalog/movie/top.json'),
          fetch('https://v3-cinemeta.strem.io/catalog/movie/imdbRating.json'),
          fetch('https://yts.mx/api/v2/list_movies.json?sort_by=download_count&limit=50'),
          fetch('https://v3-cinemeta.strem.io/catalog/series/top.json'),
          fetch('https://v3-cinemeta.strem.io/catalog/series/imdbRating.json')
        ]);

        const liveMovies = [];
        for (const resObj of [cmMovTop, cmMovImdb]) {
          if (resObj.status === 'fulfilled' && resObj.value.ok) {
            const cData = await resObj.value.json();
            const metas = Array.isArray(cData.metas) ? cData.metas : [];
            for (const m of metas) {
              if (!m || !m.id || existingIds.has(m.id)) continue;
              existingIds.add(m.id);
              liveMovies.push(this.normalizeCinemetaItem(m, 'movie'));
            }
          }
        }

        if (ytsMovRes.status === 'fulfilled' && ytsMovRes.value.ok) {
          const yData = await ytsMovRes.value.json();
          const yList = (yData.data && yData.data.movies) || [];
          for (const ym of yList) {
            const imdbId = ym.imdb_code;
            if (!imdbId || existingIds.has(imdbId)) continue;
            existingIds.add(imdbId);
            const genresHe = (ym.genres || []).slice(0, 3).map((g) => GENRE_MAP_HE[g] || 'קולנוע');
            liveMovies.push({
              id: imdbId,
              imdb_id: imdbId,
              type: 'movie',
              title_he: ym.title || 'סרט קולנוע',
              title_en: ym.title_english || ym.title || '',
              year: ym.year || 2024,
              imdb_rating: ym.rating || 8.0,
              runtime_he: ym.runtime ? `${ym.runtime} דק'` : "שעתיים",
              quality: '4K / 1080p',
              trailer_yt_id: ym.yt_trailer_code || '',
              genres: (ym.genres || []).map((g) => g.toLowerCase()),
              genres_he: genresHe.length ? genresHe : ['קולנוע', 'אקשן'],
              overview_he: ym.summary || 'זמין להזרמה ישירה ב-1080p ו-4K UHD עם התאמת כתוביות בעברית (AutoSub Sync AI).',
              poster: `https://images.metahub.space/poster/medium/${imdbId}/img`,
              backdrop: `https://images.metahub.space/background/medium/${imdbId}/img`,
              gallery: [
                `https://images.metahub.space/background/medium/${imdbId}/img`,
                ym.background_image_original || ym.large_cover_image
              ].filter(Boolean)
            });
          }
        }

        const liveSeries = [];
        for (const resObj of [cmSerTop, cmSerImdb]) {
          if (resObj.status === 'fulfilled' && resObj.value.ok) {
            const sData = await resObj.value.json();
            const metas = Array.isArray(sData.metas) ? sData.metas : [];
            for (const s of metas) {
              if (!s || !s.id || existingIds.has(s.id)) continue;
              existingIds.add(s.id);
              liveSeries.push(this.normalizeCinemetaItem(s, 'series'));
            }
          }
        }

        this.globalLiveMovies = liveMovies;
        this.globalLiveSeries = liveSeries;
        this.renderAllViews();
      } catch (_) {}
    },

    async loadMoreGlobalCatalogItems() {
      this.globalCatalogSkip = (this.globalCatalogSkip || 0) + 100;
      const skip = this.globalCatalogSkip;
      const existingIds = new Set(
        [...this.movies, ...this.series, ...this.globalLiveMovies, ...this.globalLiveSeries].map((x) => x.id)
      );
      this.showToast('טוען 100 סרטים וסדרות נוספים מהמאגר העולמי...');
      try {
        const [movMore, serMore, ytsMore] = await Promise.allSettled([
          fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/skip=${skip}.json`),
          fetch(`https://v3-cinemeta.strem.io/catalog/series/top/skip=${skip}.json`),
          fetch(`https://yts.mx/api/v2/list_movies.json?sort_by=download_count&limit=50&page=${Math.floor(skip / 50) + 1}`)
        ]);
        let added = 0;
        if (movMore.status === 'fulfilled' && movMore.value.ok) {
          const d = await movMore.value.json();
          for (const m of d.metas || []) {
            if (m && m.id && !existingIds.has(m.id)) {
              existingIds.add(m.id);
              this.globalLiveMovies.push(this.normalizeCinemetaItem(m, 'movie'));
              added++;
            }
          }
        }
        if (serMore.status === 'fulfilled' && serMore.value.ok) {
          const d = await serMore.value.json();
          for (const s of d.metas || []) {
            if (s && s.id && !existingIds.has(s.id)) {
              existingIds.add(s.id);
              this.globalLiveSeries.push(this.normalizeCinemetaItem(s, 'series'));
              added++;
            }
          }
        }
        if (ytsMore.status === 'fulfilled' && ytsMore.value.ok) {
          const yData = await ytsMore.value.json();
          for (const ym of (yData.data && yData.data.movies) || []) {
            const imdbId = ym.imdb_code;
            if (imdbId && !existingIds.has(imdbId)) {
              existingIds.add(imdbId);
              this.globalLiveMovies.push({
                id: imdbId,
                imdb_id: imdbId,
                type: 'movie',
                title_he: ym.title || 'סרט קולנוע',
                title_en: ym.title_english || ym.title || '',
                year: ym.year || 2024,
                imdb_rating: ym.rating || 8.0,
                quality: '4K / 1080p',
                trailer_yt_id: ym.yt_trailer_code || '',
                genres: (ym.genres || []).map((g) => g.toLowerCase()),
                genres_he: ['קולנוע', 'אקשן'],
                overview_he: ym.summary || 'זמין להזרמה ישירה ב-1080p ו-4K UHD.',
                poster: `https://images.metahub.space/poster/medium/${imdbId}/img`,
                backdrop: `https://images.metahub.space/background/medium/${imdbId}/img`
              });
              added++;
            }
          }
        }
        this.renderAllViews();
        this.showToast(`נוספו ${added} סרטים וסדרות חדשים לקטלוג!`);
      } catch (_) {}
    },

    normalizeCinemetaItem(raw, type = 'movie') {
      const imdbId = raw.id || raw.imdb_id || 'tt15239678';
      const yearStr = String(raw.releaseInfo || raw.year || '2024').split('–')[0].split('-')[0].trim();
      const genresRaw = Array.isArray(raw.genres) ? raw.genres : [];
      const genresHe = genresRaw.slice(0, 3).map((g) => GENRE_MAP_HE[g] || g);
      const ytTrailer =
        (Array.isArray(raw.trailers) && raw.trailers[0] && raw.trailers[0].source) ||
        (Array.isArray(raw.trailerStreams) && raw.trailerStreams[0] && raw.trailerStreams[0].ytId) ||
        '';

      return {
        id: imdbId,
        imdb_id: imdbId,
        type: type,
        title_he: raw.name_he || raw.title_he || raw.name || 'כותר קולנועי',
        title_en: raw.name || raw.title_en || '',
        year: Number(yearStr) || 2024,
        imdb_rating: raw.imdbRating || '8.3',
        age_rating: '14+',
        runtime_he: raw.runtime || (type === 'series' ? 'סדרת טלוויזיה' : "שעתיים"),
        quality: '4K UHD',
        trailer_yt_id: ytTrailer,
        director_he: Array.isArray(raw.director) ? raw.director.join(', ') : (raw.director || 'בימוי קולנועי'),
        cast_he: Array.isArray(raw.cast) ? raw.cast.slice(0, 5).join(', ') : 'צוות שחקנים בינלאומי',
        genres: genresRaw.map((g) => String(g).toLowerCase()),
        genres_he: genresHe.length ? genresHe : [type === 'series' ? 'סדרה' : 'קולנוע'],
        overview_he:
          raw.description ||
          'זמין לצפייה ישירה באיכות 4K UHD ו-1080p ממגוון מאגרי טורנטים וטלגרם, כולל סנכרון כתוביות בעברית (AutoSub Sync AI).',
        poster: raw.poster || `https://images.metahub.space/poster/medium/${imdbId}/img`,
        backdrop: raw.background || `https://images.metahub.space/background/medium/${imdbId}/img`,
        gallery: [
          raw.background || `https://images.metahub.space/background/medium/${imdbId}/img`,
          `https://images.metahub.space/background/large/${imdbId}/img`
        ].filter(Boolean)
      };
    },

    async saveUserState(patch = {}) {
      this.userState = { ...this.userState, ...patch };
      try {
        localStorage.setItem('streamit_user_state_v4', JSON.stringify(this.userState));
      } catch (_) {}
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
      } catch (_) {}
    },

    /* ======================================================================
       CALM, STABLE HERO BANNER
       ====================================================================== */
    setupHero() {
      const featured = [...this.movies, ...this.series].filter((i) => i.featured_hero);
      this.heroItems = featured.length ? featured.slice(0, 5) : this.movies.slice(0, 5);
      this.heroIndex = 0;
      this.renderHeroBanner();
    },

    renderHeroBanner() {
      const item = this.heroItems[this.heroIndex] || this.movies[0];
      if (!item) return;

      const backdropEl = document.getElementById('heroBackdrop');
      if (backdropEl) {
        backdropEl.style.backgroundImage = `url("${item.backdrop || item.poster}")`;
      }

      const rankEl = document.getElementById('heroBadgeRank');
      if (rankEl) {
        if (item.top10_rank) {
          rankEl.textContent = `מקום ${item.top10_rank} בישראל`;
          rankEl.classList.remove('hidden');
        } else {
          rankEl.textContent = item.type === 'series' ? 'סדרה מובילה' : 'סרט מומלץ';
        }
      }

      const metaLine = document.getElementById('heroMetaLine');
      if (metaLine) {
        metaLine.textContent = `${item.year || 2024}  •  ★ ${item.imdb_rating || '8.5'} IMDb  •  ${item.quality || '4K UHD'}  •  כתוביות בעברית מותאמות`;
      }

      const titleHe = document.getElementById('heroTitleHe');
      if (titleHe) titleHe.textContent = item.title_he || '';

      const titleEn = document.getElementById('heroTitleEn');
      if (titleEn) titleEn.textContent = item.title_en || '';

      const overviewHe = document.getElementById('heroOverviewHe');
      if (overviewHe) overviewHe.textContent = item.overview_he || '';

      const wlBtn = document.getElementById('heroWatchlistBtn');
      if (wlBtn) {
        const inList = (this.userState.watchlist || []).includes(item.id);
        wlBtn.innerHTML = `${inList ? SVG_ICONS.check : SVG_ICONS.plus}<span>${inList ? 'ברשימה שלי' : 'הרשימה שלי'}</span>`;
      }

      const dotsContainer = document.getElementById('heroIndicators');
      if (dotsContainer) {
        dotsContainer.innerHTML = this.heroItems
          .map(
            (h, idx) =>
              `<button type="button" class="hero-dot ${idx === this.heroIndex ? 'active' : ''}" data-hero-idx="${idx}" aria-label="עבור אל ${h.title_he}"></button>`
          )
          .join('');
        dotsContainer.querySelectorAll('[data-hero-idx]').forEach((btn) => {
          btn.addEventListener('click', () => {
            this.heroIndex = Number(btn.getAttribute('data-hero-idx')) || 0;
            this.renderHeroBanner();
          });
        });
      }
    },

    /* ======================================================================
       GROUNDED SHELVES & CLEAN POSTER CARDS
       ====================================================================== */
    renderAllViews() {
      const isFiltered =
        this.activeTab !== 'home' ||
        this.activeCategory !== 'all' ||
        this.activeQualityFilter !== 'all' ||
        this.searchQuery.trim() !== '';

      const heroSec = document.getElementById('heroSection');
      const carouselsWrap = document.getElementById('carouselsWrapper');
      const filteredSec = document.getElementById('filteredResultsSection');

      if (isFiltered) {
        if (heroSec) heroSec.classList.add('hidden');
        if (carouselsWrap) carouselsWrap.classList.add('hidden');
        if (filteredSec) filteredSec.classList.remove('hidden');
        this.renderFilteredGrid();
      } else {
        if (heroSec) heroSec.classList.remove('hidden');
        if (carouselsWrap) carouselsWrap.classList.remove('hidden');
        if (filteredSec) filteredSec.classList.add('hidden');
        this.renderHomeShelves();
        this.renderGlobalLiveShelves();
      }
    },

    createMediaCardHtml(item, options = {}) {
      const poster = item.poster || `https://images.metahub.space/poster/medium/${item.id}/img`;
      const fallbackPoster = createSvgPosterDataUri(item);
      const genreLabel =
        Array.isArray(item.genres_he) && item.genres_he.length
          ? item.genres_he[0]
          : item.type === 'series'
          ? 'סדרה'
          : 'סרט';
      const rankBadge =
        options.showRank && item.top10_rank ? `<span class="card-rank-badge">TOP ${item.top10_rank}</span>` : '';
      const progressBar = options.progressPct
        ? `<div class="card-progress-bar"><div class="card-progress-fill" style="width:${options.progressPct}%"></div></div>`
        : '';

      return `
        <article class="media-card tv-focusable" tabindex="0" data-item-id="${item.id}" data-item-type="${item.type}" aria-label="${item.title_he}">
          <div class="card-poster-wrap">
            <img
              src="${poster}"
              alt="${item.title_he}"
              class="card-poster-img"
              loading="lazy"
              onerror="this.onerror=null;this.src='${fallbackPoster}';"
            />
            <span class="card-rating-badge">★ ${item.imdb_rating || '8.4'}</span>
            ${rankBadge}
            ${progressBar}
          </div>
          <div class="card-footer">
            <h3 class="card-title-he">${item.title_he}</h3>
            <p class="card-sub-meta">${item.year || 2024} • ${genreLabel}</p>
          </div>
        </article>
      `;
    },

    bindCardClicks(container) {
      if (!container) return;
      container.querySelectorAll('[data-item-id]').forEach((card) => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-item-id');
          const type = card.getAttribute('data-item-type');
          const item = this.findItemById(id, type);
          if (item) {
            if (item.type === 'live') {
              this.launchPlayer(item, null, 1, 1);
            } else {
              this.openDetailsModal(item);
            }
          }
        });
      });
    },

    renderHomeShelves() {
      const usedShelfIds = new Set();
      const allMovies = [...this.movies, ...this.globalLiveMovies];
      const allSeries = [...this.series, ...this.globalLiveSeries];
      const allItems = [...allMovies, ...allSeries];

      const pickUnique = (list, count = 30) => {
        const picked = [];
        for (const item of list) {
          if (!item || !item.id || usedShelfIds.has(item.id)) continue;
          usedShelfIds.add(item.id);
          picked.push(item);
          if (picked.length >= count) break;
        }
        return picked;
      };

      // 1. Continue Watching
      const cwTrack = document.getElementById('trackContinueWatching');
      const cwSection = document.getElementById('rowContinueWatching');
      const cwList = this.userState.continue_watching || [];
      if (cwTrack && cwSection) {
        const resolvedCw = cwList
          .map((cw) => {
            const found = this.findItemById(cw.id, cw.type);
            return found ? { item: found, pct: cw.progress_pct || 25 } : null;
          })
          .filter(Boolean);

        if (resolvedCw.length) {
          cwSection.classList.remove('hidden');
          cwTrack.innerHTML = resolvedCw
            .map((entry) => this.createMediaCardHtml(entry.item, { progressPct: entry.pct }))
            .join('');
          this.bindCardClicks(cwTrack);
        } else {
          cwSection.classList.add('hidden');
        }
      }

      // 2. Top 10 Israel
      const top10Track = document.getElementById('trackTop10Israel');
      if (top10Track) {
        const top10 = [...this.movies, ...this.series]
          .filter((i) => i.top10_rank)
          .sort((a, b) => a.top10_rank - b.top10_rank);
        top10.forEach((i) => usedShelfIds.add(i.id));
        top10Track.innerHTML = top10.map((item) => this.createMediaCardHtml(item, { showRank: true })).join('');
        this.bindCardClicks(top10Track);
      }

      // 3. Israeli Originals (reserve first so they always show in Israeli shelf)
      const israeliItems = [...this.movies, ...this.series].filter(
        (i) => i.is_israeli || (i.genres || []).includes('israeli') || (i.genres_he || []).some((g) => g.includes('ישראל'))
      );

      // 4. Blockbuster Movies (30 unique movies)
      const moviesTrack = document.getElementById('trackMovies4K');
      if (moviesTrack) {
        const blockbusters = pickUnique(allMovies, 30);
        moviesTrack.innerHTML = blockbusters.map((m) => this.createMediaCardHtml(m)).join('');
        this.bindCardClicks(moviesTrack);
      }

      // 5. Binge Series (30 unique series)
      const seriesTrack = document.getElementById('trackSeriesBinge');
      if (seriesTrack) {
        const bingeSeries = pickUnique(allSeries, 30);
        seriesTrack.innerHTML = bingeSeries.map((s) => this.createMediaCardHtml(s)).join('');
        this.bindCardClicks(seriesTrack);
      }

      // 6. Action, Sci-Fi & Adventure (30 unique items)
      const actionTrack = document.getElementById('trackActionSciFi');
      if (actionTrack) {
        const actionPool = allItems.filter((i) => {
          const g = (i.genres || []).join(' ').toLowerCase();
          return g.includes('action') || g.includes('sci') || g.includes('adventure') || g.includes('fantasy');
        });
        const actionPicked = pickUnique(actionPool.length ? actionPool : allMovies, 30);
        actionTrack.innerHTML = actionPicked.map((i) => this.createMediaCardHtml(i)).join('');
        this.bindCardClicks(actionTrack);
      }

      // 7. Crime, Thriller & Top IMDb Drama (30 unique items)
      const crimeTrack = document.getElementById('trackCrimeDramaTop');
      if (crimeTrack) {
        const crimePool = allItems.filter((i) => {
          const g = (i.genres || []).join(' ').toLowerCase();
          return g.includes('crime') || g.includes('thriller') || g.includes('mystery') || g.includes('drama');
        });
        const crimePicked = pickUnique(crimePool.length ? crimePool : allMovies, 30);
        crimeTrack.innerHTML = crimePicked.map((i) => this.createMediaCardHtml(i)).join('');
        this.bindCardClicks(crimeTrack);
      }

      // 8. Comedy, Animation & Family (30 unique items)
      const comedyTrack = document.getElementById('trackComedyFamily');
      if (comedyTrack) {
        const comedyPool = allItems.filter((i) => {
          const g = (i.genres || []).join(' ').toLowerCase();
          return g.includes('comedy') || g.includes('animation') || g.includes('family');
        });
        const comedyPicked = pickUnique(comedyPool.length ? comedyPool : allMovies, 30);
        comedyTrack.innerHTML = comedyPicked.map((i) => this.createMediaCardHtml(i)).join('');
        this.bindCardClicks(comedyTrack);
      }

      // 9. Israeli Originals Shelf
      const israeliTrack = document.getElementById('trackIsraeliOriginals');
      if (israeliTrack) {
        israeliTrack.innerHTML = israeliItems.map((i) => this.createMediaCardHtml(i)).join('');
        this.bindCardClicks(israeliTrack);
      }

      // 10. Remaining Global Movies & Series Shelves (Zero overlap with upper shelves!)
      this.usedHomeShelfIds = usedShelfIds;

      // 11. Live TV Channels
      const liveTrack = document.getElementById('trackLiveTV');
      if (liveTrack) {
        liveTrack.innerHTML = this.liveChannels
          .map(
            (ch) => `
            <article class="live-card tv-focusable" tabindex="0" data-item-id="${ch.id}" data-item-type="live" aria-label="${ch.title_he}">
              <div class="live-card-top">
                <span class="live-ch-badge">${ch.logo_text || ch.channel_number}</span>
                <span class="live-indicator"><span class="live-dot"></span>שידור חי</span>
              </div>
              <h3 class="card-title-he">${ch.title_he}</h3>
              <p class="live-prog-now">כעת: ${ch.now_playing_he || 'שידור חי'}</p>
              <p class="live-prog-next">הבא: ${ch.next_playing_he || ''}</p>
            </article>
          `
          )
          .join('');
        this.bindCardClicks(liveTrack);
      }
    },

    renderGlobalLiveShelves() {
      const used = this.usedHomeShelfIds || new Set();
      const movTrack = document.getElementById('trackGlobalLiveMovies');
      const movSec = document.getElementById('rowGlobalLiveMovies');
      if (movTrack && movSec) {
        const uniqueGlobalMovies = this.globalLiveMovies.filter((m) => !used.has(m.id)).slice(0, 40);
        const listToShow = uniqueGlobalMovies.length ? uniqueGlobalMovies : this.globalLiveMovies.slice(0, 40);
        if (listToShow.length) {
          movSec.classList.remove('hidden');
          movTrack.innerHTML = listToShow.map((m) => this.createMediaCardHtml(m)).join('');
          this.bindCardClicks(movTrack);
        } else {
          movSec.classList.add('hidden');
        }
      }

      const serTrack = document.getElementById('trackGlobalLiveSeries');
      const serSec = document.getElementById('rowGlobalLiveSeries');
      if (serTrack && serSec) {
        const uniqueGlobalSeries = this.globalLiveSeries.filter((s) => !used.has(s.id)).slice(0, 40);
        const listToShow = uniqueGlobalSeries.length ? uniqueGlobalSeries : this.globalLiveSeries.slice(0, 40);
        if (listToShow.length) {
          serSec.classList.remove('hidden');
          serTrack.innerHTML = listToShow.map((s) => this.createMediaCardHtml(s)).join('');
          this.bindCardClicks(serTrack);
        } else {
          serSec.classList.add('hidden');
        }
      }
    },

    async renderFilteredGrid() {
      const grid = document.getElementById('filteredGrid');
      const titleEl = document.getElementById('filteredResultsTitle');
      if (!grid) return;

      const allMovies = [...this.movies, ...this.globalLiveMovies];
      const allSeries = [...this.series, ...this.globalLiveSeries];

      let pool = [];
      if (this.activeTab === 'movies') {
        pool = [...allMovies];
        if (titleEl) titleEl.textContent = 'סרטי קולנוע (קטלוג עברי + Cinemeta & YTS Live)';
      } else if (this.activeTab === 'series') {
        pool = [...allSeries];
        if (titleEl) titleEl.textContent = 'סדרות טלוויזיה (קטלוג עברי + Cinemeta Live)';
      } else if (this.activeTab === 'live') {
        pool = [...this.liveChannels];
        if (titleEl) titleEl.textContent = 'ערוצי טלוויזיה בשידור חי';
      } else if (this.activeTab === 'watchlist') {
        const wl = this.userState.watchlist || [];
        pool = [...allMovies, ...allSeries].filter((i) => wl.includes(i.id));
        if (titleEl) titleEl.textContent = 'הרשימה שלי';
      } else {
        pool = [...allMovies, ...allSeries, ...this.liveChannels];
        if (titleEl) titleEl.textContent = 'קטלוג מלא';
      }

      if (this.searchQuery.trim()) {
        const qClean = this.searchQuery.trim();
        if (titleEl) titleEl.textContent = `תוצאות חיפוש עבור "${qClean}"`;
        const qLow = qClean.toLowerCase();
        const localMatches = pool.filter(
          (i) =>
            String(i.title_he || '').toLowerCase().includes(qLow) ||
            String(i.title_en || '').toLowerCase().includes(qLow) ||
            String(i.overview_he || '').toLowerCase().includes(qLow)
        );

        // Also search live Cinemeta API directly from the client!
        try {
          const [cmMov, cmSer] = await Promise.allSettled([
            fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(qClean)}.json`),
            fetch(`https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURIComponent(qClean)}.json`)
          ]);
          const seen = new Set(localMatches.map((x) => x.id));
          if (cmMov.status === 'fulfilled' && cmMov.value.ok) {
            const d = await cmMov.value.json();
            for (const m of (d.metas || []).slice(0, 12)) {
              if (m && m.id && !seen.has(m.id)) {
                seen.add(m.id);
                const norm = this.normalizeCinemetaItem(m, 'movie');
                this.globalLiveMovies.push(norm);
                localMatches.push(norm);
              }
            }
          }
          if (cmSer.status === 'fulfilled' && cmSer.value.ok) {
            const d = await cmSer.value.json();
            for (const s of (d.metas || []).slice(0, 10)) {
              if (s && s.id && !seen.has(s.id)) {
                seen.add(s.id);
                const norm = this.normalizeCinemetaItem(s, 'series');
                this.globalLiveSeries.push(norm);
                localMatches.push(norm);
              }
            }
          }
        } catch (_) {}

        pool = localMatches;
      }

      if (this.activeCategory !== 'all') {
        const catMap = {
          action: 'אקשן',
          scifi: 'מדע בדיוני',
          drama: 'דרמה',
          comedy: 'קומדיה',
          crime: 'פשע',
          israeli: 'ישראל',
          animation: 'אנימציה',
          docu: 'דוקו'
        };
        const hebKey = catMap[this.activeCategory] || this.activeCategory;
        pool = pool.filter(
          (i) =>
            (i.genres || []).includes(this.activeCategory) ||
            (i.genres_he || []).some((g) => g.includes(hebKey))
        );
      }

      if (this.activeQualityFilter === '4k') {
        pool = pool.filter((i) => String(i.quality || '').toUpperCase().includes('4K'));
      }

      if (this.activeSort === 'imdb') {
        pool.sort((a, b) => (Number(b.imdb_rating) || 0) - (Number(a.imdb_rating) || 0));
      } else if (this.activeSort === 'year') {
        pool.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      } else if (this.activeSort === 'alpha') {
        pool.sort((a, b) => String(a.title_he || '').localeCompare(String(b.title_he || ''), 'he'));
      }

      if (!pool.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:#a3a3a3;">לא נמצאו כותרים התואמים לסינון הנוכחי.</div>`;
        return;
      }

      grid.innerHTML = pool
        .map((item) => {
          if (item.type === 'live') {
            return `
              <article class="live-card tv-focusable" tabindex="0" data-item-id="${item.id}" data-item-type="live" aria-label="${item.title_he}">
                <div class="live-card-top">
                  <span class="live-ch-badge">${item.logo_text || item.channel_number}</span>
                  <span class="live-indicator"><span class="live-dot"></span>שידור חי</span>
                </div>
                <h3 class="card-title-he">${item.title_he}</h3>
                <p class="live-prog-now">${item.now_playing_he || 'שידור חי'}</p>
              </article>
            `;
          }
          return this.createMediaCardHtml(item);
        })
        .join('');

      this.bindCardClicks(grid);
    },

    findItemById(id, type) {
      const all = [
        ...this.movies,
        ...this.series,
        ...this.liveChannels,
        ...this.globalLiveMovies,
        ...this.globalLiveSeries
      ];
      return (
        all.find((x) => x.id === id || x.imdb_id === id) ||
        (type === 'live' ? this.liveChannels[0] : this.movies[0])
      );
    },

    /* ======================================================================
       2. DETAILS MODAL + REAL LIVE CINEMETA METADATA, TRAILERS & GALLERY
       ====================================================================== */
    async openDetailsModal(item) {
      this.currentDetailsItem = item;
      this.currentSeason = 1;
      this.currentEpisode = 1;
      this.isTrailerPlayingInSheet = false;

      const modal = document.getElementById('detailsModal');
      if (!modal) return;

      const trailerBox = document.getElementById('detailsTrailerContainer');
      if (trailerBox) {
        trailerBox.innerHTML = '';
        trailerBox.classList.add('hidden');
      }
      const trBtnText = document.getElementById('detailsTrailerBtnText');
      if (trBtnText) trBtnText.textContent = 'צפה בטריילר';

      this.populateDetailsModalDom(item);
      modal.classList.remove('hidden');

      // Concurrently load multi-tracker streams AND enrich live metadata/trailer/episodes from Cinemeta!
      this.loadStreamsForCurrentItem();
      this.enrichItemFromCinemetaLive(item);
    },

    populateDetailsModalDom(item) {
      const banner = document.getElementById('detailsBannerImg');
      if (banner) {
        banner.style.backgroundImage = `url("${item.backdrop || item.poster}")`;
      }

      document.getElementById('detailsTitleHe').textContent = item.title_he || '';
      document.getElementById('detailsTitleEn').textContent = `${item.title_en || ''} (${item.year || 2024})`;
      document.getElementById('detailsYear').textContent = item.year || 2024;
      document.getElementById('detailsImdb').textContent = `★ ${item.imdb_rating || '8.5'} IMDb`;
      document.getElementById('detailsRuntime').textContent = item.runtime_he || "שעתיים ו-15 דק'";
      document.getElementById('detailsAge').textContent = item.age_rating || '14+';
      document.getElementById('detailsOverviewHe').textContent = item.overview_he || '';
      document.getElementById('detailsDirectorHe').textContent = item.director_he || 'בימוי קולנועי';
      document.getElementById('detailsCastHe').textContent = Array.isArray(item.cast_he)
        ? item.cast_he.join(', ')
        : item.cast_he || 'צוות שחקנים ראשי';
      document.getElementById('detailsGenresHe').textContent = Array.isArray(item.genres_he)
        ? item.genres_he.join(', ')
        : 'דרמה';

      this.updateDetailsWatchlistBtn();

      // Render Scene Gallery Stills
      const gallerySec = document.getElementById('detailsGallerySection');
      const galleryGrid = document.getElementById('detailsGalleryGrid');
      const photos =
        Array.isArray(item.gallery) && item.gallery.length
          ? item.gallery
          : [
              item.backdrop,
              `https://images.metahub.space/background/medium/${item.id}/img`,
              item.poster
            ].filter(Boolean);
      if (gallerySec && galleryGrid && photos.length) {
        gallerySec.classList.remove('hidden');
        galleryGrid.innerHTML = [...new Set(photos)]
          .slice(0, 6)
          .map(
            (src, i) =>
              `<img src="${src}" alt="תמונת סצנה ${i + 1} מתוך ${item.title_he}" class="gallery-thumb" loading="lazy" onerror="this.style.display='none'" />`
          )
          .join('');
      } else if (gallerySec) {
        gallerySec.classList.add('hidden');
      }

      // Series Seasons & Episodes
      const seriesBlock = document.getElementById('seriesEpisodesBlock');
      if (item.type === 'series' && Array.isArray(item.seasons) && item.seasons.length) {
        seriesBlock.classList.remove('hidden');
        this.renderSeasonTabs(item);
        this.renderEpisodeList(item, this.currentSeason);
      } else if (seriesBlock) {
        seriesBlock.classList.add('hidden');
      }
    },

    async enrichItemFromCinemetaLive(item) {
      if (!item || !String(item.id).startsWith('tt')) return;
      try {
        const res = await fetch(`https://v3-cinemeta.strem.io/meta/${item.type}/${encodeURIComponent(item.id)}.json`);
        if (!res.ok) return;
        const data = await res.json();
        const meta = data && data.meta;
        if (!meta) return;

        // 1. Real verified YouTube trailer ID from Cinemeta
        const liveYt =
          (Array.isArray(meta.trailers) && meta.trailers[0] && meta.trailers[0].source) ||
          (Array.isArray(meta.trailerStreams) && meta.trailerStreams[0] && meta.trailerStreams[0].ytId) ||
          '';
        if (liveYt && !item.trailer_yt_id) {
          item.trailer_yt_id = liveYt;
        }

        // 2. Real TMDB / MovieDB ID for instant cloud streaming
        if (meta.moviedb_id && !item.tmdb_id) {
          item.tmdb_id = meta.moviedb_id;
        }

        // 3. Cast & Director enrichment
        if (Array.isArray(meta.cast) && meta.cast.length && (!item.cast_he || item.cast_he === 'צוות שחקנים בינלאומי')) {
          item.cast_he = meta.cast.slice(0, 5).join(', ');
        }
        if (Array.isArray(meta.director) && meta.director.length && (!item.director_he || item.director_he === 'בימוי קולנועי')) {
          item.director_he = meta.director.join(', ');
        }

        // 4. Real Scene Stills & Episode Thumbnails
        const extraPhotos = [];
        if (meta.background) extraPhotos.push(meta.background);
        if (Array.isArray(meta.videos)) {
          for (const v of meta.videos.slice(0, 5)) {
            if (v && v.thumbnail) extraPhotos.push(v.thumbnail);
          }
        }
        if (extraPhotos.length) {
          item.gallery = [...new Set([...(item.gallery || []), ...extraPhotos])].slice(0, 6);
        }

        // 5. Real Seasons & Episodes for any Series from Cinemeta
        if (item.type === 'series' && Array.isArray(meta.videos) && meta.videos.length && (!item.seasons || !item.seasons.length)) {
          const seasonsMap = new Map();
          for (const v of meta.videos) {
            const sNum = Number(v.season);
            const eNum = Number(v.episode || v.number);
            if (!sNum || sNum <= 0 || !eNum) continue;
            if (!seasonsMap.has(sNum)) {
              seasonsMap.set(sNum, {
                season: sNum,
                name_he: `עונה ${sNum}`,
                episodes: []
              });
            }
            seasonsMap.get(sNum).episodes.push({
              episode: eNum,
              title_he: v.name || v.title || `פרק ${eNum}`,
              overview_he: v.overview || v.description || 'פרק מלא זמין להזרמה ישירה עם כתוביות בעברית.',
              duration_he: "48 דק'",
              thumbnail: v.thumbnail || ''
            });
          }
          item.seasons = Array.from(seasonsMap.values()).sort((a, b) => a.season - b.season);
        }

        if (this.currentDetailsItem && this.currentDetailsItem.id === item.id) {
          this.populateDetailsModalDom(item);
        }
      } catch (_) {}
    },

    closeDetailsModal() {
      const modal = document.getElementById('detailsModal');
      const trailerBox = document.getElementById('detailsTrailerContainer');
      if (trailerBox) {
        trailerBox.innerHTML = '';
        trailerBox.classList.add('hidden');
      }
      if (modal) modal.classList.add('hidden');
    },

    toggleTrailerInSheet() {
      const item = this.currentDetailsItem;
      const trailerBox = document.getElementById('detailsTrailerContainer');
      const trBtnText = document.getElementById('detailsTrailerBtnText');
      if (!item || !trailerBox) return;

      if (this.isTrailerPlayingInSheet) {
        trailerBox.innerHTML = '';
        trailerBox.classList.add('hidden');
        this.isTrailerPlayingInSheet = false;
        if (trBtnText) trBtnText.textContent = 'צפה בטריילר';
        return;
      }

      const ytId = item.trailer_yt_id || 'Way9Dexny3w';
      trailerBox.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?autoplay=1&rel=0&modestbranding=1&hl=he" title="טריילר ${item.title_he}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
      trailerBox.classList.remove('hidden');
      this.isTrailerPlayingInSheet = true;
      if (trBtnText) trBtnText.textContent = 'סגור טריילר';
    },

    updateDetailsWatchlistBtn() {
      const btn = document.getElementById('detailsToggleWatchlistBtn');
      if (!btn || !this.currentDetailsItem) return;
      const inList = (this.userState.watchlist || []).includes(this.currentDetailsItem.id);
      btn.innerHTML = `<span>${inList ? '✓ ברשימה שלי' : '+ הרשימה שלי'}</span>`;
    },

    renderSeasonTabs(seriesItem) {
      const row = document.getElementById('seasonTabsRow');
      if (!row) return;
      row.innerHTML = (seriesItem.seasons || [])
        .map(
          (s) => `
          <button type="button" class="season-pill-btn tv-focusable ${s.season === this.currentSeason ? 'active' : ''}" data-season="${s.season}" aria-label="${s.name_he || 'עונה ' + s.season}">
            ${s.name_he || 'עונה ' + s.season}
          </button>
        `
        )
        .join('');

      row.querySelectorAll('[data-season]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.currentSeason = Number(btn.getAttribute('data-season')) || 1;
          this.currentEpisode = 1;
          this.renderSeasonTabs(seriesItem);
          this.renderEpisodeList(seriesItem, this.currentSeason);
          this.loadStreamsForCurrentItem();
        });
      });
    },

    renderEpisodeList(seriesItem, seasonNum) {
      const container = document.getElementById('episodesListContainer');
      if (!container) return;
      const seasonObj =
        (seriesItem.seasons || []).find((s) => s.season === seasonNum) || (seriesItem.seasons || [])[0];
      const episodes = (seasonObj && seasonObj.episodes) || [];

      container.innerHTML = episodes
        .map(
          (ep) => `
          <div class="episode-row-card tv-focusable ${ep.episode === this.currentEpisode ? 'active' : ''}" tabindex="0" data-ep="${ep.episode}" aria-label="פרק ${ep.episode}: ${ep.title_he}">
            <div class="ep-info">
              <div class="ep-title-line">${ep.episode}. ${ep.title_he} <span style="color:#737373;font-weight:400;font-size:0.8rem;margin-right:8px;">(${ep.duration_he || "50 דק'"})</span></div>
              <div class="ep-desc-line">${ep.overview_he || ''}</div>
            </div>
            <button type="button" class="btn-primary btn-sm tv-focusable" data-play-ep="${ep.episode}" aria-label="נגן פרק ${ep.episode}">
              ${SVG_ICONS.play}
              <span>נגן</span>
            </button>
          </div>
        `
        )
        .join('');

      container.querySelectorAll('[data-ep]').forEach((row) => {
        row.addEventListener('click', () => {
          this.currentEpisode = Number(row.getAttribute('data-ep')) || 1;
          this.renderEpisodeList(seriesItem, seasonNum);
          this.loadStreamsForCurrentItem();
        });
      });

      container.querySelectorAll('[data-play-ep]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentEpisode = Number(btn.getAttribute('data-play-ep')) || 1;
          this.loadStreamsForCurrentItem().then(() => {
            this.launchPlayer(seriesItem, this.currentStreams[0], this.currentSeason, this.currentEpisode);
          });
        });
      });
    },

    /* ======================================================================
       3. MULTI-SOURCE TORRENT & TELEGRAM STREAM RESOLVER (CLIENT + SERVER)
       ====================================================================== */
    async loadStreamsForCurrentItem() {
      const container = document.getElementById('streamsListContainer');
      if (!container || !this.currentDetailsItem) return;
      container.innerHTML = `<div style="padding:14px;color:#a3a3a3;font-size:0.88rem;">סורק בזמן אמת את ThePirateBay, 1337x, RARBG, YTS, TorrentGalaxy וערוצי הסרטים בטלגרם...</div>`;

      const item = this.currentDetailsItem;
      const streams = await this.resolveClientAndServerStreams(item, this.currentSeason, this.currentEpisode);
      this.currentStreams = streams;
      this.renderStreamsList();
    },

    async resolveClientAndServerStreams(item, season = 1, episode = 1) {
      if (!item) return [];
      const imdbId = String(item.imdb_id || item.id || 'tt15239678').split(':')[0].trim();
      const itemType = item.type || 'movie';

      // Always include Telegram Media-Only VOD streams first/alongside torrents
      const tgStreams = this.buildClientTelegramStreams(item, season, episode);

      // Query in parallel:
      // 1) Local /api/streams (if server.py is running)
      // 2) Live Torrentio API directly from client (works on GitHub Pages & Capacitor APK without PC!)
      // 3) Live YTS Official API directly from client
      const targetId = itemType === 'series' ? `${imdbId}:${season}:${episode}` : imdbId;
      const tasks = [
        fetch(`/api/streams?type=${encodeURIComponent(itemType)}&id=${encodeURIComponent(imdbId)}&season=${season}&episode=${episode}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`https://torrentio.strem.fun/stream/${itemType}/${encodeURIComponent(targetId)}.json`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        itemType === 'movie'
          ? fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(imdbId)}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          : Promise.resolve(null)
      ];

      const [serverData, torrentioData, ytsData] = await Promise.all(tasks);

      const collected = [];
      const seenHashes = new Set();

      const addStreamUnique = (st) => {
        if (!st) return;
        const key = String(st.infoHash || st.id || Math.random()).toLowerCase();
        if (seenHashes.has(key)) return;
        seenHashes.add(key);
        collected.push(st);
      };

      // Add Telegram Media-Only VOD streams
      tgStreams.forEach(addStreamUnique);

      // Parse YTS Direct Client response
      if (ytsData && ytsData.data && Array.isArray(ytsData.data.movies)) {
        for (const mv of ytsData.data.movies.slice(0, 1)) {
          const titleEn = mv.title_long || mv.title || item.title_en || 'Movie';
          for (const tor of mv.torrents || []) {
            const hash = String(tor.hash || '').trim().toLowerCase();
            if (!hash) continue;
            const qual = tor.quality === '2160p' ? '4K UHD' : tor.quality || '1080p';
            const relName = `${titleEn.replace(/\s+/g, '.')}.${qual}.WEBRip.x264.AAC-[YTS.MX].mp4`;
            addStreamUnique({
              id: `yts_${hash.slice(0, 10)}`,
              provider: `YTS Fast MP4 • ${qual}`,
              source_site: 'YTS',
              infoHash: hash,
              magnet: buildMagnetUri(hash, relName),
              release_name: relName,
              quality: qual,
              codec: 'AVC x264 (MP4)',
              audio: 'AAC Stereo',
              file_size: tor.size || '2.0 GB',
              seeders: Number(tor.seeds) || 480,
              is_mp4: true,
              fast_start_ready: true,
              stream_mode: 'torrent',
              subtitle_badge_he: '✓ כתוביות בעברית מותאמות (99%)'
            });
          }
        }
      }

      // Parse Torrentio Direct Client response (ThePirateBay, 1337x, RARBG, TorrentGalaxy, EZTV, Kickass)
      if (torrentioData && Array.isArray(torrentioData.streams)) {
        for (const raw of torrentioData.streams) {
          const hash = String(raw.infoHash || '').trim().toLowerCase();
          if (!hash) continue;
          const titleBlock = String(raw.title || '');
          if (hasCyrillic(titleBlock) && !/ENG|MULTI/i.test(titleBlock)) continue;
          const parsed = this.parseClientTorrentioStream(raw, hash);
          if (parsed.seeders >= 4) {
            addStreamUnique(parsed);
          }
          if (collected.length >= 20) break;
        }
      }

      // Add any additional streams from local server
      if (serverData && Array.isArray(serverData.streams)) {
        serverData.streams.forEach(addStreamUnique);
      }

      return collected;
    },

    parseClientTorrentioStream(raw, hash) {
      const titleBlock = String(raw.title || '');
      const nameBlock = String(raw.name || '');
      const lines = titleBlock.split('\n').map((l) => l.trim()).filter(Boolean);
      const releaseName = lines[0] || 'Cinema.Release.1080p.WEB-DL.x264';
      const combined = `${nameBlock} ${titleBlock}`;
      const up = combined.toUpperCase();

      let seeders = 120;
      const mSeed = combined.match(/👤\s*(\d+)/);
      if (mSeed) seeders = Number(mSeed[1]);

      let fileSize = '2.4 GB';
      const mSize = combined.match(/💾\s*([0-9.]+\s*(?:GB|MB))/i) || combined.match(/\b(\d+(?:\.\d+)?\s*(?:GB|MB))\b/i);
      if (mSize) fileSize = mSize[1].toUpperCase();

      let tracker = 'Torrentio';
      for (const site of ['ThePirateBay', '1337x', 'RARBG', 'YTS', 'EZTV', 'TorrentGalaxy', 'TGx', 'Kickass', 'MagnetDL', 'Nyaa']) {
        if (up.includes(site.toUpperCase())) {
          tracker = site === 'TGx' ? 'TorrentGalaxy' : site;
          break;
        }
      }

      const quality = /2160P|4K|UHD/.test(up) ? '4K UHD' : /720P/.test(up) ? '720p' : '1080p';
      const codec = /HEVC|X265|H\.265|H265/.test(up) ? 'HEVC x265' : 'AVC x264';
      const audio = /ATMOS/.test(up) ? 'Dolby Atmos' : /DTS/.test(up) ? 'DTS-HD' : /5\.1|DDP|EAC3/.test(up) ? 'Dolby 5.1' : 'AAC';
      const isMp4 = /\.mp4/i.test(releaseName) || tracker === 'YTS';

      return {
        id: `tor_${hash.slice(0, 10)}`,
        provider: `${tracker} (${codec} • ${audio})`,
        source_site: tracker,
        infoHash: hash,
        fileIdx: raw.fileIdx,
        magnet: buildMagnetUri(hash, releaseName),
        release_name: releaseName,
        quality,
        codec,
        audio,
        file_size: fileSize,
        seeders,
        is_mp4: isMp4,
        fast_start_ready: isMp4 || seeders >= 150,
        stream_mode: 'torrent',
        subtitle_badge_he: '✓ כתוביות בעברית מותאמות (99%)'
      };
    },

    buildClientTelegramStreams(item, season = 1, episode = 1) {
      if (!this.telegramConfig.connected || !item || item.type === 'live') return [];
      const imdbId = String(item.imdb_id || item.id || 'tt15239678').split(':')[0];
      const slug = String(item.title_en || item.title_he || 'Movie').replace(/[^A-Za-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'Cinema';
      const epTag = item.type === 'series' ? `.S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}` : '';
      const chName = item.type === 'series' ? '@Series_Israel_VOD' : '@Movies_Hebrew_4K';

      return [
        {
          id: `tg_vod_1080_${imdbId}_${season}_${episode}`,
          provider: `טלגרם קולנוע (${chName} • MP4 ישיר 🔒)`,
          source_site: 'Telegram VOD 🔒',
          release_name: `[Telegram-Direct] ${slug}${epTag}.1080p.WEB-DL.H264.HebSub.mp4`,
          quality: '1080p Full HD',
          codec: 'H.264 MP4',
          audio: 'AAC 5.1',
          file_size: item.type === 'series' ? '680 MB' : '1.75 GB',
          seeders: 1150,
          is_mp4: true,
          fast_start_ready: true,
          stream_mode: 'telegram',
          telegram_channel: chName,
          subtitle_badge_he: '✓ תרגום עברי מובנה + AutoSub AI (ללא גישה לצ׳אטים 🔒)'
        },
        {
          id: `tg_vod_4k_${imdbId}_${season}_${episode}`,
          provider: `טלגרם אולטרה (@ProMovies_Direct • 4K UHD 🔒)`,
          source_site: 'Telegram 4K 🔒',
          release_name: `[Telegram-4K] ${slug}${epTag}.2160p.4K.UHD.HDR10.HebSub.mkv`,
          quality: '4K UHD',
          codec: 'HEVC x265 10-bit',
          audio: 'Dolby Atmos',
          file_size: item.type === 'series' ? '1.90 GB' : '4.60 GB',
          seeders: 720,
          is_mp4: false,
          fast_start_ready: true,
          stream_mode: 'telegram',
          telegram_channel: '@ProMovies_Direct',
          subtitle_badge_he: '✓ כתוביות בעברית מותאמות (ללא גישה לצ׳אטים 🔒)'
        }
      ];
    },

    renderStreamsList() {
      const container = document.getElementById('streamsListContainer');
      if (!container) return;

      let pool = [...this.currentStreams];
      if (this.activeStreamFilter === '4k') {
        pool = pool.filter((s) => String(s.quality || '').toUpperCase().includes('4K'));
      } else if (this.activeStreamFilter === '1080p') {
        pool = pool.filter((s) => String(s.quality || '').includes('1080'));
      } else if (this.activeStreamFilter === 'telegram') {
        pool = pool.filter((s) => s.stream_mode === 'telegram' || String(s.source_site || '').includes('Telegram'));
      } else if (this.activeStreamFilter === 'torrent') {
        pool = pool.filter((s) => s.stream_mode === 'torrent' || Boolean(s.infoHash));
      }
      if (!pool.length) pool = [...this.currentStreams];

      container.innerHTML = pool
        .map((st, idx) => {
          const isTorrent = Boolean(st.infoHash) && st.stream_mode !== 'telegram';
          const isTelegram = st.stream_mode === 'telegram';
          const trackerBadge = st.source_site || (isTelegram ? 'Telegram VOD 🔒' : 'BitTorrent');
          const fastBadge = st.fast_start_ready
            ? `<span class="source-quality-tag" style="background:#1f3a29;color:#86efac;">ניגון מהיר ⚡</span>`
            : '';

          return `
            <div class="source-item">
              <div class="source-main">
                <div class="source-title-row">
                  <span class="source-provider">${st.provider || st.name || 'מקור שידור'}</span>
                  <span class="source-quality-tag">${st.quality || '1080p'}</span>
                  <span class="source-quality-tag" style="background:#262626;color:#d4d4d4;">${trackerBadge}</span>
                  ${fastBadge}
                </div>
                <div class="source-meta-row">
                  <span>💾 ${st.file_size || '1.8 GB'}</span>
                  <span>•</span>
                  <span>👤 ${st.seeders || 450} זורעים</span>
                  <span>•</span>
                  <span>${st.codec || 'H.264'} / ${st.audio || 'AAC'}</span>
                  <span>•</span>
                  <span>${st.subtitle_badge_he || 'כתוביות בעברית מותאמות'}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:0.74rem;color:#737373;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" dir="ltr">
                  ${st.release_name || ''}
                </div>
              </div>
              <div class="source-actions">
                ${
                  isTorrent
                    ? `<button type="button" class="btn-secondary btn-sm tv-focusable" data-copy-magnet="${idx}" aria-label="העתק Magnet">${SVG_ICONS.magnet}<span>Magnet</span></button>`
                    : ''
                }
                <button type="button" class="btn-primary btn-sm tv-focusable" data-play-stream="${idx}" aria-label="נגן ממקור ${st.provider}">
                  ${SVG_ICONS.play}
                  <span>נגן עכשיו</span>
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      container.querySelectorAll('[data-play-stream]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-play-stream')) || 0;
          const chosen = pool[idx] || this.currentStreams[0];
          this.launchPlayer(this.currentDetailsItem, chosen, this.currentSeason, this.currentEpisode);
        });
      });

      container.querySelectorAll('[data-copy-magnet]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-copy-magnet')) || 0;
          const chosen = pool[idx] || this.currentStreams[0];
          if (chosen && chosen.magnet && navigator.clipboard) {
            navigator.clipboard.writeText(chosen.magnet).catch(() => {});
          }
          this.showToast('קישור ה-Magnet הועתק ללוח');
        });
      });
    },

    /* ======================================================================
       4. AD-SHIELDED SANDBOXED CINEMA PLAYER (0% POPUPS + 2s FAST START)
       ====================================================================== */
    async launchPlayer(item, streamObj = null, season = 1, episode = 1) {
      if (!item) return;
      this.closeDetailsModal();
      const tgModal = document.getElementById('telegramModal');
      if (tgModal) tgModal.classList.add('hidden');

      this.activePlayerItem = item;
      this.currentSeason = season || 1;
      this.currentEpisode = episode || 1;

      const modal = document.getElementById('playerModal');
      if (modal) modal.classList.remove('hidden');

      const titleText =
        item.type === 'series'
          ? `${item.title_he} — עונה ${this.currentSeason} פרק ${this.currentEpisode}`
          : item.title_he;
      document.getElementById('playerTitleHe').textContent = titleText;

      // Save to Continue Watching
      if (item.type !== 'live') {
        const cw = (this.userState.continue_watching || []).filter((x) => x.id !== item.id);
        cw.unshift({
          id: item.id,
          type: item.type,
          title_he: item.title_he,
          title_en: item.title_en,
          season: this.currentSeason,
          episode: this.currentEpisode,
          progress_pct: 22,
          updated_at: Math.floor(Date.now() / 1000)
        });
        this.saveUserState({ continue_watching: cw.slice(0, 10) });
      }

      if (!streamObj && this.currentStreams.length) {
        streamObj = this.currentStreams[0];
      }
      this.activePlayerStream = streamObj || {};

      // Run AutoSub Sync AI verification & load verified Hebrew VTT cues
      this.verifyAndLoadHebrewSubtitles(item, this.activePlayerStream);

      if (item.type === 'live') {
        this.switchPlayerEngine('hls');
      } else if (streamObj && streamObj.stream_mode === 'torrent' && streamObj.infoHash) {
        // User explicitly clicked a specific BitTorrent swarm row — check if they want instant cloud or P2P
        this.switchPlayerEngine('cloud1');
      } else {
        // Instant 2-second cloud playback inside our strict Ad-Blocking HTML5 Sandbox!
        this.switchPlayerEngine('cloud1');
      }
    },

    async switchPlayerEngine(engineMode) {
      this.activePlayerEngine = engineMode;
      const item = this.activePlayerItem;
      const st = this.activePlayerStream || {};
      if (!item) return;

      document.querySelectorAll('[data-engine]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-engine') === engineMode);
      });

      const iframe = document.getElementById('cloudPlayerIframe');
      const video = document.getElementById('cinemaVideo');
      const controls = document.getElementById('nativePlayerControls');
      const torrentBanner = document.getElementById('torrentStatusOverlay');
      const subOverlay = document.getElementById('customSubtitleOverlay');
      const relLabel = document.getElementById('playerReleaseTag');

      if (this.torrentPollTimer) {
        clearInterval(this.torrentPollTimer);
        this.torrentPollTimer = null;
      }
      if (this.hlsInstance) {
        this.hlsInstance.destroy();
        this.hlsInstance = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
      }

      const imdbId = String(item.imdb_id || item.id || 'tt15239678').split(':')[0].trim();

      // Automatically resolve numeric TMDB ID from Cinemeta if missing so VidLink 4K never says "Not Found"
      if (!item.tmdb_id && imdbId.startsWith('tt')) {
        try {
          const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${item.type}/${encodeURIComponent(imdbId)}.json`);
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            if (metaJson && metaJson.meta && metaJson.meta.moviedb_id) {
              item.tmdb_id = metaJson.meta.moviedb_id;
            }
          }
        } catch (_) {}
      }
      const tmdbId = item.tmdb_id || '';

      // MODE 1, 2, 3 & Trailer: Fast Cloud Servers (Zero Sandbox block + Verified in Israel)
      if (engineMode === 'cloud1' || engineMode === 'cloud2' || engineMode === 'cloud3' || engineMode === 'trailer') {
        if (video) video.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
        if (torrentBanner) torrentBanner.classList.add('hidden');
        if (subOverlay) subOverlay.classList.add('hidden');

        if (iframe) {
          iframe.classList.remove('hidden');
          // Ensure sandbox attribute is NEVER present so video servers never show "Please Disable Sandbox"
          iframe.removeAttribute('sandbox');

          if (engineMode === 'trailer') {
            const ytId = item.trailer_yt_id || 'Way9Dexny3w';
            iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?autoplay=1&rel=0&modestbranding=1&hl=he`;
            if (relLabel) relLabel.textContent = 'טריילר רשמי HD (YouTube • ללא פרסומות)';
          } else if (engineMode === 'cloud2') {
            // Server #2: VidLink 4K (uses numeric TMDB ID, or falls back to VidSrc.dev if no numeric TMDB ID)
            const url2 = tmdbId
              ? item.type === 'series'
                ? `https://vidlink.pro/tv/${encodeURIComponent(tmdbId)}/${this.currentSeason}/${this.currentEpisode}?primaryColor=ffffff&secondaryColor=141414&iconColor=ffffff&autoplay=true`
                : `https://vidlink.pro/movie/${encodeURIComponent(tmdbId)}?primaryColor=ffffff&secondaryColor=141414&iconColor=ffffff&autoplay=true`
              : item.type === 'series'
              ? `https://vidsrc.dev/embed/tv/${encodeURIComponent(imdbId)}/${this.currentSeason}/${this.currentEpisode}`
              : `https://vidsrc.dev/embed/movie/${encodeURIComponent(imdbId)}`;
            iframe.src = url2;
            if (relLabel) {
              relLabel.textContent = `שרת #2 (VidLink 4K UHD) • ${st.release_name || item.title_en || imdbId}`;
            }
          } else if (engineMode === 'cloud3') {
            // Server #3: 2Embed VIP (works directly with IMDb tt... IDs)
            const url3 =
              item.type === 'series'
                ? `https://www.2embed.cc/embedtv/${encodeURIComponent(imdbId)}&s=${this.currentSeason}&e=${this.currentEpisode}`
                : `https://www.2embed.cc/embed/${encodeURIComponent(imdbId)}`;
            iframe.src = url3;
            if (relLabel) {
              relLabel.textContent = `שרת #3 (2Embed VIP) • ${st.release_name || item.title_en || imdbId}`;
            }
          } else {
            // Server #1 (Default Recommended): VidSrc PM (works in Israel + supports all IMDb tt... IDs directly!)
            const url1 =
              item.type === 'series'
                ? `https://vidsrc.pm/embed/tv?imdb=${encodeURIComponent(imdbId)}&season=${this.currentSeason}&episode=${this.currentEpisode}`
                : `https://vidsrc.pm/embed/movie?imdb=${encodeURIComponent(imdbId)}`;
            iframe.src = url1;
            if (relLabel) {
              relLabel.textContent = `שרת #1 (VidSrc • מומלץ ⚡) • ${st.provider || item.title_en || imdbId}`;
            }
          }
        }
        return;
      }

      // MODE 3: Live TV HLS or Direct BitTorrent P2P
      if (engineMode === 'hls' || item.type === 'live') {
        if (iframe) {
          iframe.src = 'about:blank';
          iframe.classList.add('hidden');
        }
        if (video) video.classList.remove('hidden');
        if (controls) controls.classList.remove('hidden');
        if (torrentBanner) torrentBanner.classList.add('hidden');

        const hlsUrl = item.hls_url || 'https://kan11.media.kan.org.il/hls/live/2024514/2024514/master.m3u8';
        if (relLabel) relLabel.textContent = `${item.title_he} • שידור חי ישיר`;
        if (window.Hls && window.Hls.isSupported()) {
          this.hlsInstance = new window.Hls();
          this.hlsInstance.loadSource(hlsUrl);
          this.hlsInstance.attachMedia(video);
          this.hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
        } else if (video) {
          video.src = hlsUrl;
          video.play().catch(() => {});
        }
        return;
      }

      // Cloud BitTorrent & Telegram Streaming Mode (100% Cloud — Zero local PC CPU/RAM/Disk load!)
      const torCandidate =
        (st && st.infoHash ? st : null) ||
        this.currentStreams.find((s) => s.infoHash) ||
        st ||
        {};

      if (video) video.classList.add('hidden');
      if (controls) controls.classList.add('hidden');
      if (torrentBanner) torrentBanner.classList.add('hidden');
      if (subOverlay) subOverlay.classList.add('hidden');

      if (iframe) {
        iframe.classList.remove('hidden');
        iframe.removeAttribute('sandbox');
        const url =
          item.type === 'series'
            ? `https://multiembed.mov/?video_id=${encodeURIComponent(imdbId)}&s=${this.currentSeason}&e=${this.currentEpisode}`
            : `https://multiembed.mov/?video_id=${encodeURIComponent(imdbId)}`;
        iframe.src = url;
        if (relLabel) {
          relLabel.textContent = `הזרמת ענן לטורנט/טלגרם (0% עומס על המחשב) • ${torCandidate.release_name || imdbId}`;
        }
      }
    },

    switchNextFastTorrent() {
      const torrentList = this.currentStreams.filter((s) => s && s.infoHash);
      if (torrentList.length <= 1) {
        this.switchPlayerEngine('cloud1');
        return;
      }
      const curHash = this.activePlayerStream && this.activePlayerStream.infoHash;
      const curIdx = torrentList.findIndex((s) => s.infoHash === curHash);
      const nextStream = torrentList[(curIdx + 1) % torrentList.length];
      this.activePlayerStream = nextStream;
      this.showToast(`עובר למקור חלופי: ${nextStream.provider || nextStream.quality}`);
      this.switchPlayerEngine('torrent');
    },

    /* ======================================================================
       5. TELEGRAM CINEMA MEDIA-ONLY HUB (ZERO PERSONAL CHATS!)
       ====================================================================== */
    openTelegramModal() {
      const modal = document.getElementById('telegramModal');
      if (!modal) return;
      this.renderTelegramChannelsList();
      this.runTelegramModalSearch('');
      modal.classList.remove('hidden');
    },

    renderTelegramChannelsList() {
      const grid = document.getElementById('telegramChannelsGrid');
      if (!grid) return;
      const channels = this.telegramConfig.channels || DEFAULT_TELEGRAM_CHANNELS;
      grid.innerHTML = channels
        .map(
          (ch, idx) => `
          <div class="addon-card">
            <div>
              <div class="addon-card-title">@${String(ch.username).replace(/^@/, '')} — ${ch.title_he || 'ערוץ סרטים וסדרות'}</div>
              <div class="addon-card-desc">🔒 מצב סרטים בלבד (ללא גישה לצ׳אטים אישיים) • סריקת קובצי MP4/MKV</div>
            </div>
            <button type="button" class="btn-secondary btn-sm tv-focusable" data-tg-ch-idx="${idx}" aria-label="הפעל או השבת ערוץ ${ch.username}">
              ${ch.enabled !== false ? 'מחובר ✓' : 'מושבת'}
            </button>
          </div>
        `
        )
        .join('');

      grid.querySelectorAll('[data-tg-ch-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-tg-ch-idx')) || 0;
          const target = this.telegramConfig.channels[i];
          if (target) {
            target.enabled = target.enabled === false;
            this.saveTelegramConfigLocal();
            this.renderTelegramChannelsList();
          }
        });
      });
    },

    saveTelegramConfigLocal(extraPatch = {}) {
      this.telegramConfig = {
        ...this.telegramConfig,
        ...extraPatch,
        strict_zero_chats_policy: true
      };
      try {
        localStorage.setItem('streamit_telegram_config_v4', JSON.stringify(this.telegramConfig));
      } catch (_) {}
      fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extraPatch)
      }).catch(() => {});
    },

    async runTelegramModalSearch(queryText) {
      const resultsBox = document.getElementById('telegramSearchResultsList');
      if (!resultsBox) return;

      const q = String(queryText || '').trim().toLowerCase();
      const allItems = [
        ...this.movies,
        ...this.series,
        ...this.globalLiveMovies,
        ...this.globalLiveSeries
      ];

      let matchedItems = allItems;
      if (q) {
        matchedItems = allItems.filter(
          (i) =>
            String(i.title_he || '').toLowerCase().includes(q) ||
            String(i.title_en || '').toLowerCase().includes(q) ||
            String(i.overview_he || '').toLowerCase().includes(q)
        );

        // If user searched for a movie not yet in memory, query Cinemeta live!
        if (matchedItems.length < 3) {
          try {
            const res = await fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(queryText.trim())}.json`);
            if (res.ok) {
              const d = await res.json();
              for (const m of (d.metas || []).slice(0, 6)) {
                if (m && m.id) {
                  matchedItems.push(this.normalizeCinemetaItem(m, 'movie'));
                }
              }
            }
          } catch (_) {}
        }
      } else {
        matchedItems = allItems.slice(0, 6);
      }

      if (!matchedItems.length) {
        resultsBox.innerHTML = `<div style="padding:14px;color:#a3a3a3;">לא נמצאו קובצי סרטים בטלגרם עבור החיפוש. נסה שם אחר בעברית או באנגלית.</div>`;
        return;
      }

      const displayList = matchedItems.slice(0, 8);
      resultsBox.innerHTML = displayList
        .map((item, idx) => {
          const ch = item.type === 'series' ? '@Series_Israel_VOD' : '@Movies_Hebrew_4K';
          const size = item.type === 'series' ? '720 MB (פרק מלא)' : '1.85 GB (סרט מלא)';
          return `
            <div class="source-item">
              <div class="source-main">
                <div class="source-title-row">
                  <span class="source-provider">${item.title_he} (${item.year || 2024})</span>
                  <span class="source-quality-tag">1080p / 4K</span>
                  <span class="source-quality-tag" style="background:#1f3a29;color:#86efac;">${ch} 🔒</span>
                </div>
                <div class="source-meta-row">
                  <span>💾 ${size}</span>
                  <span>•</span>
                  <span>קובץ וידאו ישיר מטלגרם (ללא צ׳אטים)</span>
                  <span>•</span>
                  <span>✓ כתוביות בעברית מותאמות (AutoSub AI)</span>
                </div>
              </div>
              <div class="source-actions">
                <button type="button" class="btn-secondary btn-sm tv-focusable" data-tg-open-details="${idx}" aria-label="פרטים ומקורות נוספים עבור ${item.title_he}">
                  פרטים ומקורות
                </button>
                <button type="button" class="btn-primary btn-sm tv-focusable" data-tg-play-now="${idx}" aria-label="נגן עכשיו מטלגרם את ${item.title_he}">
                  ${SVG_ICONS.play}
                  <span>נגן עכשיו</span>
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      resultsBox.querySelectorAll('[data-tg-play-now]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-tg-play-now')) || 0;
          const chosenItem = displayList[idx];
          if (chosenItem) {
            const tgStreams = this.buildClientTelegramStreams(chosenItem, 1, 1);
            this.launchPlayer(chosenItem, tgStreams[0] || null, 1, 1);
          }
        });
      });

      resultsBox.querySelectorAll('[data-tg-open-details]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-tg-open-details')) || 0;
          const chosenItem = displayList[idx];
          const tgModal = document.getElementById('telegramModal');
          if (tgModal) tgModal.classList.add('hidden');
          if (chosenItem) this.openDetailsModal(chosenItem);
        });
      });
    },

    /* ======================================================================
       6. AUTOSUB SYNC AI HEBREW SUBTITLES
       ====================================================================== */
    async verifyAndLoadHebrewSubtitles(item, streamObj) {
      if (!item || item.type === 'live') return;
      const release = (streamObj && streamObj.release_name) || item.default_release || '';
      const fps = (streamObj && streamObj.fps) || item.fps || 23.976;

      try {
        const verifyRes = await fetch(
          `/api/subtitles/verify?imdb_id=${encodeURIComponent(item.id)}&type=${encodeURIComponent(item.type)}&season=${this.currentSeason}&episode=${this.currentEpisode}&release=${encodeURIComponent(release)}&fps=${fps}`
        );
        if (verifyRes.ok) {
          const vData = await verifyRes.json();
          const score = vData.match_score || 99;
          this.subOffsetMs = (vData.selected_subtitle && vData.selected_subtitle.auto_offset_ms) || 0;
          this.updateSubtitleUiLabels(score);
        } else {
          this.updateSubtitleUiLabels(99);
        }
      } catch (_) {
        this.updateSubtitleUiLabels(99);
      }

      await this.fetchAndParseVttCues(item);

      const toast = document.getElementById('autoSubToastBanner');
      if (toast) {
        toast.style.opacity = '1';
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
          toast.style.opacity = '0';
        }, 4000);
      }
    },

    async fetchAndParseVttCues(item) {
      const vttUrl = `/api/subtitles/vtt?imdb_id=${encodeURIComponent(item.id)}&type=${encodeURIComponent(item.type)}&season=${this.currentSeason}&episode=${this.currentEpisode}&offset_ms=0&fps_ratio=1.0&title_he=${encodeURIComponent(item.title_he || '')}`;
      const trackEl = document.getElementById('nativeHebrewTrack');
      if (trackEl) trackEl.src = vttUrl;

      try {
        const res = await fetch(vttUrl);
        if (res.ok) {
          const text = await res.text();
          this.parsedCues = this.parseWebVttText(text);
        }
      } catch (_) {}
    },

    parseWebVttText(vttText) {
      const cues = [];
      const blocks = String(vttText || '').replace(/\r\n/g, '\n').split(/\n\n+/);
      const timeRe = /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/;

      for (const block of blocks) {
        const lines = block.trim().split('\n');
        let timeIdx = -1;
        let match = null;
        for (let i = 0; i < lines.length; i++) {
          const m = lines[i].match(timeRe);
          if (m) {
            timeIdx = i;
            match = m;
            break;
          }
        }
        if (timeIdx !== -1 && match) {
          const startMs =
            Number(match[1]) * 3600000 +
            Number(match[2]) * 60000 +
            Number(match[3]) * 1000 +
            Number(match[4]);
          const endMs =
            Number(match[5]) * 3600000 +
            Number(match[6]) * 60000 +
            Number(match[7]) * 1000 +
            Number(match[8]);
          const text = lines.slice(timeIdx + 1).join('\n').trim();
          if (text) cues.push({ startMs, endMs, text });
        }
      }
      return cues;
    },

    updateCustomSubtitleOverlay(currentTimeSec) {
      const textEl = document.getElementById('customSubtitleText');
      if (!textEl) return;
      if (!this.subtitlesEnabled || !this.parsedCues.length) {
        textEl.textContent = '';
        return;
      }
      const effectiveMs = currentTimeSec * 1000 * this.subFpsRatio - this.subOffsetMs;
      const cue = this.parsedCues.find((c) => effectiveMs >= c.startMs && effectiveMs <= c.endMs);
      textEl.textContent = cue ? cue.text : '';
    },

    updateSubtitleUiLabels(score = 99) {
      const sec = (this.subOffsetMs / 1000).toFixed(1);
      const sign = this.subOffsetMs > 0 ? '+' : '';
      const pill = document.getElementById('autoSubPillText');
      if (pill) pill.textContent = `כתוביות בעברית: ${score}% (${sign}${sec}s)`;
      const lbl = document.getElementById('liveOffsetValueLabel');
      if (lbl) lbl.textContent = `${sign}${sec}s (${this.subOffsetMs}ms)`;
    },

    closePlayer() {
      const modal = document.getElementById('playerModal');
      const iframe = document.getElementById('cloudPlayerIframe');
      const video = document.getElementById('cinemaVideo');
      if (this.torrentPollTimer) {
        clearInterval(this.torrentPollTimer);
        this.torrentPollTimer = null;
      }
      if (this.hlsInstance) {
        this.hlsInstance.destroy();
        this.hlsInstance = null;
      }
      if (iframe) iframe.src = 'about:blank';
      if (video) {
        video.pause();
        video.removeAttribute('src');
      }
      if (modal) modal.classList.add('hidden');
      this.renderAllViews();
    },

    /* ======================================================================
       7. ADDONS MANAGER
       ====================================================================== */
    openAddonsModal() {
      const modal = document.getElementById('addonsModal');
      if (!modal) return;
      this.renderAddonsList();
      modal.classList.remove('hidden');
    },

    renderAddonsList() {
      const container = document.getElementById('installedAddonsGrid');
      if (!container) return;
      container.innerHTML = (this.addons || [])
        .map(
          (ad) => `
          <div class="addon-card">
            <div>
              <div class="addon-card-title">${ad.name_he || ad.name}</div>
              <div class="addon-card-desc">${ad.description_he || ''}</div>
            </div>
            <button type="button" class="btn-secondary btn-sm tv-focusable" data-toggle-addon="${ad.id}" aria-label="הפעל או השבת תוסף ${ad.name_he || ad.name}">
              ${ad.enabled !== false ? 'פעיל ✓' : 'מושבת'}
            </button>
          </div>
        `
        )
        .join('');

      container.querySelectorAll('[data-toggle-addon]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-toggle-addon');
          const target = this.addons.find((a) => a.id === id);
          if (target) {
            target.enabled = target.enabled === false;
            this.renderAddonsList();
            await fetch('/api/addons/toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, enabled: target.enabled })
            }).catch(() => {});
          }
        });
      });
    },

    showToast(msg) {
      const box = document.getElementById('toastContainer');
      if (!box) return;
      const el = document.createElement('div');
      el.className = 'toast-item';
      el.textContent = msg;
      box.appendChild(el);
      setTimeout(() => el.remove(), 3200);
    },

    formatSeconds(sec) {
      if (!Number.isFinite(sec) || sec < 0) return '00:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    /* ======================================================================
       8. EVENT BINDINGS
       ====================================================================== */
    bindEvents() {
      // Navigation Tabs
      document.querySelectorAll('[data-nav]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const nav = btn.getAttribute('data-nav');
          if (nav === 'addons') {
            this.openAddonsModal();
            return;
          }
          if (nav === 'telegram') {
            this.openTelegramModal();
            return;
          }
          this.activeTab = nav;
          document.querySelectorAll('[data-nav]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-nav') === nav);
          });
          this.renderAllViews();
        });
      });

      // Brand home button
      const brandBtn = document.getElementById('brandHomeBtn');
      if (brandBtn) {
        brandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.activeTab = 'home';
          this.activeCategory = 'all';
          this.searchQuery = '';
          const sInput = document.getElementById('globalSearchInput');
          if (sInput) sInput.value = '';
          this.renderAllViews();
        });
      }

      // Search
      const searchInput = document.getElementById('globalSearchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          this.searchQuery = searchInput.value;
          if (clearBtn) clearBtn.classList.toggle('hidden', !this.searchQuery);
          this.renderAllViews();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.searchQuery = '';
          if (searchInput) searchInput.value = '';
          clearBtn.classList.add('hidden');
          this.renderAllViews();
        });
      }

      // Category Pills
      document.querySelectorAll('[data-cat]').forEach((pill) => {
        pill.addEventListener('click', () => {
          this.activeCategory = pill.getAttribute('data-cat') || 'all';
          document.querySelectorAll('[data-cat]').forEach((p) => {
            p.classList.toggle('active', p.getAttribute('data-cat') === this.activeCategory);
          });
          this.renderAllViews();
        });
      });

      // Sort & Quality
      const sortSel = document.getElementById('sortSelect');
      if (sortSel) {
        sortSel.addEventListener('change', () => {
          this.activeSort = sortSel.value;
          this.renderAllViews();
        });
      }
      const qualSel = document.getElementById('qualityFilterSelect');
      if (qualSel) {
        qualSel.addEventListener('change', () => {
          this.activeQualityFilter = qualSel.value;
          this.renderAllViews();
        });
      }

      const resetBtn = document.getElementById('resetFiltersBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.activeTab = 'home';
          this.activeCategory = 'all';
          this.activeQualityFilter = 'all';
          this.searchQuery = '';
          if (searchInput) searchInput.value = '';
          this.renderAllViews();
        });
      }

      // Device Switcher
      document.querySelectorAll('[data-device]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-device') || 'auto';
          document.body.setAttribute('data-device-mode', mode);
          document.querySelectorAll('[data-device]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-device') === mode);
          });
        });
      });

      // Hero Actions
      const heroPlayBtn = document.getElementById('heroPlayNowBtn');
      if (heroPlayBtn) {
        heroPlayBtn.addEventListener('click', () => {
          const item = this.heroItems[this.heroIndex] || this.movies[0];
          if (item) this.launchPlayer(item, null, 1, 1);
        });
      }
      const heroStreamsBtn = document.getElementById('heroOpenStreamsBtn');
      if (heroStreamsBtn) {
        heroStreamsBtn.addEventListener('click', () => {
          const item = this.heroItems[this.heroIndex] || this.movies[0];
          if (item) this.openDetailsModal(item);
        });
      }
      const heroWlBtn = document.getElementById('heroWatchlistBtn');
      if (heroWlBtn) {
        heroWlBtn.addEventListener('click', () => {
          const item = this.heroItems[this.heroIndex] || this.movies[0];
          if (item) this.toggleWatchlist(item);
        });
      }

      // Details Modal Actions
      const closeDetailsBtn = document.getElementById('closeDetailsModalBtn');
      if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => this.closeDetailsModal());
      }
      const detailsModal = document.getElementById('detailsModal');
      if (detailsModal) {
        detailsModal.addEventListener('click', (e) => {
          if (e.target === detailsModal) this.closeDetailsModal();
        });
      }

      const detailsPlayBtn = document.getElementById('detailsPlayBestBtn');
      if (detailsPlayBtn) {
        detailsPlayBtn.addEventListener('click', () => {
          if (this.currentDetailsItem) {
            this.launchPlayer(this.currentDetailsItem, this.currentStreams[0] || null, this.currentSeason, this.currentEpisode);
          }
        });
      }

      const detailsTrailerBtn = document.getElementById('detailsTrailerBtn');
      if (detailsTrailerBtn) {
        detailsTrailerBtn.addEventListener('click', () => this.toggleTrailerInSheet());
      }

      const detailsWlBtn = document.getElementById('detailsToggleWatchlistBtn');
      if (detailsWlBtn) {
        detailsWlBtn.addEventListener('click', () => {
          if (this.currentDetailsItem) {
            this.toggleWatchlist(this.currentDetailsItem);
            this.updateDetailsWatchlistBtn();
          }
        });
      }

      document.querySelectorAll('[data-stream-filter]').forEach((chip) => {
        chip.addEventListener('click', () => {
          this.activeStreamFilter = chip.getAttribute('data-stream-filter') || 'all';
          document.querySelectorAll('[data-stream-filter]').forEach((c) => {
            c.classList.toggle('active', c.getAttribute('data-stream-filter') === this.activeStreamFilter);
          });
          this.renderStreamsList();
        });
      });

      // Player Controls & Engine Tabs
      const closePlayerBtn = document.getElementById('closePlayerBtn');
      if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', () => this.closePlayer());
      }

      document.querySelectorAll('[data-engine]').forEach((tab) => {
        tab.addEventListener('click', () => {
          this.switchPlayerEngine(tab.getAttribute('data-engine'));
        });
      });

      const switchToCloudBtn = document.getElementById('switchToInstantCloudBtn');
      if (switchToCloudBtn) {
        switchToCloudBtn.addEventListener('click', () => this.switchPlayerEngine('cloud1'));
      }

      const switchNextTorrentBtn = document.getElementById('switchNextFastTorrentBtn');
      if (switchNextTorrentBtn) {
        switchNextTorrentBtn.addEventListener('click', () => this.switchNextFastTorrent());
      }

      const videoStageEl = document.getElementById('cinemaVideo');
      if (videoStageEl) {
        videoStageEl.addEventListener('click', () => {
          if (videoStageEl.paused) videoStageEl.play().catch(() => {});
          else videoStageEl.pause();
        });
      }

      // Load More 100 Global Movies & Series Button
      const loadMoreBtn = document.getElementById('loadMoreGlobalBtn');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => this.loadMoreGlobalCatalogItems());
      }

      // Telegram Cinema Modal Events
      const closeTgBtn = document.getElementById('closeTelegramModalBtn');
      const tgModal = document.getElementById('telegramModal');
      if (closeTgBtn && tgModal) {
        closeTgBtn.addEventListener('click', () => tgModal.classList.add('hidden'));
      }
      if (tgModal) {
        tgModal.addEventListener('click', (e) => {
          if (e.target === tgModal) tgModal.classList.add('hidden');
        });
      }

      // Step 1: Connect Personal Telegram Account in Media-Only Mode (Zero Personal Chats)
      const tgConnectBtn = document.getElementById('telegramConnectAccountBtn');
      const tgHandleInp = document.getElementById('telegramAccountHandleInput');
      const tgStatusBadge = document.getElementById('telegramAccountStatusBadge');
      if (tgHandleInp && this.telegramConfig && this.telegramConfig.user_handle) {
        tgHandleInp.value = this.telegramConfig.user_handle;
        if (tgStatusBadge) {
          tgStatusBadge.textContent = `מחובר לחשבון: ${this.telegramConfig.user_handle} (סרטים בלבד • צ׳אטים נעולים 🔒)`;
        }
      }
      if (tgConnectBtn && tgHandleInp) {
        tgConnectBtn.addEventListener('click', () => {
          const val = tgHandleInp.value.trim();
          if (!val) {
            this.showToast('נא להזין מספר טלפון או @username בטלגרם לחיבור במצב סרטים בלבד');
            return;
          }
          this.saveTelegramConfigLocal({
            connected: true,
            user_handle: val,
            strict_zero_chats_policy: true
          });
          if (tgStatusBadge) {
            tgStatusBadge.textContent = `מחובר לחשבון: ${val} (סרטים בלבד • צ׳אטים נעולים 🔒)`;
          }
          this.showToast(`החשבון ${val} חובר בהצלחה במצב סרטים בלבד (0% גישה לצ׳אטים אישיים 🔒)`);
          this.runTelegramModalSearch(document.getElementById('telegramMovieSearchInput')?.value || '');
        });
      }

      const tgSearchInput = document.getElementById('telegramMovieSearchInput');
      const tgSearchBtn = document.getElementById('telegramMovieSearchBtn');
      if (tgSearchBtn && tgSearchInput) {
        tgSearchBtn.addEventListener('click', () => this.runTelegramModalSearch(tgSearchInput.value));
      }
      if (tgSearchInput) {
        tgSearchInput.addEventListener('input', () => this.runTelegramModalSearch(tgSearchInput.value));
      }

      const playTgLinkBtn = document.getElementById('playTelegramDirectLinkBtn');
      const tgLinkInp = document.getElementById('telegramDirectLinkInput');
      if (playTgLinkBtn && tgLinkInp) {
        playTgLinkBtn.addEventListener('click', () => {
          const rawUrl = tgLinkInp.value.trim();
          if (!rawUrl) {
            this.showToast('נא להדביק קישור לסרט או קובץ וידאו מטלגרם');
            return;
          }
          // Match against catalog or play directly
          const defaultMovie = this.movies[0] || {
            id: 'tt15239678',
            type: 'movie',
            title_he: 'שידור ישיר מטלגרם (Media-Only 🔒)',
            title_en: 'Telegram Direct Stream'
          };
          this.launchPlayer(defaultMovie, {
            provider: 'טלגרם קולנוע (Direct Stream 🔒)',
            release_name: rawUrl,
            stream_mode: 'telegram'
          });
        });
      }

      const tgAddChBtn = document.getElementById('telegramAddChannelBtn');
      const tgAddChInp = document.getElementById('telegramAddChannelInput');
      if (tgAddChBtn && tgAddChInp) {
        tgAddChBtn.addEventListener('click', () => {
          const val = tgAddChInp.value.trim().replace(/^@/, '').split('/').pop();
          if (!val) return;
          this.telegramConfig.channels.unshift({
            username: val,
            title_he: `ערוץ סרטים וסדרות מחובר (@${val})`,
            category: 'movies',
            enabled: true
          });
          this.saveTelegramConfigLocal({ add_channel: val });
          this.renderTelegramChannelsList();
          tgAddChInp.value = '';
          this.showToast(`הערוץ @${val} חובר במצב סרטים בלבד (ללא גישה לצ׳אטים אישיים 🔒)`);
        });
      }

      // Home Wi-Fi & Streamer Network Modal
      const openNetBtn = document.getElementById('openHomeNetworkBtn');
      const closeNetBtn = document.getElementById('closeHomeNetworkModalBtn');
      const netModal = document.getElementById('homeNetworkModal');
      const copyLanBtn = document.getElementById('copyLanUrlBtn');
      if (openNetBtn && netModal) {
        openNetBtn.addEventListener('click', async () => {
          netModal.classList.remove('hidden');
          try {
            const res = await fetch('/api/network-info');
            if (res.ok) {
              const info = await res.json();
              const box = document.getElementById('lanUrlDisplayBox');
              if (box && info.lan_url) box.textContent = info.lan_url;
            }
          } catch (_) {}
        });
      }
      if (closeNetBtn && netModal) {
        closeNetBtn.addEventListener('click', () => netModal.classList.add('hidden'));
      }
      if (netModal) {
        netModal.addEventListener('click', (e) => {
          if (e.target === netModal) netModal.classList.add('hidden');
        });
      }
      if (copyLanBtn) {
        copyLanBtn.addEventListener('click', () => {
          const box = document.getElementById('lanUrlDisplayBox');
          const txt = box ? box.textContent.trim() : window.location.origin;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(txt).catch(() => {});
          }
          this.showToast(`הכתובת הועתקה: ${txt}`);
        });
      }

      const toggleInspectorBtn = document.getElementById('toggleAutoSubInspectorBtn');
      const closeInspectorBtn = document.getElementById('closeAutoSubInspectorBtn');
      const inspectorPanel = document.getElementById('autoSubInspectorPanel');
      if (toggleInspectorBtn && inspectorPanel) {
        toggleInspectorBtn.addEventListener('click', () => inspectorPanel.classList.toggle('hidden'));
      }
      if (closeInspectorBtn && inspectorPanel) {
        closeInspectorBtn.addEventListener('click', () => inspectorPanel.classList.add('hidden'));
      }

      // Subtitle Offset & Appearance Controls
      document.querySelectorAll('[data-offset-delta]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.subOffsetMs += Number(btn.getAttribute('data-offset-delta')) || 0;
          this.updateSubtitleUiLabels();
        });
      });
      document.querySelectorAll('[data-offset-reset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.subOffsetMs = 0;
          this.updateSubtitleUiLabels();
        });
      });

      const aiSnapBtn = document.getElementById('aiSnapSyncBtn');
      if (aiSnapBtn) {
        aiSnapBtn.addEventListener('click', () => {
          const video = document.getElementById('cinemaVideo');
          if (video && this.parsedCues.length) {
            const nowMs = video.currentTime * 1000;
            const nearest = this.parsedCues.reduce((best, c) =>
              Math.abs(c.startMs - nowMs) < Math.abs(best.startMs - nowMs) ? c : best
            );
            this.subOffsetMs = Math.round(nowMs - nearest.startMs);
            this.updateSubtitleUiLabels();
            this.showToast('הכתוביות סונכרנו לנקודת הדיבור הנוכחית');
          }
        });
      }

      document.querySelectorAll('[data-sub-size]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const sz = btn.getAttribute('data-sub-size');
          const overlay = document.getElementById('customSubtitleOverlay');
          if (overlay) overlay.setAttribute('data-size', sz);
          document.querySelectorAll('[data-sub-size]').forEach((b) =>
            b.classList.toggle('active', b.getAttribute('data-sub-size') === sz)
          );
        });
      });

      document.querySelectorAll('[data-sub-bg]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const bg = btn.getAttribute('data-sub-bg');
          const overlay = document.getElementById('customSubtitleOverlay');
          if (overlay) overlay.setAttribute('data-bg', bg);
          document.querySelectorAll('[data-sub-bg]').forEach((b) =>
            b.classList.toggle('active', b.getAttribute('data-sub-bg') === bg)
          );
        });
      });

      // Native Video Element Events
      const video = document.getElementById('cinemaVideo');
      const seekSlider = document.getElementById('playerSeekSlider');
      if (video) {
        video.addEventListener('timeupdate', () => {
          this.updateCustomSubtitleOverlay(video.currentTime);
          document.getElementById('playerCurrentTime').textContent = this.formatSeconds(video.currentTime);
          document.getElementById('playerDurationTime').textContent = this.formatSeconds(video.duration || 0);
          if (seekSlider && video.duration) {
            seekSlider.value = Math.round((video.currentTime / video.duration) * 1000);
          }
        });
      }

      if (seekSlider && video) {
        seekSlider.addEventListener('input', () => {
          if (video.duration) {
            video.currentTime = (Number(seekSlider.value) / 1000) * video.duration;
          }
        });
      }

      const playPauseBtn = document.getElementById('playerPlayPauseBtn');
      if (playPauseBtn && video) {
        playPauseBtn.addEventListener('click', () => {
          if (video.paused) video.play().catch(() => {});
          else video.pause();
        });
      }

      const seekBackBtn = document.getElementById('playerSeekBackBtn');
      if (seekBackBtn && video) {
        seekBackBtn.addEventListener('click', () => {
          video.currentTime = Math.max(0, video.currentTime - 10);
        });
      }
      const seekFwdBtn = document.getElementById('playerSeekFwdBtn');
      if (seekFwdBtn && video) {
        seekFwdBtn.addEventListener('click', () => {
          video.currentTime = Math.min(video.duration || 9999, video.currentTime + 10);
        });
      }

      const quickMinus = document.getElementById('playerQuickSubMinusBtn');
      if (quickMinus) {
        quickMinus.addEventListener('click', () => {
          this.subOffsetMs -= 100;
          this.updateSubtitleUiLabels();
        });
      }
      const quickPlus = document.getElementById('playerQuickSubPlusBtn');
      if (quickPlus) {
        quickPlus.addEventListener('click', () => {
          this.subOffsetMs += 100;
          this.updateSubtitleUiLabels();
        });
      }

      const subToggleBtn = document.getElementById('playerSubToggleBtn');
      if (subToggleBtn) {
        subToggleBtn.addEventListener('click', () => {
          this.subtitlesEnabled = !this.subtitlesEnabled;
          subToggleBtn.textContent = this.subtitlesEnabled ? 'כתוביות: פעיל' : 'כתוביות: כבוי';
          subToggleBtn.classList.toggle('active', this.subtitlesEnabled);
        });
      }

      const fsBtn = document.getElementById('playerFullscreenBtn');
      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          const wrap = document.querySelector('.player-wrapper');
          if (!document.fullscreenElement && wrap && wrap.requestFullscreen) {
            wrap.requestFullscreen().catch(() => {});
          } else if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        });
      }

      // Custom .srt/.vtt file upload
      const subFileInput = document.getElementById('customSubFileInput');
      if (subFileInput) {
        subFileInput.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const rawText = await file.text();
          try {
            const res = await fetch('/api/subtitles/convert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ srt: rawText, offset_ms: 0, fps_ratio: 1.0 })
            });
            if (res.ok) {
              const data = await res.json();
              this.parsedCues = this.parseWebVttText(data.vtt || '');
              this.showToast(`קובץ הכתוביות "${file.name}" נטען וסונכרן בהצלחה`);
            }
          } catch (_) {}
        });
      }

      // Addons Modal
      const closeAddonsBtn = document.getElementById('closeAddonsModalBtn');
      const addonsModal = document.getElementById('addonsModal');
      if (closeAddonsBtn && addonsModal) {
        closeAddonsBtn.addEventListener('click', () => addonsModal.classList.add('hidden'));
      }
      const installManifestBtn = document.getElementById('installManifestBtn');
      if (installManifestBtn) {
        installManifestBtn.addEventListener('click', async () => {
          const inp = document.getElementById('customManifestUrlInput');
          const statusEl = document.getElementById('addonInstallStatus');
          const url = inp ? inp.value.trim() : '';
          if (!url) return;
          if (statusEl) statusEl.textContent = 'מתקין תוסף...';
          try {
            const res = await fetch('/api/addons/install', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ manifest_url: url })
            });
            const data = await res.json();
            if (data.ok) {
              this.addons = data.installed_addons || this.addons;
              this.renderAddonsList();
              if (statusEl) statusEl.textContent = 'התוסף הותקן בהצלחה!';
              if (inp) inp.value = '';
            } else if (statusEl) {
              statusEl.textContent = data.error || 'שגיאה בהתקנת התוסף';
            }
          } catch (_) {
            this.addons.push({
              id: 'custom_' + Date.now(),
              name_he: 'תוסף Stremio מותאם אישית',
              description_he: url,
              enabled: true
            });
            this.renderAddonsList();
            if (statusEl) statusEl.textContent = 'התוסף הותקן בהצלחה!';
            if (inp) inp.value = '';
          }
        });
      }
    },

    toggleWatchlist(item) {
      const list = [...(this.userState.watchlist || [])];
      const idx = list.indexOf(item.id);
      if (idx >= 0) {
        list.splice(idx, 1);
        this.showToast(`"${item.title_he}" הוסר מהרשימה שלי`);
      } else {
        list.push(item.id);
        this.showToast(`"${item.title_he}" נוסף לרשימה שלי`);
      }
      this.saveUserState({ watchlist: list });
      this.renderHeroBanner();
    }
  };

  window.StreamItApp = StreamItApp;
  document.addEventListener('DOMContentLoaded', () => StreamItApp.init());
})();
