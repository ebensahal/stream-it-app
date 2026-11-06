/**
 * STREAM IT (סטרים איט) — Android TV 10-Foot Spatial Navigation & Remote Control Engine (v6.4)
 * ============================================================================================
 * מנוע ניווט מרחבי דו-ממדי (2D D-Pad Spatial Navigation) מותאם מלא לשלטי סטרימרים
 * (Android TV / Google TV / Xiaomi / Nvidia Shield / Yes+ / Partner / Fire TV),
 * כולל תמיכה מלאה בכפתורי חצים, OK/Enter, חזור (Back), ומעבר מיידי לניגון סרטים.
 */

(function () {
  'use strict';

  const isVisibleElement = (el) => {
    if (!el) return false;
    if (el.hidden || el.classList.contains('hidden')) return false;
    if (el.closest('.hidden') || el.closest('[hidden]')) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 4 && rect.height > 4;
  };

  const isModalOpen = (id) => {
    const el = document.getElementById(id);
    return Boolean(el && !el.hidden && !el.classList.contains('hidden'));
  };

  const TVNavigation = {
    currentDeviceMode: 'auto',
    effectiveDevice: 'pc',
    lastOkTimestamp: 0,
    lastDirTimestamp: 0,

    init() {
      this.setupDeviceSwitcher();
      this.bindSpatialKeydown();
      this.observeModalTransitions();
      this.applyDeviceMode('auto', false);
      window.addEventListener('resize', () => {
        if (this.effectiveDevice === 'tv') {
          this.calibrateTvViewport();
        }
      });
    },

    detectHardwareDevice() {
      if (window.Capacitor) return 'tv';
      const ua = navigator.userAgent || '';
      const isTV =
        /Android.*(TV|AFT|BRAVIA|SHIELD|MiBox|Leanback|Chromecast|GoogleTV)|SmartTV|Tizen|Web0S/i.test(ua);
      if (isTV) return 'tv';
      if (window.innerWidth <= 768) return 'mobile';
      return 'pc';
    },

    calibrateTvViewport() {
      const htmlEl = document.documentElement;
      if (this.effectiveDevice !== 'tv') {
        htmlEl.removeAttribute('data-tv-mode');
        htmlEl.style.removeProperty('font-size');
        return;
      }
      htmlEl.setAttribute('data-tv-mode', 'true');
      // Readable 10-foot Smart TV base font size (16px–17.5px) while keeping card & container sizes compact via CSS
      const vw = Math.max(window.innerWidth || 960, 640);
      const basePx = Math.max(16, Math.min(17.5, (vw / 960) * 16.5));
      htmlEl.style.fontSize = `${basePx.toFixed(2)}px`;
    },

    applyDeviceMode(mode, notifyUser = true) {
      this.currentDeviceMode = mode || 'auto';
      const resolved = mode === 'auto' ? this.detectHardwareDevice() : mode;
      this.effectiveDevice = resolved;

      document.body.setAttribute('data-device-mode', resolved);
      document.body.classList.remove('device-auto', 'device-pc', 'device-mobile', 'device-tv');
      document.body.classList.add(`device-${resolved}`);

      this.calibrateTvViewport();

      const pills = document.querySelectorAll('.device-pill, .device-pill-btn');
      pills.forEach((btn) => {
        const isMatch = btn.getAttribute('data-device') === mode;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });

      if (resolved === 'tv') {
        setTimeout(() => {
          this.ensureValidFocusInActiveScope();
        }, 60);
      }

      if (notifyUser && window.StreamItApp && typeof window.StreamItApp.showToast === 'function') {
        const labels = {
          auto: 'מצב תצוגה: זיהוי אוטומטי חכם',
          tv: '📺 מצב סטרימר TV הופעל — ניווט מלא עם שלט'
        };
        window.StreamItApp.showToast(labels[mode] || labels.auto);
      }
    },

    setupDeviceSwitcher() {
      const pills = document.querySelectorAll('.device-pill, .device-pill-btn');
      pills.forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-device') || 'auto';
          this.applyDeviceMode(mode, true);
        });
      });
    },

    getActiveScopeContainer() {
      const priorityIds = [
        'pinVerifyModal',
        'virtualKeyboardModal',
        'autoSubInspectorPanel',
        'playerModal',
        'adminApprovalsModal',
        'watchHistoryModal',
        'subtitlePrefsModal',
        'vpnShieldModal',
        'telegramModal',
        'addonsModal',
        'detailsModal',
        'authProfilesModal',
        'authGateScreen',
        'headerUserDropdown'
      ];
      for (const id of priorityIds) {
        if (isModalOpen(id)) {
          return document.getElementById(id);
        }
      }
      return document.body;
    },

    getFocusableElements(scope) {
      const container = scope || this.getActiveScopeContainer();
      const selector = [
        '.tv-focusable',
        '.media-card',
        '.episode-row-card',
        '.netflix-profile-card',
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        '[tabindex="0"]'
      ].join(',');

      const nodes = Array.from(container.querySelectorAll(selector));
      return nodes.filter(isVisibleElement);
    },

    focusElement(el) {
      if (!el) return;
      document.querySelectorAll('.tv-focused').forEach((node) => node.classList.remove('tv-focused'));
      el.classList.add('tv-focused');
      try {
        el.focus({ preventScroll: true });
      } catch (_) {
        try {
          el.focus();
        } catch (__) {}
      }
      try {
        const inShelf = el.closest('.shelf-track, .category-pills, .season-pills-row');
        if (inShelf) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      } catch (_) {}
    },

    ensureValidFocusInActiveScope(forcePreferred = false) {
      const scope = this.getActiveScopeContainer();
      const candidates = this.getFocusableElements(scope);
      if (!candidates.length) return;
      const cur = document.activeElement;
      if (!forcePreferred && cur && candidates.includes(cur)) {
        cur.classList.add('tv-focused');
        return;
      }

      let preferred = null;
      if (scope.id === 'detailsModal') {
        preferred =
          document.getElementById('detailsPlayBestBtn') ||
          document.getElementById('detailsTrailerBtn');
      } else if (scope.id === 'playerModal') {
        preferred =
          (isModalOpen('skipIntroOverlayBtn') && document.getElementById('skipIntroOverlayBtn')) ||
          (isModalOpen('bingeUpNextCard') && document.getElementById('bingePlayNowBtn')) ||
          document.getElementById('playerPlayPauseBtn') ||
          document.getElementById('closePlayerBtn');
      } else if (scope.id === 'authProfilesModal') {
        preferred = scope.querySelector('.netflix-profile-card');
      } else if (scope.id === 'authGateScreen') {
        preferred =
          document.getElementById('tvQuickStreamerLoginBtn') ||
          document.getElementById('authEmailInput');
      } else if (scope.id === 'virtualKeyboardModal') {
        preferred =
          scope.querySelector('[data-vk-char]') ||
          scope.querySelector('.vk-key-btn') ||
          document.getElementById('vkSubmitBtn');
      } else if (scope === document.body) {
        preferred =
          document.getElementById('heroPlayNowBtn') ||
          document.querySelector('.media-card');
      }

      this.focusElement(preferred && candidates.includes(preferred) ? preferred : candidates[0]);
    },

    observeModalTransitions() {
      let lastScopeId = '';
      setInterval(() => {
        const scope = this.getActiveScopeContainer();
        const scopeId = scope ? scope.id || 'body' : 'body';
        if (scopeId !== lastScopeId) {
          lastScopeId = scopeId;
          setTimeout(() => this.ensureValidFocusInActiveScope(true), 40);
        } else if (isModalOpen('bingeUpNextCard')) {
          const playNowBtn = document.getElementById('bingePlayNowBtn');
          if (
            playNowBtn &&
            document.activeElement !== playNowBtn &&
            document.activeElement?.id !== 'bingeDismissBtn'
          ) {
            this.focusElement(playNowBtn);
          }
        }
      }, 180);
    },

    findNextSpatialElement(direction) {
      const scope = this.getActiveScopeContainer();
      const candidates = this.getFocusableElements(scope);
      if (!candidates.length) return null;

      const current = document.activeElement;
      if (!current || !candidates.includes(current)) {
        return candidates[0];
      }

      // Special fast-path inside Details Modal so pressing Down from Close button or Up from body always lands on Play!
      if (scope.id === 'detailsModal') {
        const playBtn = document.getElementById('detailsPlayBestBtn');
        if (playBtn && isVisibleElement(playBtn)) {
          if (current.id === 'closeDetailsModalBtn' && (direction === 'down' || direction === 'right')) {
            return playBtn;
          }
        }
      }

      const curRect = current.getBoundingClientRect();
      const curCenter = {
        x: curRect.left + curRect.width / 2,
        y: curRect.top + curRect.height / 2
      };

      const rowSelector =
        '.shelf-track, .category-pills, .netflix-profiles-grid, .player-engine-tabs, .controls-group, .sheet-action-row, .hero-actions, .main-nav';
      const curShelf = current.closest(rowSelector);

      let bestCandidate = null;
      let bestScore = Infinity;

      for (const el of candidates) {
        if (el === current) continue;
        const rect = el.getBoundingClientRect();
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        const dx = center.x - curCenter.x;
        const dy = center.y - curCenter.y;

        let isDirectionValid = false;
        let primaryDist = 0;
        let orthogonalDist = 0;

        if (direction === 'up' && dy < -6) {
          isDirectionValid = true;
          primaryDist = Math.abs(dy);
          orthogonalDist = Math.abs(dx);
        } else if (direction === 'down' && dy > 6) {
          isDirectionValid = true;
          primaryDist = Math.abs(dy);
          orthogonalDist = Math.abs(dx);
        } else if (direction === 'left' && dx < -6) {
          isDirectionValid = true;
          primaryDist = Math.abs(dx);
          orthogonalDist = Math.abs(dy);
        } else if (direction === 'right' && dx > 6) {
          isDirectionValid = true;
          primaryDist = Math.abs(dx);
          orthogonalDist = Math.abs(dy);
        }

        if (!isDirectionValid) continue;

        const elShelf = el.closest(rowSelector);
        const sameRow = Boolean(curShelf && elShelf === curShelf);

        if (direction === 'left' || direction === 'right') {
          // For Left/Right, strongly stay inside the same horizontal row/shelf
          const rowBonus = sameRow ? -2500 : 0;
          const score = primaryDist + orthogonalDist * 3.2 + rowBonus;
          if (score < bestScore) {
            bestScore = score;
            bestCandidate = el;
          }
        } else {
          // For Up/Down, move between rows/sections; ignore items in the exact same horizontal shelf
          if (sameRow && Math.abs(dy) < curRect.height * 0.85) continue;
          const isVk = scope.id === 'virtualKeyboardModal';
          const playBonus =
            el.id === 'detailsPlayBestBtn' || el.id === 'heroPlayNowBtn' ? -140 : 0;
          const score = isVk
            ? primaryDist * 1.5 + orthogonalDist * 2.4
            : primaryDist * 1.8 + orthogonalDist * 0.32 + playBonus;
          if (score < bestScore) {
            bestScore = score;
            bestCandidate = el;
          }
        }
      }

      return bestCandidate;
    },

    handleRemoteDirection(dir) {
      const now = Date.now();
      if (now - this.lastDirTimestamp < 55) return;
      this.lastDirTimestamp = now;

      if (
        isModalOpen('playerModal') &&
        window.StreamItApp &&
        typeof window.StreamItApp.resetPlayerIdleTimer === 'function'
      ) {
        window.StreamItApp.resetPlayerIdleTimer();
      }

      const activeEl = document.activeElement;
      if (
        activeEl &&
        activeEl.tagName &&
        activeEl.tagName.toLowerCase() === 'input' &&
        activeEl.type === 'range' &&
        (dir === 'left' || dir === 'right')
      ) {
        const video = document.getElementById('cinemaVideo');
        if (video) {
          const delta = dir === 'right' ? 10 : -10;
          video.currentTime = Math.max(0, Math.min(video.duration || 9999, video.currentTime + delta));
          return;
        }
      }

      const nextEl = this.findNextSpatialElement(dir);
      if (nextEl) {
        this.focusElement(nextEl);
      } else {
        this.ensureValidFocusInActiveScope(false);
      }
    },

    handleRemoteOk() {
      const now = Date.now();
      if (now - this.lastOkTimestamp < 180) return;
      this.lastOkTimestamp = now;

      if (
        isModalOpen('playerModal') &&
        window.StreamItApp &&
        typeof window.StreamItApp.resetPlayerIdleTimer === 'function'
      ) {
        window.StreamItApp.resetPlayerIdleTimer();
      }

      let activeEl = document.activeElement;
      const scope = this.getActiveScopeContainer();
      const candidates = this.getFocusableElements(scope);
      if (!activeEl || activeEl === document.body || !candidates.includes(activeEl)) {
        this.ensureValidFocusInActiveScope(true);
        activeEl = document.activeElement;
      }
      if (!activeEl || activeEl === document.body) return;

      const tag = activeEl.tagName ? activeEl.tagName.toLowerCase() : '';

      // 1. Checkbox toggle
      if (tag === 'input' && activeEl.type === 'checkbox') {
        activeEl.checked = !activeEl.checked;
        activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }

      // 2. Any text/email/password/search input -> open Universal On-Screen TV Keyboard + request Android IME
      if (
        tag === 'input' &&
        !['button', 'submit', 'checkbox', 'range'].includes(activeEl.type)
      ) {
        activeEl.focus();
        if (
          window.StreamItApp &&
          typeof window.StreamItApp.openVirtualKeyboardForInput === 'function'
        ) {
          window.StreamItApp.openVirtualKeyboardForInput(activeEl);
          return;
        }
        if (window.AndroidTvBridge && typeof window.AndroidTvBridge.showSoftKeyboard === 'function') {
          try {
            window.AndroidTvBridge.showSoftKeyboard();
          } catch (_) {}
        }
        return;
      }

      // 4. Select dropdown -> cycle options on OK press
      if (tag === 'select' && activeEl.options && activeEl.options.length) {
        activeEl.selectedIndex = (activeEl.selectedIndex + 1) % activeEl.options.length;
        activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }

      // 5. Click any Button, Link, Movie Card, Episode Row, or Profile Card!
      activeEl.click();
    },

    handleAndroidBackButton() {
      if (isModalOpen('pinVerifyModal')) {
        document.getElementById('pinVerifyModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('virtualKeyboardModal')) {
        document.getElementById('virtualKeyboardModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('autoSubInspectorPanel')) {
        document.getElementById('autoSubInspectorPanel')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('playerModal') && window.StreamItApp) {
        window.StreamItApp.closePlayer();
        return true;
      }
      if (isModalOpen('adminApprovalsModal')) {
        document.getElementById('adminApprovalsModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('watchHistoryModal')) {
        document.getElementById('watchHistoryModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('subtitlePrefsModal')) {
        document.getElementById('subtitlePrefsModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('vpnShieldModal')) {
        document.getElementById('vpnShieldModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('telegramModal')) {
        document.getElementById('telegramModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('addonsModal')) {
        document.getElementById('addonsModal')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('detailsModal') && window.StreamItApp) {
        window.StreamItApp.closeDetailsModal();
        return true;
      }
      if (isModalOpen('headerUserDropdown')) {
        document.getElementById('headerUserDropdown')?.classList.add('hidden');
        return true;
      }
      if (isModalOpen('authProfilesModal')) {
        const closeBtn = document.getElementById('closeAuthProfilesModalBtn');
        if (closeBtn && !closeBtn.classList.contains('hidden')) {
          document.getElementById('authProfilesModal')?.classList.add('hidden');
          return true;
        }
      }
      return false;
    },

    bindSpatialKeydown() {
      window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        const activeTag = activeEl && activeEl.tagName ? activeEl.tagName.toLowerCase() : '';
        const isTextInput =
          (activeTag === 'input' &&
            !['range', 'button', 'submit', 'checkbox'].includes(activeEl.type)) ||
          activeTag === 'textarea';

        if (
          isModalOpen('playerModal') &&
          window.StreamItApp &&
          typeof window.StreamItApp.resetPlayerIdleTimer === 'function'
        ) {
          window.StreamItApp.resetPlayerIdleTimer();
        }

        // 1. Back / Escape
        if (e.key === 'Escape' || e.key === 'BrowserBack' || e.key === 'GoBack' || e.keyCode === 4) {
          if (this.handleAndroidBackButton()) {
            e.preventDefault();
          }
          return;
        }

        // 2. Media keys inside player
        if (isModalOpen('playerModal') && window.StreamItApp) {
          const video = document.getElementById('cinemaVideo');
          if (
            e.key === 'MediaPlayPause' ||
            (e.key === ' ' && !isTextInput && activeTag !== 'button')
          ) {
            e.preventDefault();
            if (video) {
              if (video.paused) video.play().catch(() => {});
              else video.pause();
            }
            return;
          }
          if (e.key === 'MediaFastForward') {
            e.preventDefault();
            if (video) video.currentTime = Math.min(video.duration || 9999, video.currentTime + 10);
            return;
          }
          if (e.key === 'MediaRewind') {
            e.preventDefault();
            if (video) video.currentTime = Math.max(0, video.currentTime - 10);
            return;
          }
          if (e.key === 'MediaTrackNext') {
            e.preventDefault();
            window.StreamItApp.playNextBingeTarget();
            return;
          }
          if (e.key === 'MediaTrackPrevious') {
            e.preventDefault();
            window.StreamItApp.playPrevBingeTarget();
            return;
          }
        }

        // 3. D-Pad Center / OK / Enter
        const isOkKey =
          e.key === 'Enter' ||
          e.key === 'NumpadEnter' ||
          e.key === 'Select' ||
          e.key === 'Accept' ||
          e.keyCode === 23 ||
          e.keyCode === 66;

        if (
          isOkKey &&
          (!isTextInput || this.effectiveDevice === 'tv' || activeEl?.id === 'globalSearchInput')
        ) {
          e.preventDefault();
          this.handleRemoteOk();
          return;
        }

        // 4. D-Pad Arrows
        const arrowMap = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right',
          Up: 'up',
          Down: 'down',
          Left: 'left',
          Right: 'right'
        };

        const dir =
          arrowMap[e.key] ||
          (e.keyCode === 19
            ? 'up'
            : e.keyCode === 20
            ? 'down'
            : e.keyCode === 21
            ? 'left'
            : e.keyCode === 22
            ? 'right'
            : null);

        if (!dir) return;

        if (isTextInput && (dir === 'left' || dir === 'right') && activeEl.value) {
          return;
        }

        e.preventDefault();
        this.handleRemoteDirection(dir);
      });
    }
  };

  window.TVNavigation = TVNavigation;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TVNavigation.init());
  } else {
    TVNavigation.init();
  }
})();
