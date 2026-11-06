/**
 * STREAM IT (סטרים איט) — Android TV 10-Foot Spatial Navigation & Remote Control Engine
 * ======================================================================================
 * מנוע ניווט מרחבי דו-ממדי (2D D-Pad Spatial Navigation) מותאם מלא לשלטי סטרימרים
 * (Android TV / Google TV / Xiaomi / Nvidia Shield / Yes+ / Partner / Fire TV),
 * כולל תמיכה בכפתורי OK/Enter, חזור (Back), חיפוש קולי/מקלדת עברית על המסך ושליטה בנגן.
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
    lastFocusedByScope: new Map(),

    init() {
      this.setupDeviceSwitcher();
      this.bindSpatialKeydown();
      this.observeModalTransitions();
      this.applyDeviceMode('auto', false);
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

    applyDeviceMode(mode, notifyUser = true) {
      this.currentDeviceMode = mode || 'auto';
      const resolved = mode === 'auto' ? this.detectHardwareDevice() : mode;
      this.effectiveDevice = resolved;

      document.body.setAttribute('data-device-mode', resolved);
      document.body.classList.remove('device-auto', 'device-pc', 'device-mobile', 'device-tv');
      document.body.classList.add(`device-${resolved}`);

      const pills = document.querySelectorAll('.device-pill, .device-pill-btn');
      pills.forEach((btn) => {
        const isMatch = btn.getAttribute('data-device') === mode;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });

      if (resolved === 'tv') {
        setTimeout(() => {
          this.ensureValidFocusInActiveScope();
        }, 80);
      }

      if (notifyUser && window.StreamItApp && typeof window.StreamItApp.showToast === 'function') {
        const labels = {
          auto: 'מצב תצוגה: זיהוי אוטומטי חכם',
          tv: '📺 מצב סטרימר TV הופעל — ניווט מלא עם שלט (חצים + OK + חזור)'
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
      // Ordered from topmost overlay/modal down to main page
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
        const inShelf = el.closest('.shelf-track');
        if (inShelf) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      } catch (_) {}
    },

    ensureValidFocusInActiveScope() {
      const scope = this.getActiveScopeContainer();
      const candidates = this.getFocusableElements(scope);
      if (!candidates.length) return;
      const cur = document.activeElement;
      if (cur && candidates.includes(cur)) {
        cur.classList.add('tv-focused');
        return;
      }

      // Pick best default focus element for each screen/modal
      let preferred = null;
      if (scope.id === 'detailsModal') {
        preferred = document.getElementById('detailsPlayPrimaryBtn');
      } else if (scope.id === 'playerModal') {
        preferred =
          (isModalOpen('bingeUpNextCard') && document.getElementById('bingePlayNowBtn')) ||
          document.getElementById('playerPlayPauseBtn') ||
          document.getElementById('closePlayerModalBtn');
      } else if (scope.id === 'authProfilesModal') {
        preferred = scope.querySelector('.netflix-profile-card');
      } else if (scope.id === 'authGateScreen') {
        preferred = document.getElementById('authEmailInput');
      } else if (scope === document.body) {
        preferred = document.getElementById('heroPlayNowBtn');
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
          setTimeout(() => this.ensureValidFocusInActiveScope(), 60);
        } else if (isModalOpen('bingeUpNextCard')) {
          const playNowBtn = document.getElementById('bingePlayNowBtn');
          if (playNowBtn && document.activeElement !== playNowBtn && document.activeElement?.id !== 'bingeDismissBtn') {
            this.focusElement(playNowBtn);
          }
        }
      }, 220);
    },

    findNextSpatialElement(direction) {
      const scope = this.getActiveScopeContainer();
      const candidates = this.getFocusableElements(scope);
      if (!candidates.length) return null;

      const current = document.activeElement;
      if (!current || !candidates.includes(current)) {
        return candidates[0];
      }

      const curRect = current.getBoundingClientRect();
      const curCenter = {
        x: curRect.left + curRect.width / 2,
        y: curRect.top + curRect.height / 2
      };

      const curShelf = current.closest('.shelf-track, .category-pills, .netflix-profiles-grid, .player-engine-tabs, .controls-group');

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

        if (direction === 'up' && dy < -8) {
          isDirectionValid = true;
          primaryDist = Math.abs(dy);
          orthogonalDist = Math.abs(dx);
        } else if (direction === 'down' && dy > 8) {
          isDirectionValid = true;
          primaryDist = Math.abs(dy);
          orthogonalDist = Math.abs(dx);
        } else if (direction === 'left' && dx < -8) {
          isDirectionValid = true;
          primaryDist = Math.abs(dx);
          orthogonalDist = Math.abs(dy);
        } else if (direction === 'right' && dx > 8) {
          isDirectionValid = true;
          primaryDist = Math.abs(dx);
          orthogonalDist = Math.abs(dy);
        }

        if (!isDirectionValid) continue;

        // Strongly prefer staying inside the same horizontal row/shelf when pressing Left/Right
        let rowBonus = 0;
        if ((direction === 'left' || direction === 'right') && curShelf && el.closest('.shelf-track, .category-pills, .netflix-profiles-grid, .player-engine-tabs, .controls-group') === curShelf) {
          rowBonus = -1200;
        }

        const score = primaryDist + orthogonalDist * 2.5 + rowBonus;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = el;
        }
      }

      return bestCandidate;
    },

    handleAndroidBackButton() {
      // Returns true if an overlay/modal was closed, false if already on main home view
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
        const activeTag = activeEl ? activeEl.tagName.toLowerCase() : '';
        const isTextInput =
          (activeTag === 'input' &&
            !['range', 'button', 'submit', 'checkbox'].includes(activeEl.type)) ||
          activeTag === 'textarea';

        // Wake up player controls on any remote button press inside the player
        if (isModalOpen('playerModal') && window.StreamItApp && typeof window.StreamItApp.resetPlayerIdleTimer === 'function') {
          window.StreamItApp.resetPlayerIdleTimer();
        }

        // 1. Android TV Remote Back / Escape Button
        if (e.key === 'Escape' || e.key === 'BrowserBack' || e.key === 'GoBack') {
          if (this.handleAndroidBackButton()) {
            e.preventDefault();
          }
          return;
        }

        // 2. Android TV Remote Media Keys (Play/Pause, FastForward, Rewind, Next/Prev)
        if (isModalOpen('playerModal') && window.StreamItApp) {
          const video = document.getElementById('cinemaVideo');
          if (e.key === 'MediaPlayPause' || (e.key === ' ' && !isTextInput && activeTag !== 'button')) {
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

        // 3. D-Pad Center / OK Button (Enter) on Non-Button Focusable Cards (Movie Cards, Episodes, Profiles, Checkboxes)
        if ((e.key === 'Enter' || e.key === 'NumpadEnter') && activeEl && !isTextInput) {
          if (activeTag === 'input' && activeEl.type === 'checkbox') {
            e.preventDefault();
            activeEl.checked = !activeEl.checked;
            activeEl.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
          if (activeTag !== 'button' && activeTag !== 'a' && activeTag !== 'select') {
            e.preventDefault();
            activeEl.click();
            return;
          }
        }

        // 4. D-Pad Arrow Spatial Navigation (Up / Down / Left / Right)
        const arrowMap = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right'
        };

        const dir = arrowMap[e.key];
        if (!dir) return;

        // If user is on the search input and presses Enter or Down, or if typing text allow Left/Right inside text
        if (isTextInput && (dir === 'left' || dir === 'right') && activeEl.value) {
          return;
        }
        if (activeTag === 'input' && activeEl.type === 'range' && (dir === 'left' || dir === 'right')) {
          return;
        }

        const nextEl = this.findNextSpatialElement(dir);
        if (nextEl) {
          e.preventDefault();
          this.focusElement(nextEl);
        }
      });
    }
  };

  window.TVNavigation = TVNavigation;

  document.addEventListener('DOMContentLoaded', () => {
    TVNavigation.init();
  });
})();
