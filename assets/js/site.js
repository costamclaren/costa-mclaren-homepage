/* Costa & McLaren - Seitenlogik
   Kein Framework, kein externes Skript, keine Tracker. */
(function () {
  'use strict';

  var header = document.querySelector('.header');
  if (!header) return;

  /* Gemeinsame Seiten übernehmen den Bereich aus dem internen Verweis.
     Direkte Aufrufe bleiben neutral; Fachseiten bestimmen ihren Bereich selbst. */
  var bereich = document.body.getAttribute('data-kundenbereich');
  var menueDaten = document.getElementById('cm-kundenmenues');
  if (bereich === 'neutral' && menueDaten) {
    var angefragt = new URLSearchParams(window.location.search).get('bereich');
    if (angefragt === 'gewerbe' || angefragt === 'privat') {
      try {
        var menues = JSON.parse(menueDaten.textContent);
        var auswahl = menues[angefragt];
        if (auswahl) {
          header.querySelector('.nav').innerHTML = auswahl.navigation;
          var fussNavigation = document.querySelector('nav[aria-labelledby="fn-1"]');
          if (fussNavigation) fussNavigation.innerHTML = auswahl.footer;
          bereich = angefragt;
          document.body.setAttribute('data-kundenbereich', bereich);
        }
      } catch (fehler) { /* Die statische neutrale Navigation bleibt benutzbar. */ }
    }
  }
  if (bereich === 'gewerbe' || bereich === 'privat') {
    var gemeinsameSeiten = ['kontakt', 'ueber-uns', 'impressum', 'datenschutz', 'erstinformation'];
    document.querySelectorAll('a[href]').forEach(function (link) {
      var ziel = link.getAttribute('href');
      var datei = ziel.split(/[?#]/)[0];
      var name = datei.replace(/^\//, '').replace(/\.html$/, '');
      if (gemeinsameSeiten.indexOf(name) === -1) return;
      var url = new URL(ziel, window.location.href);
      url.searchParams.set('bereich', bereich);
      link.setAttribute('href', datei + url.search + url.hash);
    });
  }

  var burger  = header.querySelector('.burger');
  var nav     = header.querySelector('.nav');
  var trigger = header.querySelector('[data-flyout-trigger]');
  var flyout  = document.getElementById('leistungs-menue');

  /* ---------------------------------------------------- Leistungs-Flyout */
  function flyoutSetzen(offen) {
    if (!trigger || !flyout) return;
    trigger.setAttribute('aria-expanded', String(offen));
    flyout.hidden = !offen;
  }

  if (trigger && flyout) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      flyoutSetzen(trigger.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('click', function (e) {
      if (flyout.hidden) return;
      if (flyout.contains(e.target) || trigger.contains(e.target)) return;
      flyoutSetzen(false);
    });

    flyout.addEventListener('focusout', function (e) {
      if (flyout.hidden) return;
      if (e.relatedTarget && (flyout.contains(e.relatedTarget) || trigger.contains(e.relatedTarget))) return;
      flyoutSetzen(false);
    });
  }

  /* --------------------------------------------------------- Mobile-Menue */
  function menueSetzen(offen) {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', String(offen));
    nav.classList.toggle('ist-offen', offen);
    burger.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      menueSetzen(burger.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && window.matchMedia('(max-width: 900px)').matches) menueSetzen(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (flyout && !flyout.hidden) { flyoutSetzen(false); if (trigger) trigger.focus(); return; }
    if (nav && nav.classList.contains('ist-offen')) { menueSetzen(false); if (burger) burger.focus(); }
  });

  /* Beim Wechsel auf Desktop aufraeumen */
  var breit = window.matchMedia('(min-width: 901px)');
  (breit.addEventListener ? breit.addEventListener.bind(breit, 'change') : breit.addListener.bind(breit))(function () {
    menueSetzen(false);
  });

  /* ------------------------------------------------------------ Formular */
  /* Versand über Web3Forms: die Anfrage kommt als E-Mail an info@costa-mclaren.de.
     Der Access Key ist für den Einsatz im Browser gedacht und kein Geheimnis.
     Ohne Key läuft lokal ein Vorführmodus ohne Mailversand. */
  var ENDPUNKT   = 'https://api.web3forms.com/submit';
  var ACCESS_KEY = '09e139ff-6831-478b-b3d2-e929e9b24381';
  var vorfuehren = !ACCESS_KEY && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  Array.prototype.forEach.call(document.querySelectorAll('[data-kontaktformular]'), function (form) {
    form.setAttribute('action', ENDPUNKT);

    var status  = form.querySelector('.formular__status');
    var knopf   = form.querySelector('button[type="submit"]');
    var zeit    = form.querySelector('input[name="gestartet"]');
    var gesetzt = false;

    /* Zeitstempel erst bei der ersten echten Eingabe setzen */
    function startZaehlen() {
      if (gesetzt || !zeit) return;
      zeit.value = String(Date.now());
      gesetzt = true;
    }
    form.addEventListener('focusin', startZaehlen, { once: false });
    form.addEventListener('input', startZaehlen, { once: false });

    function melden(text, istFehler) {
      if (!status) return;
      status.textContent = text;
      status.classList.toggle('formular__status--fehler', !!istFehler);
      status.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      if (!window.fetch) return;           /* ohne fetch: normaler POST an Web3Forms */
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        melden('Bitte füllen Sie Name, E-Mail und die Einwilligung aus.', true);
        return;
      }

      /* Bot-Schutz: ausgefülltes Lockfeld oder Absenden unter 3 Sekunden.
         Die Anfrage wird still verworfen, der Bot sieht eine normale Bestätigung. */
      var lockfeld = form.querySelector('[name="website"]');
      var start = Number(zeit && zeit.value) || 0;
      var istBot = (lockfeld && lockfeld.value) || !start || Date.now() - start < 3000;

      var feld = function (name) { var el = form.elements[name]; return el ? String(el.value || '').trim() : ''; };
      var einwilligungText = form.querySelector('.einwilligung span');
      var daten = {
        access_key: ACCESS_KEY,
        subject: 'Neue Anfrage über costa-mclaren.de (' + (feld('quelle') || 'Website') + ')',
        from_name: 'Website costa-mclaren.de',
        replyto: feld('email'),
        Name: feld('name'),
        Unternehmen: feld('unternehmen') || '–',
        'E-Mail': feld('email'),
        Telefon: feld('telefon') || '–',
        Anliegen: feld('nachricht') || '–',
        'Rückmeldung gewünscht per': feld('praeferenz'),
        Ausgangsseite: location.pathname,
        Einwilligung: 'Erteilt: ' + (einwilligungText ? einwilligungText.textContent.trim() : '')
      };

      knopf.setAttribute('aria-disabled', 'true');
      melden('Wird gesendet …', false);

      var anfrage = (istBot || vorfuehren)
        ? new Promise(function (ok) { setTimeout(function () { ok({ success: true }); }, 600); })
        : fetch(ENDPUNKT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(daten)
          }).then(function (r) { return r.json().catch(function () { return { success: false }; }); });

      anfrage
        .then(function (antwort) {
          if (!antwort || antwort.success !== true) throw new Error('Versand fehlgeschlagen');
          if (vorfuehren) console.info('Vorführmodus: keine Mail gesendet', daten);
          var danke = document.createElement('div');
          danke.className = 'formular__danke';
          danke.setAttribute('role', 'status');
          danke.innerHTML = '<h3>Vielen Dank.</h3>' +
            '<p>Ihre Anfrage ist bei uns eingegangen. Wir melden uns innerhalb eines Arbeitstages zurück.</p>' +
            '<p>Wenn es eilig ist, erreichen Sie uns unter <a href="tel:+49218168717">02181 68717</a>.</p>';
          form.replaceWith(danke);
          danke.focus && danke.focus();
        })
        .catch(function (fehler) {
          knopf.removeAttribute('aria-disabled');
          melden(
            'Das Senden hat nicht geklappt. Bitte schreiben Sie uns an info@costa-mclaren.de oder rufen Sie an unter 02181 68717.',
            true
          );
        });
    });
  });

  /* ------------------------------------------------------------- Reveals */
  var sanft = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ziele = document.querySelectorAll('.reveal');

  if (sanft || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(ziele, function (el) { el.classList.add('ist-da'); });
    return;
  }

  var beobachter = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (eintrag) {
      if (!eintrag.isIntersecting) return;
      eintrag.target.classList.add('ist-da');
      beobachter.unobserve(eintrag.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  Array.prototype.forEach.call(ziele, function (el, i) {
    el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
    beobachter.observe(el);
  });
})();
