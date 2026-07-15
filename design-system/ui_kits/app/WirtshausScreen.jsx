// Wirtschaftln — Wirtshäuser screen: full Google map (Karte) + card list (Liste)
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { WirtshausCard, SegmentedTabs, Stat, Card, Badge, StarRating, Avatar } = DS;

  // Google map centred on Munich — our own beer-mug pins are overlaid on top,
  // so the embed itself shows no marker (keyless embeds only allow one).
  const MUNICH_MAP = 'https://www.google.com/maps?ll=48.137,11.575&z=12&t=m&output=embed';

  // Beer-mug teardrop pins, overlaid on the Google map
  function MapPins({ taverns, activeIdx, onPick }) {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none' }}>
        {taverns.map((t, i)=>{
          const isActive = i === activeIdx;
          const next = t.naechstes;
          const x = t.x != null ? t.x : 50, y = t.y != null ? t.y : 50;
          return (
            <button key={t.id} onClick={()=>onPick(i)} style={{
              position:'absolute', left:x+'%', top:y+'%', transform:'translate(-50%,-100%)',
              border:'none', background:'transparent', cursor:'pointer', padding:0, pointerEvents:'auto',
              filter: isActive ? 'drop-shadow(0 4px 6px rgba(12,43,90,.4))' : 'drop-shadow(0 2px 3px rgba(12,43,90,.3))',
              zIndex: isActive ? 5 : 1,
            }}>
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center',
                width: isActive?36:28, height: isActive?36:28, borderRadius:'50% 50% 50% 0',
                transform:'rotate(-45deg)', transition:'all var(--dur-base) var(--ease-standard)',
                background: next ? 'var(--grad-gold)' : (isActive ? 'var(--muc-blau)' : 'var(--navy)'),
                border:'2px solid #fff', boxShadow:'var(--sh-sm)' }}>
                <span style={{ transform:'rotate(45deg)', fontSize: isActive?16:13 }}>{next?'📍':'🍺'}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact tavern card that sits over the map (photo left, info right)
  function MapBottomCard({ t, idx, count, onPrev, onNext }) {
    return (
      <div style={{
        display:'flex', alignItems:'stretch', gap:0, background:'var(--surface-card)',
        borderRadius:'var(--r-lg)', overflow:'hidden',
        border: t.naechstes ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
        boxShadow:'var(--sh-lg)', fontFamily:'var(--font-ui)',
      }}>
        <div style={{ position:'relative', width:104, flex:'none', background:'var(--ink-100)' }}>
          {t.photo && <img src={t.photo} alt={t.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
        </div>
        <div style={{ flex:1, minWidth:0, padding:'12px 12px 12px 14px', display:'flex', flexDirection:'column', justifyContent:'center', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {t.naechstes
              ? <Badge tone="gold" solid iconLeft="📍">Nächstes Mal</Badge>
              : t.besuchtAm
                ? <Badge tone="blau" solid iconLeft="✓">Besucht</Badge>
                : <Badge tone="neutral" solid>Offen</Badge>}
            <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'var(--ink-400, var(--ink-500))' }}>{idx+1} / {count}</span>
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--ink-900)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
          {t.organisator && <div style={{ fontSize:11, fontWeight:600, color:'var(--gold-700)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>organisiert von {t.organisator.split(' ')[0]}</div>}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.bezirk}</span>
            {t.rating > 0 && <StarRating value={t.rating} size={14} showValue />}
          </div>
        </div>
        {/* prev / next */}
        <div style={{ flex:'none', display:'flex', flexDirection:'column', borderLeft:'1px solid var(--ink-100)' }}>
          <button onClick={onPrev} aria-label="Vorheriges" style={navBtn}>‹</button>
          <button onClick={onNext} aria-label="Nächstes" style={{ ...navBtn, borderTop:'1px solid var(--ink-100)' }}>›</button>
        </div>
      </div>
    );
  }
  const navBtn = {
    flex:1, width:42, border:'none', background:'transparent', cursor:'pointer',
    fontSize:20, fontWeight:800, color:'var(--navy)', lineHeight:1,
    display:'flex', alignItems:'center', justifyContent:'center',
  };

  // Medal styling for ranked positions
  const MEDAL = {
    1: { bg:'var(--grad-gold)', fg:'var(--navy-900)' },
    2: { bg:'linear-gradient(135deg,#E7ECF2,#C2CAD6)', fg:'#4A5568' },
    3: { bg:'linear-gradient(135deg,#E0A267,#C9853F)', fg:'#fff' },
  };

  // ranking metrics
  const METRICS = {
    stars:  { field:'rating', icon:'★',  label:'STERNE',   champ:'Wirtshaus Nr. 1', heading:'Alle Wirtshäuser',     empty:'Noch keine Bewertung.' },
    kaiser: { field:'kaiser', icon:'🥞', label:'SCHMARRN', champ:'Schmarrn-König',  heading:'Beste Kaiserschmarrn', empty:'Noch kein Kaiserschmarrn bewertet. 🥞' },
    brodn:  { field:'brodn',  icon:'🍖', label:'BRODN',    champ:'Brodn-König',     heading:'Beste Schweinsbraten', empty:'Noch kein Brodn bewertet. 🍖' },
  };

  // One cool numbered row in the ranking
  function RankedCard({ rank, t, mc, onClick }) {
    const top = rank <= 3;
    const medal = MEDAL[rank] || { bg:'var(--ink-100)', fg:'var(--ink-500)' };
    const score = (t[mc.field]||0).toFixed(1);
    const icon = mc.icon;
    return (
      <div onClick={onClick} style={{
        position:'relative', display:'flex', alignItems:'center', gap:12,
        background:'var(--surface-card)', borderRadius:'var(--r-lg)', overflow:'hidden',
        border: rank===1 ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
        boxShadow: top ? 'var(--sh-md)' : 'var(--sh-sm)',
        padding:'10px 12px 10px 10px', fontFamily:'var(--font-ui)', cursor:'pointer',
      }}>
        {/* rank medal */}
        <div style={{ flex:'none', position:'relative', width:40, display:'flex', flexDirection:'column', alignItems:'center' }}>
          {rank===1 && <span style={{ position:'absolute', top:-13, fontSize:16, lineHeight:1 }}>👑</span>}
          <div style={{ width:36, height:36, borderRadius:'50%', background:medal.bg, color:medal.fg,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800,
            fontVariantNumeric:'tabular-nums', boxShadow: top?'var(--sh-xs)':'none' }}>{rank}</div>
        </div>
        {/* photo */}
        <div style={{ flex:'none', width:54, height:54, borderRadius:'var(--r-md)', overflow:'hidden', background:'var(--ink-100)' }}>
          {t.photo && <img src={t.photo} alt={t.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
        </div>
        {/* info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'var(--ink-900)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.bezirk}</div>
          {t.organisator && <div style={{ fontSize:11, fontWeight:600, color:'var(--gold-700)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>organisiert von {t.organisator.split(' ')[0]}</div>}
        </div>
        {/* score */}
        <div style={{ flex:'none', textAlign:'right' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:3, justifyContent:'flex-end' }}>
            <span style={{ fontSize:22, fontWeight:800, color:'var(--navy)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:16 }}>{icon}</span>
          </div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:'var(--gold-700)', marginTop:3 }}>{mc.label}</div>
        </div>
      </div>
    );
  }

  // Full-detail dialog for a tavern (opened from the ranking)
  function DetailModal({ t, rank, members, onClose }) {
    const org = members.find(m => m.name === t.organisator);
    return (
      <div style={{ position:'absolute', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(7,25,58,0.55)' }}></div>
        <div className="wn-sheet-in" style={{ position:'relative', width:'100%', maxWidth:340, background:'var(--weiss)', borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--sh-lg)', fontFamily:'var(--font-ui)' }}>
          {/* photo header */}
          <div style={{ position:'relative', height:158 }}>
            {t.photo && <img src={t.photo} alt={t.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(7,25,58,0) 40%, rgba(7,25,58,0.82) 100%)' }}></div>
            <button onClick={onClose} aria-label="Schließen" style={{ position:'absolute', top:10, right:10, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.92)', color:'var(--ink-700)', fontSize:16, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            {rank && <div style={{ position:'absolute', top:12, left:12, display:'inline-flex', alignItems:'center', gap:6, background:'var(--grad-gold)', color:'var(--navy-900)', fontSize:11, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', padding:'5px 11px', borderRadius:'var(--r-pill)', boxShadow:'var(--sh-sm)' }}>{rank===1?'👑 ':''}Platz {rank}</div>}
            <div style={{ position:'absolute', left:14, right:14, bottom:12 }}>
              <div style={{ fontFamily:'var(--font-fraktur)', fontSize:24, color:'var(--gold-bright)', lineHeight:1.15, textShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>{t.name}</div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--pergament)', marginTop:3 }}>{t.bezirk}</div>
            </div>
          </div>
          {/* body */}
          <div style={{ padding:'16px 18px 20px' }}>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, textAlign:'center', padding:'12px 4px', background:'var(--pergament)', borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--navy)', lineHeight:1 }}>{t.rating>0?t.rating.toFixed(1):'–'} <span style={{ fontSize:14 }}>★</span></div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--ink-500)', marginTop:5 }}>Sterne</div>
              </div>
              <div style={{ flex:1, textAlign:'center', padding:'12px 4px', background:'var(--pergament)', borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--navy)', lineHeight:1 }}>{t.kaiser>0?t.kaiser.toFixed(1):'–'} <span style={{ fontSize:14 }}>🥞</span></div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--ink-500)', marginTop:5 }}>Schmarrn</div>
              </div>
              <div style={{ flex:1, textAlign:'center', padding:'12px 4px', background:'var(--pergament)', borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--navy)', lineHeight:1 }}>{t.brodn>0?t.brodn.toFixed(1):'–'} <span style={{ fontSize:14 }}>🍖</span></div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--ink-500)', marginTop:5 }}>Brodn</div>
              </div>
            </div>
            {/* organisator */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:14, padding:'12px 14px', background:'rgba(0,106,179,0.06)', borderRadius:'var(--r-md)' }}>
              <Avatar src={org && org.photo} name={t.organisator||'?'} size={38} ring />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink-500)' }}>Organisiert von</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--muc-blau)' }}>{t.organisator || 'Unbekannt'}</div>
              </div>
            </div>
            {t.besuchtAm && <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-500)', marginTop:14, textAlign:'center' }}>Besucht am {t.besuchtAm}</div>}
          </div>
        </div>
      </div>
    );
  }

  function WirtshausScreen({ data, store }) {
    const [view, setView] = React.useState('karte');   // 'karte' | 'rang' | 'kaiser'
    const [idx, setIdx] = React.useState(0);
    const [detail, setDetail] = React.useState(null);  // { t, rank }

    // Base taverns from the live store (so closed-out visits show up here)
    const base = (store && store.taverns ? store.taverns : data.taverns).filter(t=>!t.naechstes);
    // Inject the reserved Termin venue as the gold "nächstes" pin
    const ph = store && store.termin ? store.termin.phase : null;
    let injected = [];
    if (store && (ph==='reserviert' || ph==='heute') && store.termin.wirtshaus) {
      const w = store.termin.wirtshaus;
      injected = [{ id:'next', name:w.name, bezirk:w.bezirk, rating:0, besuchtAm:null, naechstes:true,
        x:w.x, y:w.y, photo:'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=70' }];
    }
    const taverns = [...injected, ...base];
    const visited = taverns.filter(t=>t.besuchtAm);
    const avg = visited.length ? (visited.reduce((s,t)=>s+t.rating,0)/visited.length).toFixed(1) : '–';

    const Toggle = (
      <SegmentedTabs value={view} onChange={setView} style={{ alignSelf:'flex-start' }}
        tabs={[{label:'Karte',value:'karte'},{label:'Sterne',value:'rang'},{label:'Schmarrn',value:'kaiser'},{label:'Brodn',value:'brodn'}]} />
    );

    // ── KARTE: full Google map + selected Wirtshaus pinned at the bottom ──
    if (view === 'karte') {
      const safeIdx = Math.min(idx, taverns.length-1);
      const activeT = taverns[safeIdx];
      const step = (d)=>setIdx(i=>{
        const n = Math.min(i, taverns.length-1) + d;
        return (n + taverns.length) % taverns.length;
      });
      return (
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          <iframe title="Wirtshaus-Karte" src={MUNICH_MAP} loading="lazy"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}></iframe>

          {/* all taverns as beer-mug pins */}
          <MapPins taverns={taverns} activeIdx={safeIdx} onPick={setIdx} />

          {/* floating view toggle — snug, equal gap left & right */}
          <div style={{ position:'absolute', top:12, left:14, zIndex:5 }}>
            <div style={{ display:'inline-flex', background:'rgba(255,255,255,0.94)', borderRadius:'var(--r-pill)', padding:4, boxShadow:'var(--sh-md)', backdropFilter:'blur(4px)' }}>
              {Toggle}
            </div>
          </div>

          {/* selected Wirtshaus, always at the bottom */}
          <div style={{ position:'absolute', left:12, right:12, bottom:14, zIndex:5 }}>
            <MapBottomCard t={activeT} idx={safeIdx} count={taverns.length}
              onPrev={()=>step(-1)} onNext={()=>step(1)} />
          </div>
        </div>
      );
    }

    // ── RANGLISTE / SCHMARRN / BRODN: numbered ranking, best → worst ──
    const metricKey = view==='kaiser' ? 'kaiser' : view==='brodn' ? 'brodn' : 'stars';
    const mc = METRICS[metricKey];
    const ranked = visited
      .filter(t => (t[mc.field]||0) > 0)
      .sort((a,b)=> (b[mc.field]||0) - (a[mc.field]||0));
    const champ = ranked[0];
    const champScore = champ ? (champ[mc.field]||0).toFixed(1) : '–';

    return (
      <div style={{ padding:'12px 16px 24px', display:'flex', flexDirection:'column', gap:14 }}>
        {Toggle}

        {/* champion banner */}
        {champ && (
          <div style={{ position:'relative', borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--sh-md)' }}>
            <img src={champ.photo} alt={champ.name} style={{ width:'100%', height:150, objectFit:'cover', display:'block' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(7,25,58,0.05) 0%, rgba(7,25,58,0.85) 100%)' }}></div>
            <div style={{ position:'absolute', top:12, left:12, display:'inline-flex', alignItems:'center', gap:6, background:'var(--grad-gold)', color:'var(--navy-900)', fontSize:11, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 12px', borderRadius:'var(--r-pill)', boxShadow:'var(--sh-sm)' }}>
              👑 {mc.champ}
            </div>
            <div style={{ position:'absolute', left:14, right:14, bottom:12, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:10 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-fraktur)', fontSize:24, color:'var(--gold-bright)', lineHeight:1.1, textShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>{champ.name}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--pergament)', marginTop:3 }}>{champ.bezirk}</div>
              </div>
              <div style={{ flex:'none', display:'flex', alignItems:'baseline', gap:3, color:'#fff' }}>
                <span style={{ fontSize:30, fontWeight:800, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{champScore}</span>
                <span style={{ fontSize:20 }}>{mc.icon}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:8, margin:'2px 2px 0' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'var(--ink-900)' }}>{mc.heading}</span>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-500)' }}>· vom Besten zum Schlechtesten</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ranked.map((t,i)=>(
            <RankedCard key={t.id} rank={i+1} t={t} mc={mc} onClick={()=>setDetail({ t, rank:i+1 })} />
          ))}
          {ranked.length===0 && (
            <div style={{ textAlign:'center', padding:'30px 16px', color:'var(--ink-500)', fontSize:14, fontWeight:600 }}>
              {mc.empty}
            </div>
          )}
        </div>

        {detail && <DetailModal t={detail.t} rank={detail.rank} members={data.members} onClose={()=>setDetail(null)} />}
      </div>
    );
  }
  window.WirtshausScreen = WirtshausScreen;
})();
