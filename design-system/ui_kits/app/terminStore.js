// Wirtschaftln — Termin store: lifecycle state, place search (Google mock),
// Hoibe reference price (Augustiner Stüberl), calendar (.ics) export.
(function () {
  // Reference price for a Hoibe — always the Augustiner Stüberl price.
  const HOIBE_PREIS = 3.80;

  // Mocked "Google" place results for the Wirtshaus address search.
  const PLACES = [
    { id:'p1', name:'Wirtshaus am Hart',        adresse:'Lerchenauer Str. 271, 80935 München', bezirk:'Am Hart',        x:44, y:22 },
    { id:'p2', name:'Augustiner Stüberl',       adresse:'Landsberger Str. 19, 80339 München',  bezirk:'Schwanthalerhöhe', x:26, y:52 },
    { id:'p3', name:'Hofbräukeller am Wiener Platz', adresse:'Innere Wiener Str. 19, 81667 München', bezirk:'Haidhausen', x:64, y:54 },
    { id:'p4', name:'Der Pschorr',              adresse:'Viktualienmarkt 15, 80331 München',   bezirk:'Altstadt',       x:50, y:52 },
    { id:'p5', name:'Paulaner Bräuhaus',        adresse:'Kapuzinerplatz 5, 80337 München',     bezirk:'Isarvorstadt',   x:48, y:64 },
    { id:'p6', name:'Wirtshaus zum Isartal',    adresse:'Brudermühlstr. 2, 81371 München',     bezirk:'Sendling',       x:42, y:74 },
    { id:'p7', name:'Sankt Emmeramsmühle',      adresse:'Emmeramstr. 41, 81925 München',       bezirk:'Bogenhausen',    x:74, y:34 },
  ];

  // The current upcoming Termin. Phases:
  //  'planung'      — planner set, no Wirtshaus yet  → "organisiert von X"
  //  'reserviert'   — Wirtshaus chosen, reserved      → calendar, voting open
  //  'heute'        — meeting day, registration closed → close the visit
  //  'abgeschlossen'— visit logged, archived + on map
  const INITIAL = {
    phase: 'planung',
    datum: 'Donnerstag, 11. Juli 2026',
    zeit: '19:00',
    planerId: 'resi',
    planer: 'Resi Gruber',
    wirtshaus: null, // { name, adresse, bezirk, x, y }
  };

  function pad(n){ return String(n).padStart(2,'0'); }
  function makeICS(termin) {
    const w = termin.wirtshaus || { name:'Wirtshaus folgt', adresse:'München' };
    // fixed demo date 2026-07-11 19:00–23:00 local
    const dtStart = '20260711T190000';
    const dtEnd   = '20260711T230000';
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wirtschaftln//Stammtisch//DE','CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@wirtschaftln.de',
      'DTSTAMP:' + dtStart,
      'DTSTART:' + dtStart,
      'DTEND:' + dtEnd,
      'SUMMARY:🍺 Stammtisch – ' + w.name,
      'LOCATION:' + (w.adresse || '').replace(/,/g, '\\,'),
      'DESCRIPTION:Wirtschaftln Stammtisch. Organisiert von ' + termin.planer + '.',
      'END:VEVENT','END:VCALENDAR',
    ];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
  }

  window.WNTermin = { HOIBE_PREIS, PLACES, INITIAL, makeICS };
})();
