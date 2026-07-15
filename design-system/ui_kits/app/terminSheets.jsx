// Wirtschaftln — Termin sheets & dialogs (rendered as full-frame overlays).
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { Button, Input, Avatar, Badge, StarRating } = DS;
  const Icon = window.WNIcon;
  const T = window.WNTermin;

  // ---- generic bottom sheet ------------------------------------------
  function Sheet({ title, sub, onClose, children, footer }) {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
        <div onClick={onClose} className="wn-scrim" style={{ position:'absolute', inset:0, background:'rgba(7,25,58,0.45)' }}></div>
        <div className="wn-sheet-in" style={{ position:'relative', background:'var(--weiss)', borderRadius:'24px 24px 0 0', maxHeight:'92%', display:'flex', flexDirection:'column', boxShadow:'0 -12px 40px rgba(7,25,58,0.4)' }}>
          <div style={{ flex:'none', padding:'16px 20px 12px', borderBottom:'1px solid var(--ink-100)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
              <div>
                <div style={{ fontSize:19, fontWeight:800, color:'var(--ink-900)' }}>{title}</div>
                {sub && <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-500)', marginTop:2 }}>{sub}</div>}
              </div>
              <button onClick={onClose} aria-label="Schließen" style={{ border:'none', background:'var(--ink-50)', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:18, color:'var(--ink-500)', flex:'none' }}>✕</button>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>{children}</div>
          {footer && <div style={{ flex:'none', padding:'14px 20px calc(18px + env(safe-area-inset-bottom))', borderTop:'1px solid var(--ink-100)' }}>{footer}</div>}
        </div>
      </div>
    );
  }

  function PlaceRow({ p, onClick }) {
    return (
      <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', padding:'12px 12px', border:'1px solid var(--ink-100)', borderRadius:'var(--r-md)', background:'var(--weiss)', cursor:'pointer' }}>
        <span style={{ width:38, height:38, flex:'none', borderRadius:'var(--r-sm)', background:'var(--info-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="pin" size={20} color="var(--muc-blau)" />
        </span>
        <span style={{ flex:1, minWidth:0 }}>
          <span style={{ display:'block', fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>{p.name}</span>
          <span style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--ink-500)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.adresse}</span>
        </span>
        <Icon name="chevron" size={18} color="var(--ink-300)" />
      </button>
    );
  }

  // ---- 1) Wirtshaus festlegen (Google-style address search) ----------
  function AddWirtshausSheet({ onClose, onPick }) {
    const [q, setQ] = React.useState('');
    const results = T.PLACES.filter(p => (p.name + ' ' + p.adresse + ' ' + p.bezirk).toLowerCase().includes(q.toLowerCase()));
    return (
      <Sheet title="Wirtshaus festlegen" sub="Such die Adresse — wir merken sie für die Karte." onClose={onClose}>
        <Input label="Adresse oder Name" value={q} onChange={e=>setQ(e.target.value)} placeholder="z.B. Hofbräukeller…" iconLeft={<Icon name="map" size={17} />} />
        <div style={{ display:'flex', alignItems:'center', gap:6, margin:'10px 2px 14px', fontSize:11, fontWeight:600, color:'var(--ink-400, var(--ink-500))' }}>
          <span style={{ fontWeight:800, color:'#4285F4' }}>G</span><span style={{ fontWeight:800, color:'#EA4335' }}>o</span><span style={{ fontWeight:800, color:'#FBBC05' }}>o</span><span style={{ fontWeight:800, color:'#4285F4' }}>g</span><span style={{ fontWeight:800, color:'#34A853' }}>l</span><span style={{ fontWeight:800, color:'#EA4335' }}>e</span>
          <span style={{ color:'var(--ink-400, var(--ink-500))' }}>Places · München</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {results.map(p => <PlaceRow key={p.id} p={p} onClick={()=>onPick({ name:p.name, adresse:p.adresse, bezirk:p.bezirk, x:p.x, y:p.y })} />)}
          {results.length===0 && <div style={{ textAlign:'center', color:'var(--ink-400, var(--ink-500))', fontSize:14, padding:'24px 0' }}>Nix gfunden. Anders schreiben?</div>}
        </div>
      </Sheet>
    );
  }

  // ---- 2) Neuen Termin festlegen + Planer zuweisen -------------------
  function NewTerminSheet({ members, onClose, onCreate }) {
    const [datum, setDatum] = React.useState('Donnerstag, 25. Juli 2026');
    const [zeit, setZeit] = React.useState('19:00');
    const [planer, setPlaner] = React.useState(members[0]);
    return (
      <Sheet title="Neuer Termin" sub="Gleich am Tisch ausmachen — wer plant das nächste Mal?" onClose={onClose}
        footer={<Button variant="gold" size="lg" fullWidth iconLeft="🍺" onClick={()=>onCreate({ datum, zeit, planerId:planer.id, planer:planer.name })}>Termin anlegen</Button>}>
        <div style={{ display:'flex', gap:12 }}>
          <Input label="Datum" value={datum} onChange={e=>setDatum(e.target.value)} style={{ flex:2 }} iconLeft={<Icon name="calendar" size={16} />} />
          <Input label="Zeit" value={zeit} onChange={e=>setZeit(e.target.value)} style={{ flex:1 }} />
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-700)', margin:'18px 0 8px' }}>Wer plant & reserviert?</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {members.map(m => {
            const active = planer.id===m.id;
            return (
              <button key={m.id} onClick={()=>setPlaner(m)} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:'var(--r-md)', cursor:'pointer', border: active?'1.5px solid var(--muc-blau)':'1.5px solid var(--ink-200)', background: active?'var(--info-bg)':'var(--weiss)' }}>
                <Avatar src={m.photo} name={m.name} size={38} ring={m.ring} />
                <span style={{ flex:1 }}>
                  <span style={{ display:'block', fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>{m.name}</span>
                  {m.amt && <span style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--gold-700)' }}>{m.amt}</span>}
                </span>
                {active && <Badge tone="blau" solid>Planer</Badge>}
              </button>
            );
          })}
        </div>
      </Sheet>
    );
  }

  // ---- mini hoibe stepper for the close-out sheet --------------------
  function MiniStepper({ value, onChange }) {
    const Btn = ({d,ch}) => <button onClick={()=>onChange(Math.max(0, value+d))} style={{ width:32, height:32, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:18, fontWeight:700, background: d>0?'var(--gold)':'var(--ink-50)', color: d>0?'var(--navy-900)':'var(--ink-500)', display:'flex', alignItems:'center', justifyContent:'center' }}>{ch}</button>;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Btn d={-1} ch="−" />
        <span style={{ minWidth:22, textAlign:'center', fontSize:17, fontWeight:800, color:'var(--gold-700)', fontVariantNumeric:'tabular-nums' }}>{value}</span>
        <Btn d={1} ch="+" />
      </div>
    );
  }

  // ---- 3) Besuch abschließen -----------------------------------------
  // ± stepper for a one-decimal star rating, starts at 3.0
  function StarStepper({ value, onChange }) {
    const clamp = (v)=>Math.max(0, Math.min(5, Math.round(v*10)/10));
    const btn = { width:44, height:44, flex:'none', borderRadius:'50%', border:'1.5px solid var(--ink-200)', background:'var(--weiss)', cursor:'pointer', fontSize:22, fontWeight:800, color:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 };
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:18 }}>
        <button type="button" onClick={()=>onChange(clamp(value-0.1))} aria-label="Weniger" style={btn}>−</button>
        <div style={{ display:'flex', alignItems:'baseline', gap:6, minWidth:96, justifyContent:'center' }}>
          <span style={{ fontSize:34, fontWeight:800, color:'var(--navy)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{value.toFixed(1).replace('.', ',')}</span>
          <span style={{ fontSize:24, color:'var(--gold)' }}>★</span>
        </div>
        <button type="button" onClick={()=>onChange(clamp(value+0.1))} aria-label="Mehr" style={btn}>+</button>
      </div>
    );
  }

  function CloseVisitSheet({ participants, wirtshaus, onClose, onSave }) {
    const [rows, setRows] = React.useState(() => participants.map(p => ({ id:p.id, name:p.name, photo:p.photo, hoiben:0, braten:false, taxi:false })));
    const [stars, setStars] = React.useState(3);
    const [text, setText] = React.useState('');
    const [kaiserOpen, setKaiserOpen] = React.useState(false);
    const [kaiserStars, setKaiserStars] = React.useState(0);
    const [kaiserText, setKaiserText] = React.useState('');
    const [brodnOpen, setBrodnOpen] = React.useState(false);
    const [brodnStars, setBrodnStars] = React.useState(0);
    const [brodnText, setBrodnText] = React.useState('');
    const setRow = (id, patch) => setRows(rs => rs.map(r => r.id===id ? { ...r, ...patch } : r));
    const totalHoiben = rows.reduce((s,r)=>s+r.hoiben,0);

    return (
      <Sheet title="Besuch abschließen" sub={(wirtshaus && wirtshaus.name) + ' · trag ein, was war'} onClose={onClose}
        footer={<Button variant="gold" size="lg" fullWidth iconLeft="🍺" onClick={()=>onSave({ rows, stars, text, totalHoiben, kaiserschmarrn:{ stars:kaiserStars, text:kaiserText }, schweinsbraten:{ stars:brodnStars, text:brodnText } })}>Abschließen & ins Archiv</Button>}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-500)', marginBottom:8 }}>Pro Mitglied · {totalHoiben} Hoiben gesamt</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rows.map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--ink-100)', borderRadius:'var(--r-md)' }}>
              <Avatar src={r.photo} name={r.name} size={34} />
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:'var(--ink-900)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name.split(' ')[0]}</span>
              <button onClick={()=>setRow(r.id,{taxi:!r.taxi})} title="Mit dem Auto da? (Taxler)" style={{ width:34, height:34, flex:'none', borderRadius:'50%', cursor:'pointer', fontSize:16, border: r.taxi?'none':'1.5px solid var(--ink-200)', background: r.taxi?'var(--grad-gold)':'var(--weiss)', filter: r.taxi?'none':'grayscale(1) opacity(0.5)' }}>🚕</button>
              <button onClick={()=>setRow(r.id,{braten:!r.braten})} title="Schweinsbraten?" style={{ width:34, height:34, flex:'none', borderRadius:'50%', cursor:'pointer', fontSize:17, border: r.braten?'none':'1.5px solid var(--ink-200)', background: r.braten?'var(--grad-gold)':'var(--weiss)', filter: r.braten?'none':'grayscale(1) opacity(0.5)' }}>🍖</button>
              <MiniStepper value={r.hoiben} onChange={v=>setRow(r.id,{hoiben:v})} />
            </div>
          ))}
        </div>

        <div style={{ height:1, background:'var(--ink-100)', margin:'18px 0' }}></div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-700)', marginBottom:12 }}>Deine Bewertung</div>
        <div style={{ marginBottom:16 }}>
          <StarStepper value={stars} onChange={setStars} />
        </div>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Wie war's? Bedienung, Bier, Brotzeit…"
          style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', padding:12, fontFamily:'var(--font-ui)', fontSize:15, color:'var(--ink-900)', resize:'none', outline:'none' }} />

        {/* extra field — Kaiserschmarrn rating */}
        <button onClick={()=>setKaiserOpen(true)} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', marginTop:14, padding:'12px 14px', background:'var(--weiss)', border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', cursor:'pointer', fontFamily:'var(--font-ui)' }}>
          <span style={{ width:38, height:38, flex:'none', borderRadius:'var(--r-md)', background:'var(--pergament)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🥞</span>
          <span style={{ flex:1, minWidth:0 }}>
            <span style={{ display:'block', fontSize:15, fontWeight:800, color:'var(--ink-900)' }}>Kaiserschmarrn?</span>
            <span style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--ink-500)' }}>{kaiserStars>0 ? kaiserStars+' / 5 · tippen zum Ändern' : 'Den Nachtisch bewerten'}</span>
          </span>
          {kaiserStars>0 && <StarRating value={kaiserStars} size={14} showValue={false} />}
          <Icon name="chevron" size={18} color="var(--ink-300)" />
        </button>

        {/* Kaiserschmarrn rating dialog */}
        {kaiserOpen && (
          <div style={{ position:'absolute', inset:0, zIndex:70, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div onClick={()=>setKaiserOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(7,25,58,0.55)' }}></div>
            <div className="wn-sheet-in" style={{ position:'relative', width:'100%', maxWidth:330, background:'var(--weiss)', borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--sh-lg)' }}>
              <div style={{ background:'var(--pergament)', padding:'20px', textAlign:'center' }}>
                <div style={{ fontSize:34 }}>🥞</div>
                <div style={{ fontSize:19, fontWeight:800, color:'var(--navy)', marginTop:6 }}>Kaiserschmarrn</div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-500)', marginTop:4 }}>Wie war der Nachtisch?</div>
              </div>
              <div style={{ padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                  <StarRating value={kaiserStars} size={34} onChange={setKaiserStars} />
                </div>
                <textarea value={kaiserText} onChange={e=>setKaiserText(e.target.value)} rows={3} placeholder="Fluffig? Z'wenig Rosinen? Erzähl…"
                  style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', padding:12, fontFamily:'var(--font-ui)', fontSize:15, color:'var(--ink-900)', resize:'none', outline:'none' }} />
                <Button variant="gold" size="lg" fullWidth onClick={()=>setKaiserOpen(false)} style={{ marginTop:14 }}>Speichern</Button>
              </div>
            </div>
          </div>
        )}

        {/* extra field — Schweinsbraten rating */}
        <button onClick={()=>setBrodnOpen(true)} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', marginTop:10, padding:'12px 14px', background:'var(--weiss)', border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', cursor:'pointer', fontFamily:'var(--font-ui)' }}>
          <span style={{ width:38, height:38, flex:'none', borderRadius:'var(--r-md)', background:'var(--pergament)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🍖</span>
          <span style={{ flex:1, minWidth:0 }}>
            <span style={{ display:'block', fontSize:15, fontWeight:800, color:'var(--ink-900)' }}>Schweinsbraten?</span>
            <span style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--ink-500)' }}>{brodnStars>0 ? brodnStars+' / 5 · tippen zum Ändern' : 'Den Brodn bewerten'}</span>
          </span>
          {brodnStars>0 && <StarRating value={brodnStars} size={14} showValue={false} />}
          <Icon name="chevron" size={18} color="var(--ink-300)" />
        </button>

        {/* Schweinsbraten rating dialog */}
        {brodnOpen && (
          <div style={{ position:'absolute', inset:0, zIndex:70, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div onClick={()=>setBrodnOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(7,25,58,0.55)' }}></div>
            <div className="wn-sheet-in" style={{ position:'relative', width:'100%', maxWidth:330, background:'var(--weiss)', borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--sh-lg)' }}>
              <div style={{ background:'var(--pergament)', padding:'20px', textAlign:'center' }}>
                <div style={{ fontSize:34 }}>🍖</div>
                <div style={{ fontSize:19, fontWeight:800, color:'var(--navy)', marginTop:6 }}>Schweinsbraten</div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-500)', marginTop:4 }}>Wie war der Brodn?</div>
              </div>
              <div style={{ padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                  <StarRating value={brodnStars} size={34} onChange={setBrodnStars} />
                </div>
                <textarea value={brodnText} onChange={e=>setBrodnText(e.target.value)} rows={3} placeholder="Knusprig? Soß'n a Gedicht? Erzähl…"
                  style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid var(--ink-200)', borderRadius:'var(--r-md)', padding:12, fontFamily:'var(--font-ui)', fontSize:15, color:'var(--ink-900)', resize:'none', outline:'none' }} />
                <Button variant="gold" size="lg" fullWidth onClick={()=>setBrodnOpen(false)} style={{ marginTop:14 }}>Speichern</Button>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    );
  }

  // ---- 4) Strafrunde dialog (cancel < 24h) ---------------------------
  function PenaltyDialog({ anwesend, onClose, onSend }) {
    const preis = T.HOIBE_PREIS;
    const gesamt = (preis * anwesend);
    const fmt = (n) => n.toFixed(2).replace('.', ',');
    return (
      <div style={{ position:'absolute', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(7,25,58,0.55)' }}></div>
        <div className="wn-sheet-in" style={{ position:'relative', width:'100%', maxWidth:330, background:'var(--weiss)', borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--sh-lg)' }}>
          <div style={{ background:'var(--strafe-bg)', padding:'20px', textAlign:'center' }}>
            <div style={{ fontSize:34 }}>🍻</div>
            <div style={{ fontSize:19, fontWeight:800, color:'var(--strafe)', marginTop:6 }}>Absage = Strafrunde</div>
            <div style={{ fontSize:13, fontWeight:500, color:'#A93226', marginTop:4 }}>Weniger als 24 h vorher abgesagt. Du gibst eine Runde an alle, die heut da sind.</div>
          </div>
          <div style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, fontWeight:600, color:'var(--ink-700)', padding:'6px 0' }}>
              <span>Hoibe (Augustiner Stüberl)</span><span className="wn-tnum">{fmt(preis)} €</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, fontWeight:600, color:'var(--ink-700)', padding:'6px 0', borderBottom:'1px solid var(--ink-100)' }}>
              <span>Anwesende heut</span><span className="wn-tnum">× {anwesend}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0 16px' }}>
              <span style={{ fontSize:15, fontWeight:800, color:'var(--ink-900)' }}>Strafrunde</span>
              <span style={{ fontSize:24, fontWeight:800, color:'var(--strafe)' }} className="wn-tnum">{fmt(gesamt)} €</span>
            </div>
            <Button variant="danger" size="lg" fullWidth iconLeft={<Icon name="bell" size={17} />} onClick={onSend}>E-Mail an die Runde senden</Button>
            <Button variant="ghost" size="md" fullWidth onClick={onClose} style={{ marginTop:8 }}>Doch nicht absagen</Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- 5) Wirtschaftler melden ---------------------------------------
  const VORWUERFE = [
    'Zugesagt & nicht erschienen',
    'Zu spät (über 30 min)',
    'Falsches Wirtshaus vorgeschlagen',
    'Runde vergessen',
    'Daneben benommen',
    'Sonstiges',
  ];
  function MeldenSheet({ members, onClose, onSubmit }) {
    const [m, setM] = React.useState(null);
    const [vorwurf, setVorwurf] = React.useState('');
    const [betrag, setBetrag] = React.useState('3,80');
    const valid = m && vorwurf.trim().length > 0;
    const parse = (s) => parseFloat(String(s).replace(',', '.')) || 0;
    return (
      <Sheet title="Wirtschaftler melden" sub="Wer hat sich was zuschulden kommen lassen?" onClose={onClose}
        footer={<Button variant="danger" size="lg" fullWidth disabled={!valid} iconLeft="⚖️" onClick={()=>onSubmit({ memberId:m.id, name:m.name, photo:m.photo, vorwurf, betrag:parse(betrag) })}>Melden & PayPal-Link senden</Button>}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-700)', marginBottom:8 }}>Wer?</div>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, marginBottom:6 }}>
          {members.map(x => {
            const active = m && m.id===x.id;
            return (
              <button key={x.id} onClick={()=>setM(x)} style={{ flex:'none', width:72, border:'none', background:'transparent', cursor:'pointer', padding:0, textAlign:'center' }}>
                <div style={{ borderRadius:'50%', padding:2, background: active?'var(--strafe)':'transparent' }}>
                  <Avatar src={x.photo} name={x.name} size={52} style={{ border:'2px solid var(--weiss)', borderRadius:'50%' }} />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color: active?'var(--strafe)':'var(--ink-500)', marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{x.name.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-700)', margin:'14px 0 8px' }}>Vorwurf</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
          {VORWUERFE.map(v => {
            const active = vorwurf===v;
            return (
              <button key={v} onClick={()=>setVorwurf(v)} style={{ border: active?'1.5px solid var(--strafe)':'1.5px solid var(--ink-200)', background: active?'var(--strafe-bg)':'var(--weiss)', color: active?'var(--strafe)':'var(--ink-700)', borderRadius:'var(--r-pill)', padding:'7px 12px', fontSize:13, fontWeight:700, cursor:'pointer' }}>{v}</button>
            );
          })}
        </div>
        <Input label="Eigener Vorwurf" value={vorwurf} onChange={e=>setVorwurf(e.target.value)} placeholder="Was war los?" />
        <div style={{ marginTop:12 }}>
          <Input label="Forderung (€)" value={betrag} onChange={e=>setBetrag(e.target.value)} iconLeft="💶" hint="Richtwert: Hoibe im Augustiner Stüberl = 3,80 €" />
        </div>
      </Sheet>
    );
  }

  // ---- 6) Forderung verwalten ----------------------------------------
  function ForderungDialog({ entry, onClose, onStatus }) {
    const abs = Math.abs(entry.betrag).toFixed(2).replace('.', ',');
    const opts = [
      ['beglichen', 'Als beglichen markieren', 'var(--erfolg)', '✓'],
      ['offen', 'Noch offen', 'var(--warnung)', '○'],
      ['aufgehoben', 'Aufheben (erlassen)', 'var(--ink-500)', '✕'],
    ];
    return (
      <div style={{ position:'absolute', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(7,25,58,0.55)' }}></div>
        <div className="wn-sheet-in" style={{ position:'relative', width:'100%', maxWidth:330, background:'var(--weiss)', borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--sh-lg)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 20px', background:'var(--pergament)' }}>
            <Avatar src={entry.photo} name={entry.name} size={46} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--ink-900)' }}>{entry.name}</div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-500)' }}>{entry.grund}</div>
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--strafe)' }}>{abs} €</div>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--info-bg)', borderRadius:'var(--r-md)', marginBottom:14 }}>
              <span style={{ fontSize:18 }}>🔗</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--muc-blau)' }}>PayPal-Link gesendet</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-700)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>paypal.me/wirtschaftln/{abs.replace(',', '')}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {opts.map(([key, label, color, glyph]) => {
                const active = (entry.status || 'offen') === key;
                return (
                  <button key={key} onClick={()=>onStatus(key)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left', padding:'12px 14px', borderRadius:'var(--r-md)', cursor:'pointer', border: active?`1.5px solid ${color}`:'1.5px solid var(--ink-200)', background: active?'var(--ink-50)':'var(--weiss)', fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700, color }}>
                    <span style={{ width:24, height:24, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flex:'none' }}>{glyph}</span>
                    <span style={{ flex:1, color:'var(--ink-900)' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 7) Ausgabe erfassen (club expenditure) ------------------------
  const KATEGORIEN = [
    { key:'brotzeit', label:'Brotzeit', icon:'🥨' },
    { key:'bier',     label:'Bier & Getränk', icon:'🍺' },
    { key:'reservierung', label:'Reservierung', icon:'📋' },
    { key:'ausflug',  label:'Ausflug', icon:'🚌' },
    { key:'feier',    label:'Jahresfeier', icon:'🎉' },
    { key:'sonstiges',label:'Sonstiges', icon:'🧾' },
  ];
  function AusgabeSheet({ saldo, onClose, onSubmit }) {
    const [kat, setKat] = React.useState(KATEGORIEN[0]);
    const [grund, setGrund] = React.useState('');
    const [betrag, setBetrag] = React.useState('');
    const parse = (s) => parseFloat(String(s).replace(',', '.')) || 0;
    const wert = parse(betrag);
    const valid = grund.trim().length > 0 && wert > 0;
    const rest = saldo - wert;
    return (
      <Sheet title="Ausgabe erfassen" sub="Geld aus der Vereinskasse — wofür?" onClose={onClose}
        footer={
          <Button variant="primary" size="lg" fullWidth disabled={!valid} iconLeft={kat.icon}
            onClick={()=>onSubmit({ grund, betrag:wert, icon:kat.icon, kategorie:kat.label })}>
            {valid ? `${wert.toFixed(2).replace('.',',')} € auszahlen` : 'Ausgabe buchen'}
          </Button>
        }>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-700)', marginBottom:8 }}>Kategorie</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {KATEGORIEN.map(c => {
            const active = kat.key===c.key;
            return (
              <button key={c.key} onClick={()=>setKat(c)} style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 12px', borderRadius:'var(--r-md)', cursor:'pointer', textAlign:'left', border: active?'1.5px solid var(--muc-blau)':'1.5px solid var(--ink-200)', background: active?'var(--info-bg)':'var(--weiss)' }}>
                <span style={{ fontSize:19 }}>{c.icon}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'var(--ink-900)' }}>{c.label}</span>
              </button>
            );
          })}
        </div>
        <Input label="Wofür genau?" value={grund} onChange={e=>setGrund(e.target.value)} placeholder="z.B. Brezn & Obatzda für die Runde" />
        <div style={{ marginTop:12 }}>
          <Input label="Betrag (€)" value={betrag} onChange={e=>setBetrag(e.target.value)} type="text" iconLeft="💶" placeholder="0,00" />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16, padding:'12px 14px', background:'var(--ink-50)', borderRadius:'var(--r-md)' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--ink-500)' }}>Kassenstand danach</span>
          <span style={{ fontSize:18, fontWeight:800, color: rest<0?'var(--strafe)':'var(--ink-900)', fontVariantNumeric:'tabular-nums' }}>{rest.toFixed(2).replace('.',',')} €</span>
        </div>
      </Sheet>
    );
  }

  window.WNSheets = { Sheet, AddWirtshausSheet, NewTerminSheet, CloseVisitSheet, PenaltyDialog, MeldenSheet, ForderungDialog, AusgabeSheet };
})();
