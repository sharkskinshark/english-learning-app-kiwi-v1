(function () {
  'use strict';

  const SHIELD_TEMPLATE = '<svg viewBox="0 0 100 118" aria-hidden="true" focusable="false">' +
    '<path class="goal-shield-outline" d="M12 10 H88 V55 C88 82 70 101 50 111 C30 101 12 82 12 55 Z"></path>' +
    '<path class="goal-shield-fill" d="M16 14 H84 V55 C84 78 68 94 50 104 C32 94 16 78 16 55 Z"></path>' +
    '<path class="goal-shield-pattern" d="M50 16 V101 M18 52 H82 M31 22 C38 30 38 41 29 48 M69 22 C62 30 62 41 71 48 M30 65 C38 72 39 83 31 91 M70 65 C62 72 61 83 69 91"></path>' +
    '<path class="goal-shield-mark" d="M30 59 L44 73 L72 42"></path>' +
    '</svg>';

  const SKILL_MESSAGES = [
    'Reading and Writing shields are growing.',
    'Listening shields are joining in.',
    'Speaking shields are almost complete.',
    'Full shields unlocked. Keep practicing.'
  ];

  const SHIELD_INTERVAL_MS = 310;
  const SHIELD_START_DELAY_MS = 520;
  const HOME_FADE_DELAY_MS = 2600;
  const FADE_MS = 520;
  const SAFETY_FALLBACK_MS = 20000;

  let timers = [];
  let started = false;
  let safetyTimer = null;
  let resizeFrame = null;
  let resizeObserver = null;

  function $(id) { return document.getElementById(id); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function clearTimers() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  }

  function fitOne(el, padding) {
    if (!el) return;
    el.style.setProperty('--goal-fit-scale', '1');
    const naturalW = el.offsetWidth;
    const naturalH = el.offsetHeight;
    if (!naturalW || !naturalH) return;
    const availW = Math.max(0, window.innerWidth - padding * 2);
    const availH = Math.max(0, window.innerHeight - padding * 2);
    const sx = availW / naturalW;
    const sy = availH / naturalH;
    const scale = Math.min(1, sx, sy);
    el.style.setProperty('--goal-fit-scale', scale.toFixed(3));
  }

  function fitToViewport() {
    fitOne(document.querySelector('.goal-intro-content'), 16);
    fitOne(document.querySelector('.goal-stage-inner'), 16);
  }

  function scheduleFit() {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(fitToViewport);
  }

  function buildShields() {
    $$('.goal-shield-strip').forEach((strip) => {
      strip.innerHTML = '';
      for (let i = 0; i < 5; i += 1) {
        const shield = document.createElement('div');
        shield.className = 'goal-shield';
        shield.innerHTML = SHIELD_TEMPLATE;
        strip.appendChild(shield);
      }
    });
  }

  function resetAnimation() {
    clearTimers();
    const score = $('goalShieldCount');
    const message = $('goalEncourageText');
    const kiwiFamily = $('goalKiwiFamily');
    const confetti = $('goalConfetti');
    if (score) score.textContent = '0';
    if (message) message.textContent = 'Every practice round fills another shield.';
    if (kiwiFamily) kiwiFamily.classList.remove('is-complete');
    if (confetti) confetti.innerHTML = '';
    $$('.goal-shield').forEach((shield) => shield.classList.remove('is-earned'));
  }

  function launchConfetti() {
    const confetti = $('goalConfetti');
    if (!confetti) return;
    const colors = ['#f7c948', '#77b255', '#5f8fd8', '#df6f68'];
    confetti.innerHTML = '';
    for (let i = 0; i < 42; i += 1) {
      const piece = document.createElement('span');
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.42) + 's';
      piece.style.transform = 'rotate(' + (Math.random() * 160) + 'deg)';
      confetti.appendChild(piece);
    }
  }

  function disposeFitWatchers() {
    window.removeEventListener('resize', scheduleFit);
    window.removeEventListener('orientationchange', scheduleFit);
    if (resizeObserver) {
      try { resizeObserver.disconnect(); } catch (e) {}
      resizeObserver = null;
    }
    if (resizeFrame) {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = null;
    }
  }

  function exitToMainApp() {
    if (safetyTimer) {
      window.clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    disposeFitWatchers();
    document.body.classList.remove('goal-animation-active');
    document.body.classList.add('goal-flow-fading');
    timers.push(window.setTimeout(() => {
      document.body.classList.remove('goal-flow-active', 'goal-flow-fading');
      const intro = $('goalIntroScreen');
      const stage = $('goalAnimationStage');
      if (intro) intro.hidden = true;
      if (stage) stage.hidden = true;
      window.dispatchEvent(new CustomEvent('goalIntro:done'));
    }, FADE_MS));
  }

  function playAnimation() {
    resetAnimation();
    document.body.classList.add('goal-animation-active');
    const score = $('goalShieldCount');
    const message = $('goalEncourageText');
    const kiwiFamily = $('goalKiwiFamily');
    const shields = $$('.goal-shield');

    shields.forEach((shield, index) => {
      timers.push(window.setTimeout(() => {
        shield.classList.add('is-earned');
        if (score) score.textContent = String(index + 1);
        if (message) {
          if (index < 5) message.textContent = SKILL_MESSAGES[0];
          else if (index < 10) message.textContent = SKILL_MESSAGES[1];
          else if (index < 14) message.textContent = SKILL_MESSAGES[2];
        }
        if (index === shields.length - 1) {
          if (message) message.textContent = SKILL_MESSAGES[3];
          if (kiwiFamily) kiwiFamily.classList.add('is-complete');
          launchConfetti();
          timers.push(window.setTimeout(exitToMainApp, HOME_FADE_DELAY_MS));
        }
      }, SHIELD_START_DELAY_MS + index * SHIELD_INTERVAL_MS));
    });
  }

  function startFlow() {
    if (started) return;
    started = true;
    const intro = $('goalIntroScreen');
    if (intro) intro.classList.add('is-exiting');
    timers.push(window.setTimeout(() => {
      if (intro) intro.hidden = true;
      scheduleFit();
      playAnimation();
    }, FADE_MS));
  }

  function abortToMainApp() {
    clearTimers();
    disposeFitWatchers();
    document.body.classList.remove('goal-flow-active', 'goal-animation-active', 'goal-flow-fading');
    const intro = $('goalIntroScreen');
    const stage = $('goalAnimationStage');
    if (intro) intro.hidden = true;
    if (stage) stage.hidden = true;
  }

  function init() {
    try {
      buildShields();
      const crest = $('goalCrestButton');
      if (!crest) {
        abortToMainApp();
        return;
      }
      crest.addEventListener('click', startFlow);
      crest.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startFlow();
        }
      });
      try { crest.focus({ preventScroll: true }); } catch (e) {}

      fitToViewport();
      window.requestAnimationFrame(fitToViewport);
      window.addEventListener('resize', scheduleFit);
      window.addEventListener('orientationchange', scheduleFit);
      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(scheduleFit);
        const introContent = document.querySelector('.goal-intro-content');
        const stageInner = document.querySelector('.goal-stage-inner');
        if (introContent) resizeObserver.observe(introContent);
        if (stageInner) resizeObserver.observe(stageInner);
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleFit).catch(() => {});
      }

      safetyTimer = window.setTimeout(abortToMainApp, SAFETY_FALLBACK_MS);
    } catch (err) {
      console.error('[goal-intro] init failed', err);
      abortToMainApp();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
