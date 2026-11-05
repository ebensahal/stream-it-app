/**
 * STREAM IT (סטרים איט) — Android TV 10-Foot Spatial Navigation & Hebrew Virtual Keyboard
 * =======================================================================================
 * מנוע ניווט מרחבי דו-ממדי (2D D-Pad Spatial Navigation) לשלטי סטרימרים (Android TV / Google TV),
 * טלוויזיות חכמות ומקלדת, כולל מקלדת עברית וירטואלית מלאה על המסך.
 */

(function () {
  'use strict';

  const HEBREW_KEYS = [
    'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ', '1', '2',
    'ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', '3',
    'ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ', '4',
    '5', '6', '7', '8', '9', '0', '-', '"', '\'', 'A-Z'
  ];

  const ENGLISH_KEYS = [
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '1',
    'Z', 'X', 'C', 'V', 'B', 'N', 'M', '2', '3', '4',
    '5', '6', '7', '8', '9', '0', '-', '.', '/', 'עב'
  ];

  const TVNavigation = {
    currentDeviceMode: 'auto',
    effectiveDevice: 'pc',
    vkLanguage: 'he',
    lastFocusedBeforeModal: null,

    init() {
      this.setupDeviceSwitcher();
      this.renderVirtualKeyboard();
      this.bindVirtualKeyboardEvents();
      this.bindSpatialKeydown();
      this.applyDeviceMode('auto', false);
    },

    detectHardwareDevice() {
      const ua = navigator.userAgent || '';
      const isTV = /Android.*(TV|AFT|BRAVIA|SHIELD|MiBox|Leanback|Chromecast|GoogleTV)|SmartTV|Tizen|Web0S/i.test(ua);
      if (isTV) return 'tv';
      if (window.innerWidth <= 768) return 'mobile';
      return 'pc';
    },

    applyDeviceMode(mode, notifyUser = true) {
      this.currentDeviceMode = mode || 'auto';
      const resolved = mode === 'auto' ? this.detectHardwareDevice() : mode;
      this.effectiveDevice = resolved;

      document.body.classList.remove('device-auto', 'device-pc', 'device-mobile', 'device-tv');
      document.body.classList.add(`device-${resolved}`);

      const pills = document.querySelectorAll('.device-pill-btn');
      pills.forEach((btn) => {
        const isMatch = btn.getAttribute('data-device') === mode;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });

      if (resolved === 'tv') {
        // Ensure first visible focusable element gets focus ring if nothing is focused
        setTimeout(() => {
          if (!document.activeElement || document.activeElement === document.body) {
            const firstBtn = document.querySelector('#heroPlayNowBtn') || document.querySelector('.tv-focusable');
            if (firstBtn) this.focusElement(firstBtn);
          }
        }, 80);
      }

      if (notifyUser && window.StreamItApp && typeof window.StreamItApp.showToast === 'function') {
        const labels = {
          auto: 'מצב מכשיר: זיהוי אוטומטי חכם',
          pc: 'מצב תצוגה: מחשב (PC Cinema)',
          mobile: 'מצב תצוגה: סמארטפון (Android Touch)',
          tv: 'מצב סטרימר (Android TV 10-Foot UI + ניווט שלט D-Pad פעיל)'
        };
        window.StreamItApp.showToast(labels[mode] || labels.auto);
      }

      if (window.StreamItApp && typeof window.StreamItApp.saveDeviceMode === 'function' && notifyUser) {
        window.StreamItApp.saveDeviceMode(mode);
      }
    },

    setupDeviceSwitcher() {
      const pills = document.querySelectorAll('.device-pill-btn');
      pills.forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-device') || 'auto';
          this.applyDeviceMode(mode, true);
        });
      });

      const tvBarKbBtn = document.getElementById('tvBarKeyboardBtn');
      if (tvBarKbBtn) {
        tvBarKbBtn.addEventListener('click', () => this.openVirtualKeyboard());
      }
    },

    renderVirtualKeyboard() {
      const grid = document.getElementById('vkKeysGrid');
      if (!grid) return;

      const keys = this.vkLanguage === 'he' ? HEBREW_KEYS : ENGLISH_KEYS;
      grid.innerHTML = keys
        .map((key) => {
          const isLangSwitch = key === 'A-Z' || key === 'עב';
          const label = isLangSwitch
            ? 'החלף שפת מקלדת עברית או אנגלית'
            : `הקלד אות או תו ${key}`;
          return `<button type="button" class="vk-key-btn tv-focusable" data-vk-key="${key}" aria-label="${label}">${key}</button>`;
        })
        .join('');

      grid.querySelectorAll('.vk-key-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-vk-key');
          if (key === 'A-Z' || key === 'עב') {
            this.vkLanguage = this.vkLanguage === 'he' ? 'en' : 'he';
            this.renderVirtualKeyboard();
            const firstKey = grid.querySelector('.vk-key-btn');
            if (firstKey) this.focusElement(firstKey);
            return;
          }
          this.appendSearchChar(key);
        });
      });
    },

    bindVirtualKeyboardEvents() {
      const openBtn = document.getElementById('openVirtualKeyboardBtn');
      const closeBtn = document.getElementById('closeVkModalBtn');
      const spaceBtn = document.getElementById('vkSpaceBtn');
      const backBtn = document.getElementById('vkBackspaceBtn');
      const clearBtn = document.getElementById('vkClearBtn');
      const submitBtn = document.getElementById('vkSubmitBtn');
      const modal = document.getElementById('virtualKeyboardModal');

      if (openBtn) {
        openBtn.addEventListener('click', () => this.openVirtualKeyboard());
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeVirtualKeyboard());
      }
      if (spaceBtn) {
        spaceBtn.addEventListener('click', () => this.appendSearchChar(' '));
      }
      if (backBtn) {
        backBtn.addEventListener('click', () => this.backspaceSearchChar());
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearSearchQuery());
      }
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          this.closeVirtualKeyboard();
          const input = document.getElementById('globalSearchInput');
          if (input && window.StreamItApp) {
            window.StreamItApp.handleSearchInput(input.value);
          }
        });
      }
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeVirtualKeyboard();
        });
      }
    },

    openVirtualKeyboard() {
      const modal = document.getElementById('virtualKeyboardModal');
      if (!modal) return;
      this.lastFocusedBeforeModal = document.activeElement;
      modal.hidden = false;
      this.syncVkPreview();
      const firstKey = modal.querySelector('.vk-key-btn');
      if (firstKey) {
        setTimeout(() => this.focusElement(firstKey), 40);
      }
    },

    closeVirtualKeyboard() {
      const modal = document.getElementById('virtualKeyboardModal');
      if (!modal) return;
      modal.hidden = true;
      if (this.lastFocusedBeforeModal && typeof this.lastFocusedBeforeModal.focus === 'function') {
        this.focusElement(this.lastFocusedBeforeModal);
      }
    },

    appendSearchChar(ch) {
      const input = document.getElementById('globalSearchInput');
      if (!input) return;
      input.value = (input.value || '') + ch;
      this.syncVkPreview();
      if (window.StreamItApp) {
        window.StreamItApp.handleSearchInput(input.value);
      }
    },

    backspaceSearchChar() {
      const input = document.getElementById('globalSearchInput');
      if (!input) return;
      input.value = (input.value || '').slice(0, -1);
      this.syncVkPreview();
      if (window.StreamItApp) {
        window.StreamItApp.handleSearchInput(input.value);
      }
    },

    clearSearchQuery() {
      const input = document.getElementById('globalSearchInput');
      if (!input) return;
      input.value = '';
      this.syncVkPreview();
      if (window.StreamItApp) {
        window.StreamItApp.handleSearchInput('');
      }
    },

    syncVkPreview() {
      const input = document.getElementById('globalSearchInput');
      const preview = document.getElementById('vkPreviewText');
      if (!preview) return;
      const val = input ? input.value : '';
      preview.textContent = val || 'הקלד לחיפוש סרט, סדרה או ערוץ...';
    },

    getActiveScopeContainer() {
      const modalIds = ['virtualKeyboardModal', 'playerModal', 'addonsModal', 'detailsModal'];
      for (const id of modalIds) {
        const el = document.getElementById(id);
        if (el && !el.hidden) return el;
      }
      return document.body;
    },

    getFocusableElements(scope) {
      const container = scope || this.getActiveScopeContainer();
      const selector = [
        '.tv-focusable',
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        '[tabindex="0"]'
      ].join(',');

      const nodes = Array.from(container.querySelectorAll(selector));
      return nodes.filter((el) => {
        if (el.hidden || el.closest('[hidden]')) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 4 && rect.height > 4;
      });
    },

    focusElement(el) {
      if (!el) return;
      document.querySelectorAll('.tv-focused').forEach((node) => node.classList.remove('tv-focused'));
      el.classList.add('tv-focused');
      try {
        el.focus({ preventScroll: false });
      } catch (_) {
        el.focus();
      }
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch (_) {
        // Fallback if scrollIntoView options unsupported
      }
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

        // Weighted score prioritizing elements aligned along the axis of movement
        const score = primaryDist + orthogonalDist * 2.35;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = el;
        }
      }

      return bestCandidate;
    },

    bindSpatialKeydown() {
      window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isTextInput =
          (activeTag === 'input' &&
            !['range', 'button', 'submit', 'checkbox'].includes(document.activeElement.type)) ||
          activeTag === 'textarea';

        // Handle Escape / Android TV Back
        if (e.key === 'Escape' || e.key === 'BrowserBack') {
          const vkModal = document.getElementById('virtualKeyboardModal');
          if (vkModal && !vkModal.hidden) {
            e.preventDefault();
            this.closeVirtualKeyboard();
            return;
          }
          const inspector = document.getElementById('autoSubInspectorPanel');
          if (inspector && !inspector.hidden) {
            e.preventDefault();
            inspector.hidden = true;
            return;
          }
          const playerModal = document.getElementById('playerModal');
          if (playerModal && !playerModal.hidden && window.StreamItApp) {
            e.preventDefault();
            window.StreamItApp.closePlayer();
            return;
          }
          const addonsModal = document.getElementById('addonsModal');
          if (addonsModal && !addonsModal.hidden && window.StreamItApp) {
            e.preventDefault();
            window.StreamItApp.closeAddonsModal();
            return;
          }
          const detailsModal = document.getElementById('detailsModal');
          if (detailsModal && !detailsModal.hidden && window.StreamItApp) {
            e.preventDefault();
            window.StreamItApp.closeDetailsModal();
            return;
          }
        }

        // Player shortcuts when video player is open and not typing
        const playerModal = document.getElementById('playerModal');
        if (playerModal && !playerModal.hidden && !isTextInput && window.StreamItApp) {
          if (e.key === ' ' && activeTag !== 'button') {
            e.preventDefault();
            window.StreamItApp.togglePlayPause();
            return;
          }
        }

        // D-Pad Arrow Spatial Navigation
        const arrowMap = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right'
        };

        const dir = arrowMap[e.key];
        if (!dir) return;

        // Allow native cursor movement inside non-empty text inputs for Left/Right
        if (isTextInput && (dir === 'left' || dir === 'right') && document.activeElement.value) {
          return;
        }
        // Allow native range slider adjustments when focused on range input
        if (activeTag === 'input' && document.activeElement.type === 'range' && (dir === 'left' || dir === 'right')) {
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
