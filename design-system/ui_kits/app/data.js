// Wirtschaftln — mock data for the UI kit (window global, not a module)
window.WN_DATA = {
  saison: 'Saison 9 · Frühjahr 2026',
  members: [
    { id: 'sepp', name: 'Sepp Brunner',  photo: 'https://i.pravatar.cc/200?img=12', amt: null,           abende: 38, mass: 128, wirtshaeuser: 9, ring: true,  vote: 'zu', streak: 6, bestStreak: 8, organisiert: 5, runden: 3, taxi: 2, schweinsbraten: 7 },
    { id: 'resi', name: 'Resi Gruber',   photo: 'https://i.pravatar.cc/200?img=45', amt: 'Kassenwartin', abende: 34, mass: 96,  wirtshaeuser: 9, ring: true,  vote: 'zu', me: true, streak: 4, bestStreak: 6, organisiert: 8, runden: 2, taxi: 1, schweinsbraten: 3 },
    { id: 'hans', name: 'Hans Huber',    photo: 'https://i.pravatar.cc/200?img=33', amt: null,           abende: 30, mass: 88,  wirtshaeuser: 8, ring: false, vote: 'vielleicht', streak: 2, bestStreak: 4, organisiert: 2, runden: 1, taxi: 5, schweinsbraten: 4 },
    { id: 'toni', name: 'Toni Wimmer',   photo: 'https://i.pravatar.cc/200?img=8',  amt: null,           abende: 27, mass: 81,  wirtshaeuser: 8, ring: false, vote: 'ab', streak: -2, bestStreak: 3, organisiert: 1, runden: 0, taxi: 0, schweinsbraten: 9 },
    { id: 'vroni', name: 'Vroni Maier',  photo: 'https://i.pravatar.cc/200?img=26', amt: null,           abende: 25, mass: 74,  wirtshaeuser: 7, ring: false, vote: 'zu', streak: 3, bestStreak: 5, organisiert: 2, runden: 4, taxi: 3, schweinsbraten: 2 },
    { id: 'flo', name: 'Florian Egger',  photo: 'https://i.pravatar.cc/200?img=15', amt: 'Schriftführer',abende: 24, mass: 70,  wirtshaeuser: 7, ring: true,  vote: 'zu', streak: 5, bestStreak: 7, organisiert: 4, runden: 1, taxi: 1, schweinsbraten: 5 },
    { id: 'kathi', name: 'Kathi Lang',   photo: 'https://i.pravatar.cc/200?img=49', amt: null,           abende: 19, mass: 52,  wirtshaeuser: 6, ring: false, vote: 'vielleicht', streak: 2, bestStreak: 3, organisiert: 1, runden: 0, taxi: 0, schweinsbraten: 1 },
    { id: 'bene', name: 'Benedikt Stadler', photo:'https://i.pravatar.cc/200?img=53', amt: null,        abende: 14, mass: 41,  wirtshaeuser: 5, ring: false, vote: 'zu', streak: -3, bestStreak: 2, organisiert: 0, runden: 1, taxi: 4, schweinsbraten: 2 },
    { id: 'lena', name: 'Lena Voss',     photo: 'https://i.pravatar.cc/200?img=20', amt: null,           abende: 11, mass: 33,  wirtshaeuser: 5, ring: false, vote: 'zu', streak: 1, bestStreak: 2, organisiert: 0, runden: 0, taxi: 6, schweinsbraten: 0 },
  ],
  // Munich taverns — never the same twice
  taverns: [
    { id: 't1', name: 'Augustiner-Keller',   bezirk: 'Maxvorstadt',  rating: 4.7, kaiser: 4.6, brodn: 4.8, organisator: 'Sepp Brunner',   besuchtAm: '11. Apr 2026', x: 38, y: 40, photo: 'https://images.unsplash.com/photo-1571805618149-c5a3ffc8e2f2?w=600&q=70' },
    { id: 't2', name: 'Wirtshaus in der Au',  bezirk: 'Au-Haidhausen',rating: 4.5, kaiser: 4.9, brodn: 4.4, organisator: 'Resi Gruber',    besuchtAm: '28. Mär 2026', x: 62, y: 58, photo: 'https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=600&q=70' },
    { id: 't3', name: 'Löwenbräukeller',      bezirk: 'Maxvorstadt',  rating: 4.2, kaiser: 3.8, brodn: 4.1, organisator: 'Hans Huber',     besuchtAm: '14. Mär 2026', x: 30, y: 48, photo: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=70' },
    { id: 't4', name: 'Zum Flaucher',         bezirk: 'Isarvorstadt', rating: 4.8, kaiser: 4.7, brodn: 4.9, organisator: 'Florian Egger',  besuchtAm: '29. Feb 2026', x: 52, y: 72, photo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=70' },
    { id: 't5', name: 'Hofbräuhaus',          bezirk: 'Altstadt',     rating: 3.9, kaiser: 3.2, brodn: 3.6, organisator: 'Toni Wimmer',    besuchtAm: '15. Feb 2026', x: 50, y: 50, photo: 'https://images.unsplash.com/photo-1546622891-02c72c1537b6?w=600&q=70' },
    { id: 't6', name: 'Paulaner am Nockherberg', bezirk:'Au',         rating: 4.4, kaiser: 4.3, brodn: 4.5, organisator: 'Vroni Maier',    besuchtAm: '01. Feb 2026', x: 60, y: 66, photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70' },
    // upcoming
    { id: 't7', name: 'Wirtshaus am Hart',    bezirk: 'Am Hart',      rating: 0,   besuchtAm: null, naechstes: true, x: 44, y: 22, photo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=70' },
  ],
  kasse: {
    saldo: 184.50,
    entries: [
      { id:'k1', member:'toni', name:'Toni Wimmer', photo:'https://i.pravatar.cc/200?img=8',  grund:'Zugesagt & nicht erschienen', betrag:-10, datum:'11. Apr', paid:false },
      { id:'k2', member:'hans', name:'Hans Huber',  photo:'https://i.pravatar.cc/200?img=33', grund:'Zu spät — über 30 min',       betrag:-5,  datum:'11. Apr', paid:false },
      { id:'k3', member:'resi', name:'Resi Gruber', photo:'https://i.pravatar.cc/200?img=45', grund:'Strafe beglichen',            betrag:10,  datum:'12. Apr', paid:true  },
      { id:'k4', member:'vroni',name:'Vroni Maier', photo:'https://i.pravatar.cc/200?img=26', grund:'Runde geschmissen 🍻',         betrag:24,  datum:'28. Mär', paid:true  },
      { id:'k5', member:'sepp', name:'Sepp Brunner',photo:'https://i.pravatar.cc/200?img=12', grund:'Falsches Wirtshaus vorgeschlagen', betrag:-3, datum:'14. Mär', paid:true },
    ],
  },
  naechster: {
    wirtshaus: 'Wirtshaus am Hart',
    bezirk: 'Am Hart',
    datum: 'Donnerstag, 11. Juli',
    zeit: '19:00',
    planer: 'Resi Gruber',
    zugesagt: 5, vielleicht: 2, abgesagt: 1,
  },
  aemter: [
    { title:'Bierwart',     holder:'Sepp Brunner',  icon:'🍺' },
    { title:'Kassenwartin', holder:'Resi Gruber',   icon:'💰' },
    { title:'Spätzünder',   holder:'Toni Wimmer',   icon:'🐌' },
    { title:'Schriftführer',holder:'Florian Egger', icon:'✒️' },
  ],
};
