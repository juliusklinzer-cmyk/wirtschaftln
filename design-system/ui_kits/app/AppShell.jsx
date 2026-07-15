// Wirtschaftln — App shell (uses PhoneFrame; app bar + bottom tabs)
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { Avatar, IconButton, Button } = DS;
  const Icon = window.WNIcon;
  const PhoneFrame = window.PhoneFrame;
  const data = window.WN_DATA;

  const TABS = [
    { key:'home', label:'Hoam',      icon:'home',     screen:'HomeScreen' },
    { key:'termin', label:'Termin',  icon:'calendar', screen:'TerminScreen' },
    { key:'karte', label:'Archiv',   icon:'map',      screen:'WirtshausScreen' },
    { key:'rang', label:'Spezln',    icon:'users',    screen:'RanglisteScreen' },
    { key:'kasse', label:'Kasse',    icon:'beer',     screen:'KasseScreen' },
  ];
  const TITLES = { home:'', termin:'Termin & Abstimmung', karte:'Archiv', rang:'Spezln', kasse:'Vereinskasse' };

  function AppShell({ onLogout }) {
    const [tab, setTab] = React.useState('home');
    const [menu, setMenu] = React.useState(false);
    const [termin, setTermin] = React.useState(window.WNTermin.INITIAL);
    const [taverns, setTaverns] = React.useState(data.taverns);
    const [kasse, setKasse] = React.useState(data.kasse.entries);
    const [saldo, setSaldo] = React.useState(data.kasse.saldo);
    const [sheet, setSheet] = React.useState(null);
    const [toastMsg, setToastMsg] = React.useState(null);
    const toastTimer = React.useRef(null);

    function toast(msg) {
      setToastMsg(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(()=>setToastMsg(null), 2600);
    }
    const TAVERN_PHOTOS = [
      'https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=600&q=70',
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=70',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=70',
    ];
    const store = {
      termin, setTermin, taverns, kasse, saldo,
      openSheet: (node)=>setSheet(node), closeSheet: ()=>setSheet(null), toast,
      addPenalty: (entry)=>setKasse(k=>[entry, ...k]),
      updatePenalty: (id, patch)=>setKasse(k=>k.map(e=>e.id===id?{...e, ...patch}:e)),
      activateTavern: (t)=>setTaverns(list=>[{ id:'t'+Date.now(), photo:TAVERN_PHOTOS[list.length % TAVERN_PHOTOS.length], besuchtAm:'heute', rating:t.rating, kaiser:t.kaiser||0, brodn:t.brodn||0, ...t }, ...list]),
      jumpPhase: (phase)=>{
        if (phase === 'planung') setTermin({ ...window.WNTermin.INITIAL });
        else if (phase === 'heute') setTermin(prev => ({
          ...prev,
          wirtshaus: prev.wirtshaus || { name:'Der Pschorr', adresse:'Viktualienmarkt 15, 80331 München', bezirk:'Altstadt', x:50, y:52 },
          phase:'heute', visit:null,
        }));
        setTab('termin');
      },
      reportMember: ()=>setSheet(
        <window.WNSheets.MeldenSheet members={data.members.filter(m=>!m.me)} onClose={()=>setSheet(null)} onSubmit={(r)=>{
          setKasse(k=>[{ id:'m'+Date.now(), name:r.name, photo:r.photo, grund:r.vorwurf, betrag:-Math.abs(r.betrag), datum:'heute', status:'offen', gemeldet:true }, ...k]);
          setSheet(null); toast('💸 PayPal-Link & E-Mail an ' + r.name.split(' ')[0] + ' gesendet');
        }} />
      ),
      openForderung: (entry)=>setSheet(
        <window.WNSheets.ForderungDialog entry={entry} onClose={()=>setSheet(null)} onStatus={(status)=>{
          setKasse(k=>k.map(e=>e.id===entry.id?{...e, status, paid: status==='beglichen'}:e));
          setSheet(null);
          const txt = { beglichen:'✓ Als beglichen markiert', offen:'○ Bleibt offen', aufgehoben:'✕ Forderung aufgehoben' }[status];
          toast(txt);
        }} />
      ),
      addAusgabe: ()=>setSheet(
        <window.WNSheets.AusgabeSheet saldo={saldo} onClose={()=>setSheet(null)} onSubmit={(a)=>{
          setKasse(k=>[{ id:'a'+Date.now(), name:a.kategorie, grund:a.grund, betrag:-Math.abs(a.betrag), datum:'heute', kind:'ausgabe', icon:a.icon }, ...k]);
          setSaldo(s=>s-Math.abs(a.betrag));
          setSheet(null); toast('🧾 Ausgabe gebucht · ' + a.betrag.toFixed(2).replace('.',',') + ' €');
        }} />
      ),
    };

    const profile = window.WNAuth.getProfile();
    const me = data.members.find(m=>m.me);
    // Prefer the registered applicant's photo/name if present
    const myPhoto = (profile && profile.photo) || me.photo;
    const myName = (profile && (profile.spitzname || profile.vorname)) || me.name;
    const ScreenComp = window[TABS.find(t=>t.key===tab).screen];

    return (
      <PhoneFrame statusColor="var(--ink-900)">
        {/* app bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 16px 12px', flex:'none', borderBottom:'1px solid var(--ink-100)', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="../../assets/wirtschaftln-logo-1.png" alt="" style={{ height:34 }} />
            <div>
              {tab==='home'
                ? <><div style={{ fontFamily:'var(--font-fraktur)', fontSize:22, color:'var(--navy)', lineHeight:1 }}>Wirtschaftln</div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold-700)' }}>{data.saison}</div></>
                : <div style={{ fontSize:18, fontWeight:800, color:'var(--ink-900)' }}>{TITLES[tab]}</div>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <IconButton label="Benachrichtigungen" variant="ghost"><Icon name="bell" size={20} /></IconButton>
            <button onClick={()=>setMenu(m=>!m)} style={{ border:'none', background:'transparent', padding:0, cursor:'pointer' }}>
              <Avatar src={myPhoto} name={myName} size={36} ring />
            </button>
          </div>

          {/* profile menu */}
          {menu && (
            <>
              <div onClick={()=>setMenu(false)} style={{ position:'fixed', inset:0, zIndex:30 }}></div>
              <div style={{ position:'absolute', top:54, right:16, zIndex:31, width:210, background:'var(--weiss)', borderRadius:'var(--r-lg)', boxShadow:'var(--sh-lg)', border:'1px solid var(--ink-100)', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:14, background:'var(--pergament)' }}>
                  <Avatar src={myPhoto} name={myName} size={40} ring />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'var(--ink-900)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{myName}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--gold-700)' }}>{profile ? 'Antrag läuft' : 'Mitglied'}</div>
                  </div>
                </div>
                <button onClick={onLogout} style={{ width:'100%', textAlign:'left', border:'none', background:'transparent', cursor:'pointer', padding:'13px 14px', fontFamily:'var(--font-ui)', fontSize:14, fontWeight:700, color:'var(--strafe)' }}>
                  Abmelden
                </button>
              </div>
            </>
          )}
        </div>

        {/* DEMO phase-jump strip — remove for production */}
        {(() => {
          const ph = termin.phase;
          const onPlan = ph === 'planung' || ph === 'reserviert';
          const Pill = ({ active, label, onClick }) => (
            <button onClick={onClick} style={{
              flex:1, border:'none', cursor:'pointer', borderRadius:'var(--r-pill)', padding:'6px 10px',
              fontFamily:'var(--font-ui)', fontWeight:800, fontSize:12, letterSpacing:'0.02em',
              color: active ? 'var(--navy-900)' : 'var(--pergament)',
              background: active ? 'var(--grad-gold)' : 'transparent',
              boxShadow: active ? 'var(--sh-xs)' : 'none', transition:'all var(--dur-base) var(--ease-standard)',
            }}>{label}</button>
          );
          return (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'var(--navy-900)' }}>
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', flex:'none' }}>Demo</span>
              <div style={{ flex:1, display:'flex', gap:4, background:'rgba(255,255,255,0.08)', borderRadius:'var(--r-pill)', padding:3 }}>
                <Pill active={onPlan} label="Geplant" onClick={()=>store.jumpPhase('planung')} />
                <Pill active={ph==='heute'} label="Tag des Treffens" onClick={()=>store.jumpPhase('heute')} />
              </div>
            </div>
          );
        })()}

        {/* scrollable screen */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', position:'relative' }}>
          <ScreenComp data={data} store={store} onNav={setTab} />
        </div>

        {/* bottom tab bar */}
        <div style={{ flex:'none', display:'flex', background:'var(--weiss)', borderTop:'1px solid var(--ink-100)', padding:'8px 6px 22px', boxShadow:'0 -4px 20px rgba(12,43,90,0.06)' }}>
          {TABS.map(t=>{
            const active = t.key===tab;
            return (
              <button key={t.key} onClick={()=>setTab(t.key)} style={{
                flex:1, border:'none', background:'transparent', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'4px 0',
                color: active? 'var(--muc-blau)':'var(--ink-300)', transition:'color var(--dur-base)',
              }}>
                <Icon name={t.icon} size={23} stroke={active?2.4:2} />
                <span style={{ fontSize:10, fontWeight:active?800:600, letterSpacing:'0.02em' }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* sheet overlay (covers frame) */}
        {sheet}

        {/* toast */}
        {toastMsg && (
          <div className="wn-toast-in" style={{ position:'absolute', left:16, right:16, bottom:96, zIndex:70, background:'var(--navy-900)', color:'var(--pergament)', padding:'13px 16px', borderRadius:'var(--r-md)', boxShadow:'var(--sh-lg)', fontSize:14, fontWeight:700, textAlign:'center' }}>
            {toastMsg}
          </div>
        )}
      </PhoneFrame>
    );
  }
  window.AppShell = AppShell;
})();
