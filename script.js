/* ==========================================================================
   Save the Date — interaction
   Vanilla JS, no dependencies. All the movement lives in styles.css; this
   file only steps through the states by adding classes to #stage:

     (start)        front of the envelope showing
     is-flipped     envelope turns over, wax seal showing
     is-opening     seal breaks, flap swings open
     is-flap-open   flap tucked behind, letter slides up
     is-letter-out  letter comes forward and rests  (done)

   Step timings are read from the CSS custom properties (--dur-*), so the
   pacing is defined in one place. Under prefers-reduced-motion they're 0ms
   and each step happens instantly.
   ========================================================================== */

(function () {
  'use strict';

  var stage      = document.getElementById('stage');
  var flipBtn    = document.getElementById('flipBtn');
  var sealBtn    = document.getElementById('sealBtn');
  var back       = document.getElementById('back');
  var letter     = document.getElementById('letter');
  var letterCard = document.getElementById('letterCard');
  var hint       = document.getElementById('hint');

  // Simple state guard so repeated / double taps can't restart a step
  var state = 'closed'; // closed → flipped → opening → open

  /* --- Helpers ----------------------------------------------------------- */

  // Read a CSS timing token like "--dur-flip: 1000ms" as a number of ms
  function cssMs(name) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name);
    var ms = parseFloat(value);
    return isNaN(ms) ? 0 : ms;
  }

  // Run fn after ms (immediately-ish when ms is 0, e.g. reduced motion)
  function after(ms, fn) {
    window.setTimeout(fn, ms);
  }

  // Move focus without the browser scrolling anything into view
  function focusQuietly(el) {
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      el.focus(); // very old browsers don't accept the options object
    }
  }

  function setHint(text) {
    hint.textContent = text;
  }

  /* --- Step 1: flip the envelope ----------------------------------------- */

  function flip() {
    if (state !== 'closed') return;
    state = 'flipped';

    stage.classList.add('is-flipped');
    setHint('Tap the wax seal');

    // Once the back is facing us, put keyboard focus on the seal
    after(cssMs('--dur-flip'), function () {
      focusQuietly(sealBtn);
    });
  }

  /* --- Step 2: break the seal and take out the letter -------------------- */

  function open() {
    if (state !== 'flipped') return;
    state = 'opening';

    hint.classList.add('is-hidden');

    // a) seal breaks, flap swings open, scene eases down
    stage.classList.add('is-opening');

    // b) flap is fully open → tuck it behind and slide the letter up
    after(cssMs('--delay-flap') + cssMs('--dur-flap'), function () {
      stage.classList.add('is-flap-open');

      // c) letter has cleared the pocket → bring it forward to rest
      after(cssMs('--dur-rise'), function () {
        stage.classList.add('is-letter-out');
        letter.removeAttribute('aria-hidden');

        // d) finished: focus the card so screen readers read the details
        after(cssMs('--dur-settle'), function () {
          state = 'open';
          focusQuietly(letterCard);
        });
      });
    });
  }

  /* --- Wire up events ---------------------------------------------------- */

  // Buttons respond to taps, clicks, Enter and Space automatically.
  flipBtn.addEventListener('click', flip);

  // The seal is the obvious target, but a tap anywhere on the back of the
  // envelope also opens it — kinder for guests who miss the seal slightly.
  // (Clicks on the seal button bubble up to here too.)
  back.addEventListener('click', open);

  /* --- Fallback for browsers without dvh units --------------------------- */
  // Older mobile browsers only know 100vh, which on iOS includes the area
  // behind the toolbars. Use the real inner height in pixels instead.
  if (!(window.CSS && CSS.supports && CSS.supports('height', '100dvh'))) {
    var setAppHeight = function () {
      document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px');
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
  }

  /* --- Decorative fireflies ---------------------------------------------- */
  // A handful of slow, glowing motes drifting over the garden. Skipped
  // entirely for reduced motion (also hidden in CSS).
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    var motes = document.querySelector('.motes');
    var variants = ['', ' b', ' c'];
    for (var i = 0; i < 14; i++) {
      var m = document.createElement('span');
      m.className = 'mote' + variants[i % 3];
      m.style.left = (Math.random() * 100).toFixed(1) + '%';
      m.style.top = (20 + Math.random() * 75).toFixed(1) + '%';
      var duration = 10 + Math.random() * 8;                 // 10–18s
      m.style.animationDuration = duration.toFixed(1) + 's';
      m.style.animationDelay = (-Math.random() * duration).toFixed(1) + 's'; // start mid-drift
      var size = 4 + Math.random() * 5;                      // 4–9px
      m.style.width = m.style.height = size.toFixed(1) + 'px';
      motes.appendChild(m);
    }
  }
})();
