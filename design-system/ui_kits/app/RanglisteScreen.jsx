// Wirtschaftln — Spezln / Rangliste: Wirtschaftln Points (WP) leaderboard
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { Avatar, SegmentedTabs, Card, Badge } = DS;

  // ── Wirtschaftln Points ──────────────────────────────────────────────
  // Hoibe ×1 · Teilnahme ×5 (+1 je Streak-Stufe) · Organisieren ×5 · Runde ×10
  const PTS = { hoibe:1, teilnahme:5, organisiert:5, runde:10 };
  function streakBonus(s) { return s>0 ? s*(s+1)/2 : 0; }   // 1+2+…+s; Minus-Streak gibt keinen Bonus
  function wpOf(s) {
    return s.hoibe*PTS.hoibe + s.teilnahmen*PTS.teilnahme + streakBonus(s.streak)
         + s.organisiert*PTS.organisiert + s.runden*PTS.runde;
  }
  // Stored numbers = Allzeit totals; Saison ≈ laufende Saison.
  function statsFor(m, season) {
    const f = season==='saison' ? 0.45 : 1;
    const sc = (n)=>Math.round(n*f);
    return {
      hoibe: sc(m.mass), teilnahmen: sc(m.abende), organisiert: sc(m.organisiert),
      runden: sc(m.runden), wirtshaeuser: sc(m.wirtshaeuser),
      streak: m.streak,   // current streak is live, not seasonal — Minus = wackelt
    };
  }

  const MEDAL = { 1:'var(--gold)', 2:'#B8C0CC', 3:'#C9853F' };
  const officeOf = (m, rank) =>
    rank===1 ? { label:'Präsident', icon:'👑' }
    : m.amt==='Kassenwartin' ? { label:'Kassenwart', icon:'💰' }
    : m.amt==='Schriftführer' ? { label:'Schriftführer', icon:'✒️' }
    : null;

  // streak tag — flame for a positive run, frost/warning when it goes minus.
  // After the 3rd miss you "wackelt" and can buy free with a Runde.
  function StreakTag({ cur, best, big }) {
    const neg = cur < 0, wackelt = cur <= -3;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5,
        background: neg ? 'var(--strafe-bg)' : 'var(--pergament)',
        border:'1px solid '+(neg ? 'var(--strafe)' : 'var(--pergament-edge)'),
        borderRadius:'var(--r-pill)', padding: big?'6px 12px':'3px 9px' }}>
        <span style={{ fontSize: big?15:12 }}>{neg ? (wackelt?'⚠️':'🥶') : '🔥'}</span>
        <span style={{ fontSize: big?13:12, fontWeight:800, color: neg?'var(--strafe)':'var(--ink-900)', fontVariantNumeric:'tabular-nums' }}>{cur>0?'+':''}{cur}</span>
        <span style={{ fontSize: big?12:11, fontWeight:600, color: neg?'var(--strafe)':'var(--ink-500)' }}>{wackelt?'wackelt':'Streak'}</span>
        <span style={{ fontSize:11, fontWeight:600, color:'var(--ink-400, var(--ink-500))' }}>· Rekord {best}</span>
      </span>
    );
  }

  // compact streak chip for the cards (no record)
  function StreakChip({ cur }) {
    const neg = cur < 0, wackelt = cur <= -3;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:4,
        background: neg ? 'var(--strafe-bg)' : 'var(--pergament)',
        border:'1px solid '+(neg ? 'var(--strafe)' : 'var(--pergament-edge)'),
        borderRadius:'var(--r-pill)', padding:'3px 8px' }}>
        <span style={{ fontSize:12 }}>{neg ? (wackelt?'⚠️':'🥶') : '🔥'}</span>
        <span style={{ fontSize:12, fontWeight:800, color: neg?'var(--strafe)':'var(--ink-900)', fontVariantNumeric:'tabular-nums' }}>{cur>0?'+':''}{cur}</span>
        {wackelt && <span style={{ fontSize:11, fontWeight:700, color:'var(--strafe)' }}>wackelt</span>}
      </span>
    );
  }

  // small counter chip (e.g. Schweinsbraten)
  function CountChip({ icon, value, label }) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--pergament)',
        border:'1px solid var(--pergament-edge)', borderRadius:'var(--r-pill)', padding:'3px 9px' }}>
        <span style={{ fontSize:12 }}>{icon}</span>
        <span style={{ fontSize:12, fontWeight:800, color:'var(--ink-900)', fontVariantNumeric:'tabular-nums' }}>{value}</span>
        {label && <span style={{ fontSize:11, fontWeight:600, color:'var(--ink-500)' }}>{label}</span>}
      </span>
    );
  }

  // a held badge shown as a small gold disc
  function BadgeDot({ icon, name, size=24 }) {
    return (
      <span title={name} style={{ width:size, height:size, flex:'none', borderRadius:'50%',
        background:'var(--grad-gold)', border:'1.5px solid var(--gold-bright)', boxShadow:'var(--sh-xs)',
        display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:size*0.55 }}>{icon}</span>
    );
  }

  // ── Simple, tappable member row ──────────────────────────────────────
  function MemberCard({ m, rank, s, wp, office, badges, onClick }) {
    const medal = MEDAL[rank];
    return (
      <div onClick={onClick} style={{
        padding:'13px 14px 12px',
        background:'var(--surface-card)', borderRadius:'var(--r-lg)',
        border: m.me ? '1.5px solid var(--muc-blau)' : medal ? '1.5px solid '+medal : '1px solid var(--ink-100)',
        boxShadow: rank<=3 ? 'var(--sh-md)' : 'var(--sh-sm)', cursor:'pointer', fontFamily:'var(--font-ui)',
      }}>
        {/* top row: rank · avatar · name/office · WP */}
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ flex:'none', width:20, textAlign:'center', fontSize:13, fontWeight:800,
            color: medal ? 'var(--gold-700)' : 'var(--ink-400, var(--ink-500))', fontVariantNumeric:'tabular-nums' }}>{rank}</div>
          <Avatar src={m.photo} name={m.name} size={46} ring={rank===1} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--ink-900)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</span>
              {m.me && <Badge tone="blau" solid>Du</Badge>}
            </div>
            <div style={{ fontSize:12, fontWeight:700, color: office ? 'var(--gold-700)' : 'var(--ink-500)', marginTop:2 }}>
              {office ? office.icon+' '+office.label : 'Mitglied'}
            </div>
          </div>
          <div style={{ flex:'none', textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--navy)', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{wp}</div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.1em', color:'var(--gold-700)' }}>WP</div>
          </div>
        </div>

        {/* streak + badges */}
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:5, marginTop:10 }}>
          <StreakChip cur={s.streak} />
          {badges.map(b=>(<BadgeDot key={b.name} icon={b.icon} name={b.name} size={22} />))}
        </div>

        {/* full stat strip */}
        <div style={{ display:'flex', gap:6, marginTop:10 }}>
          {[
            { icon:'🍺', value:s.hoibe,        label:'Hoibe' },
            { icon:'🎟️', value:s.teilnahmen,   label:'Dabei' },
            { icon:'🏠', value:s.wirtshaeuser, label:'Wirtsh.' },
            { icon:'📋', value:s.organisiert,  label:'Orga' },
            { icon:'🍻', value:s.runden,       label:'Runden' },
            { icon:'🐷', value:m.schweinsbraten, label:'Brodn' },
          ].map(st=>(
            <div key={st.label} style={{ flex:1, minWidth:0, textAlign:'center', padding:'7px 2px', background:'var(--pergament)', borderRadius:'var(--r-sm, 8px)' }}>
              <div style={{ fontSize:13 }}>{st.icon}</div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--navy)', lineHeight:1, marginTop:2, fontVariantNumeric:'tabular-nums' }}>{st.value}</div>
              <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.02em', textTransform:'uppercase', color:'var(--ink-500)', marginTop:2 }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Detail dialog (opens on tap) ─────────────────────────────────────
  function StatBox({ icon, value, label }) {
    return (
      <div style={{ flex:1, minWidth:0, textAlign:'center', padding:'12px 4px', background:'var(--pergament)', borderRadius:'var(--r-md)' }}>
        <div style={{ fontSize:18 }}>{icon}</div>
        <div style={{ fontSize:18, fontWeight:800, color:'var(--navy)', fontVariantNumeric:'tabular-nums', lineHeight:1, marginTop:4 }}>{value}</div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:'var(--ink-500)', marginTop:4 }}>{label}</div>
      </div>
    );
  }
  function MemberDetail({ m, rank, s, wp, office, badges, onClose }) {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:18 }}>
        <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(7,25,58,0.55)' }}></div>
        <div className="wn-sheet-in" style={{ position:'relative', width:'100%', maxWidth:344, maxHeight:'88%', overflowY:'auto', background:'var(--weiss)', borderRadius:'var(--r-xl)', boxShadow:'var(--sh-lg)', fontFamily:'var(--font-ui)' }}>
          {/* header */}
          <div style={{ background:'var(--grad-navy)', padding:'20px 20px 18px', position:'relative' }}>
            <button onClick={onClose} aria-label="Schließen" style={{ position:'absolute', top:12, right:12, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.16)', color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer' }}>×</button>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <Avatar src={m.photo} name={m.name} size={58} ring badge={rank===1?'★':null} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:19, fontWeight:800, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--gold-bright)', marginTop:3 }}>{office ? office.icon+' '+office.label : 'Mitglied'} · Platz {rank}</div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontSize:28, fontWeight:800, color:'var(--gold-bright)', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{wp}</div>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.1em', color:'var(--pergament)', opacity:0.8 }}>WP</div>
              </div>
            </div>
          </div>
          {/* body */}
          <div style={{ padding:'16px 18px 20px' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
              <StreakTag cur={s.streak} best={m.bestStreak} big />
            </div>
            {s.streak <= -3 && (
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'10px 12px', background:'var(--strafe-bg)', border:'1px solid var(--strafe)', borderRadius:'var(--r-md)' }}>
                <span style={{ fontSize:20 }}>⚠️</span>
                <span style={{ fontSize:12, fontWeight:600, color:'var(--strafe)', lineHeight:1.4 }}>Dritte Absage in Folge — du wackelst. Mit einer <b>Runde</b> kaufst du dich wieder frei.</span>
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <StatBox icon="🍺" value={s.hoibe} label="Hoibe" />
              <StatBox icon="🎟️" value={s.teilnahmen} label="Teilnahmen" />
              <StatBox icon="🏠" value={s.wirtshaeuser} label="Wirtsh." />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <StatBox icon="📋" value={s.organisiert} label="Organisiert" />
              <StatBox icon="🍻" value={s.runden} label="Runden" />
              <StatBox icon="🐷" value={m.schweinsbraten} label="Schweinsbr." />
            </div>

            {badges.length>0 && (<>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-500)', margin:'18px 0 10px' }}>Saison-Badges</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {badges.map(b=>(
                  <div key={b.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--pergament)', borderRadius:'var(--r-md)' }}>
                    <BadgeDot icon={b.icon} name={b.name} size={30} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-fraktur)', fontSize:18, color:'var(--navy)', lineHeight:1 }}>{b.name}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-500)', marginTop:2 }}>{b.tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        </div>
      </div>
    );
  }

  // navy seal badge for the bottom gallery
  function SeasonBadge({ icon, name, tag, holder }) {
    if (!holder) return null;
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'16px 12px', borderRadius:'var(--r-lg)', background:'var(--grad-navy)', border:'1.5px solid var(--gold)', boxShadow:'var(--sh-md)', fontFamily:'var(--font-ui)' }}>
        <div style={{ width:50, height:50, borderRadius:'var(--r-pill)', background:'var(--grad-gold)', border:'2px solid var(--gold-bright)', boxShadow:'var(--sh-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:25 }}>{icon}</div>
        <div style={{ fontFamily:'var(--font-fraktur)', fontSize:19, color:'var(--gold-bright)', marginTop:10, lineHeight:1.05 }}>{name}</div>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--pergament)', opacity:0.7, marginTop:3 }}>{tag}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10, background:'rgba(255,255,255,0.08)', borderRadius:'var(--r-pill)', padding:'4px 10px 4px 4px' }}>
          <Avatar src={holder.photo} name={holder.name} size={22} />
          <span style={{ fontSize:12, fontWeight:700, color:'var(--pergament)' }}>{holder.name.split(' ')[0]}</span>
        </div>
      </div>
    );
  }

  function RanglisteScreen({ data }) {
    const [season, setSeason] = React.useState('saison');
    const [detailId, setDetailId] = React.useState(null);

    const ranked = data.members
      .map(m=>{ const s = statsFor(m, season); return { m, s, wp: wpOf(s) }; })
      .sort((a,b)=>b.wp-a.wp);

    // office & badge holders
    const byMax = (key)=>data.members.reduce((a,b)=> b[key]>a[key]?b:a);
    const byMin = (key)=>data.members.reduce((a,b)=> b[key]<a[key]?b:a);
    const kassenwart = data.members.find(m=>m.amt==='Kassenwartin');
    const schriftfuehrer = data.members.find(m=>m.amt==='Schriftführer');
    const bestTavern = [...data.taverns].filter(t=>t.besuchtAm).sort((a,b)=>b.rating-a.rating)[0];
    const meisterEder = bestTavern ? data.members.find(m=>m.name===bestTavern.organisator) : null;
    const president = ranked[0].m;

    const offices = [
      { icon:'👑', title:'Präsident', holder:president, mode:'Automatisch', duties:'Zahlt immer zuletzt · entscheidet final · kann Schulden erlassen' },
      { icon:'💰', title:'Kassenwart', holder:kassenwart, mode:'Gewählt', duties:'Pflegt die Kasse · treibt Schulden ein · markiert Ausgaben' },
      { icon:'✒️', title:'Schriftführer', holder:schriftfuehrer, mode:'Gewählt', duties:'Dokumentiert alles Wichtige · gibt Vergaben & Änderungen bekannt' },
    ];
    const badgeDefs = [
      { icon:'🐺', name:'Zacher Hund', tag:'am meisten dabei', holder:byMax('abende') },
      { icon:'🍺', name:'Maximator', tag:'meiste Hoibe', holder:byMax('mass') },
      { icon:'💸', name:'Großbauer', tag:'meiste Runden', holder:byMax('runden') },
      { icon:'😴', name:'Heiwong', tag:'am wenigsten da', holder:byMin('abende') },
      { icon:'⭐', name:'Meister Eder', tag:'bestes Wirtshaus reserviert', holder:meisterEder },
      { icon:'🚕', name:'Taxler', tag:'fährt & nimmt alle mit', holder:byMax('taxi') },
      { icon:'🐷', name:'Die Sau', tag:'meiste Schweinsbraten', holder:byMax('schweinsbraten') },
    ];
    // map member id → badges they hold
    const badgesOf = {};
    badgeDefs.forEach(b=>{ if (b.holder) (badgesOf[b.holder.id] = badgesOf[b.holder.id] || []).push(b); });

    const me = data.members.find(m=>m.me);
    const meStreak = statsFor(me, season).streak;

    const detail = detailId && ranked.find(r=>r.m.id===detailId);

    return (
      <div style={{ padding:'12px 16px 24px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* season filter + own streak tag */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
          <SegmentedTabs value={season} onChange={setSeason}
            tabs={[{label:'Diese Saison',value:'saison'},{label:'Allzeit',value:'all'}]} />
          <StreakTag cur={meStreak} best={me.bestStreak} />
        </div>

        {/* member cards, ranked by WP — tap for details */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ranked.map((r,i)=>(
            <MemberCard key={r.m.id} m={r.m} rank={i+1} s={r.s} wp={r.wp}
              office={officeOf(r.m, i+1)} badges={badgesOf[r.m.id] || []}
              onClick={()=>setDetailId(r.m.id)} />
          ))}
        </div>

        {/* Die Ämter */}
        <div style={{ marginTop:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'0 2px 10px' }}>
            <span style={{ fontFamily:'var(--font-fraktur)', fontSize:22, color:'var(--navy)', lineHeight:1 }}>Die Ämter</span>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--ink-500)' }}>· gewählt & automatisch</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {offices.map(o=>(o.holder &&
              <div key={o.title} style={{ display:'flex', gap:14, background:'var(--surface-card)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-100)', boxShadow:'var(--sh-sm)', padding:14 }}>
                <div style={{ flex:'none', width:52, height:52, borderRadius:'var(--r-pill)', background:'var(--grad-gold)', border:'2px solid var(--gold-bright)', boxShadow:'var(--sh-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{o.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-fraktur)', fontSize:21, color:'var(--navy)', lineHeight:1 }}>{o.title}</span>
                    <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--gold-700)', background:'var(--pergament)', border:'1px solid var(--pergament-edge)', borderRadius:'var(--r-pill)', padding:'3px 8px' }}>{o.mode}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                    <Avatar src={o.holder.photo} name={o.holder.name} size={28} ring />
                    <span style={{ fontSize:14, fontWeight:800, color:'var(--ink-900)' }}>{o.holder.name}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--ink-500)', marginTop:8, lineHeight:1.45 }}>{o.duties}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saison-Badges — auto-awarded gallery */}
        <div style={{ marginTop:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'0 2px 10px' }}>
            <span style={{ fontFamily:'var(--font-fraktur)', fontSize:22, color:'var(--navy)', lineHeight:1 }}>Saison-Badges</span>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--ink-500)' }}>· wandern automatisch weiter</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {badgeDefs.map(b=>(<SeasonBadge key={b.name} icon={b.icon} name={b.name} tag={b.tag} holder={b.holder} />))}
          </div>
        </div>

        {detail && <MemberDetail m={detail.m} rank={ranked.indexOf(detail)+1} s={detail.s} wp={detail.wp}
          office={officeOf(detail.m, ranked.indexOf(detail)+1)} badges={badgesOf[detail.m.id] || []}
          onClose={()=>setDetailId(null)} />}
      </div>
    );
  }
  window.RanglisteScreen = RanglisteScreen;
})();
