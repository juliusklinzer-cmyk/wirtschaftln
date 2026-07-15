// Wirtschaftln — Termin screen: full lifecycle (Planung → reserviert → heute → abgeschlossen)
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { Card, Avatar, Badge, Button, VotePill } = DS;
  const Icon = window.WNIcon;
  const T = window.WNTermin;
  const S = window.WNSheets;

  const voteMeta = {
    zu: { label:'Zugesagt', color:'var(--erfolg)', bg:'var(--erfolg-bg)' },
    vielleicht: { label:'Vielleicht', color:'var(--warnung)', bg:'var(--warnung-bg)' },
    ab: { label:'Abgesagt', color:'var(--strafe)', bg:'var(--strafe-bg)' },
  };

  function DateChip({ datum }) {
    const tag = datum.split('.')[0].split(',').pop().trim();
    return (
      <div style={{ width:58, height:58, flex:'none', borderRadius:'var(--r-md)', background:'var(--grad-blau)', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-sm)' }}>
        <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Juli</span>
        <span style={{ fontSize:24, fontWeight:800, lineHeight:1 }}>{tag}</span>
      </div>
    );
  }

  function TerminScreen({ data, store }) {
    const termin = store.termin;
    const me = data.members.find(m=>m.me);
    const isPlaner = me.id === termin.planerId;
    const [vote, setVote] = React.useState(me.vote || 'zu');

    const present = data.members.filter(m => (m.id===me.id ? vote : m.vote) === 'zu');
    const order = { zu:0, vielleicht:1, ab:2 };
    const members = [...data.members].sort((a,b)=>order[a.id===me.id?vote:a.vote]-order[b.id===me.id?vote:b.vote]);
    const tally = { zu:0, vielleicht:0, ab:0 };
    data.members.forEach(m => { tally[m.id===me.id?vote:m.vote]++; });

    function addToCalendar() {
      const a = document.createElement('a');
      a.href = T.makeICS(termin); a.download = 'stammtisch.ics';
      document.body.appendChild(a); a.click(); a.remove();
      store.toast('📅 Kalender-Datei erstellt — mit Adresse & Uhrzeit');
    }
    function openAddWirtshaus() {
      store.openSheet(<S.AddWirtshausSheet onClose={store.closeSheet} onPick={(w)=>{
        store.setTermin({ ...termin, wirtshaus:w, phase:'reserviert' });
        store.closeSheet(); store.toast('🍺 ' + w.name + ' reserviert');
      }} />);
    }
    function openNewTermin() {
      store.openSheet(<S.NewTerminSheet members={data.members} onClose={store.closeSheet} onCreate={(t)=>{
        store.setTermin({ ...T.INITIAL, ...t, wirtshaus:null, phase:'planung' });
        store.closeSheet(); store.toast('✓ Neuer Termin — ' + t.planer + ' plant');
      }} />);
    }
    function openCloseVisit() {
      store.openSheet(<S.CloseVisitSheet participants={present} wirtshaus={termin.wirtshaus} onClose={store.closeSheet} onSave={(res)=>{
        store.activateTavern({ name:termin.wirtshaus.name, bezirk:termin.wirtshaus.bezirk, rating:res.stars||4, kaiser:(res.kaiserschmarrn && res.kaiserschmarrn.stars)||0, brodn:(res.schweinsbraten && res.schweinsbraten.stars)||0, organisator:termin.planer, x:termin.wirtshaus.x, y:termin.wirtshaus.y });
        store.setTermin({ ...termin, phase:'abgeschlossen', visit:{ totalHoiben:res.totalHoiben, stars:res.stars, text:res.text } });
        store.closeSheet(); store.toast('🏅 Besuch im Archiv & auf der Karte');
      }} />);
    }
    function openPenalty() {
      store.openSheet(<S.PenaltyDialog anwesend={present.length} onClose={store.closeSheet} onSend={()=>{
        store.addPenalty({ id:'p'+Date.now(), name:me.name, photo:me.photo, grund:'Strafrunde – Absage unter 24 h', betrag:-(T.HOIBE_PREIS*present.length), datum:'heute', paid:false });
        setVote('ab'); store.closeSheet(); store.toast('✉️ Strafrunde-Mail an die Runde gesendet');
      }} />);
    }

    // ---------- Proposal / status card per phase ----------
    function ProposalCard() {
      if (termin.phase === 'planung') {
        return (
          <Card tone="parchment" framed pad={20}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold-700)' }}>Nächster Stammtisch</span>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:12 }}>
              <DateChip datum={termin.datum} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:18, fontWeight:800, color:'var(--ink-900)' }}>{termin.datum.split(',')[0]}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--ink-500)', marginTop:2 }}>{termin.zeit} Uhr</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16, padding:'12px 14px', background:'rgba(0,106,179,0.06)', borderRadius:'var(--r-md)', border:'1px dashed var(--muc-blau)' }}>
              <Avatar src={data.members.find(m=>m.id===termin.planerId)?.photo} name={termin.planer} size={36} ring />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink-500)' }}>Wirtshaus offen</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--muc-blau)' }}>organisiert von {termin.planer.split(' ')[0]}</div>
              </div>
            </div>
            {isPlaner
              ? <Button variant="gold" size="lg" fullWidth onClick={openAddWirtshaus} iconLeft={<Icon name="pin" size={17} />} style={{ marginTop:14 }}>Wirtshaus festlegen</Button>
              : <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-500)', marginTop:14, textAlign:'center' }}>{termin.planer.split(' ')[0]} legt das Wirtshaus noch fest.</div>}
          </Card>
        );
      }
      // reserviert / heute / abgeschlossen all show the venue
      const w = termin.wirtshaus;
      const closed = termin.phase === 'heute' || termin.phase === 'abgeschlossen';
      return (
        <Card tone="parchment" framed pad={20}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold-700)' }}>Nächster Stammtisch</span>
            {termin.phase==='abgeschlossen'
              ? <Badge tone="blau" solid iconLeft="✓">Besucht</Badge>
              : <Badge tone="gold" solid iconLeft="✓">Reserviert</Badge>}
          </div>
          <div style={{ fontFamily:'var(--font-fraktur)', fontSize:26, color:'var(--navy)', marginTop:10, lineHeight:1.3 }}>{w.name}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600, color:'var(--ink-700)' }}><Icon name="calendar" size={15} color="var(--gold-700)" />{termin.datum.split(',')[0]}, {termin.zeit} Uhr</span>
            <span style={{ display:'inline-flex', alignItems:'flex-start', gap:8, fontSize:13, fontWeight:500, color:'var(--ink-500)' }}><Icon name="pin" size={15} color="var(--gold-700)" />{w.adresse}</span>
          </div>
          {!closed && (
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <Button variant="secondary" size="md" fullWidth onClick={addToCalendar} iconLeft={<Icon name="calendar" size={16} />}>Zum Kalender</Button>
              {isPlaner && <Button variant="ghost" size="md" onClick={openAddWirtshaus}>Ändern</Button>}
            </div>
          )}
        </Card>
      );
    }

    return (
      <div style={{ padding:'8px 16px 24px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* header action */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-500)' }}>{data.saison}</div>
          <Button size="sm" variant="ghost" onClick={openNewTermin} iconLeft={<Icon name="plus" size={15} />}>Neuer Termin</Button>
        </div>

        <ProposalCard />

        {/* registration-closed banner on meeting day */}
        {termin.phase === 'heute' && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--navy)', borderRadius:'var(--r-md)' }}>
            <Icon name="clock" size={20} color="var(--gold-bright)" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--gold-bright)' }}>Anmeldung geschlossen</div>
              <div style={{ fontSize:12, fontWeight:500, color:'var(--pergament)', opacity:0.8 }}>Heut is Stammtisch. Jetzt zählt's.</div>
            </div>
          </div>
        )}

        {/* PHASE: voting (planung + reserviert) */}
        {(termin.phase === 'planung' || termin.phase === 'reserviert') && (<>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-500)', margin:'0 4px 8px' }}>Hast du Zeit?</div>
            <VotePill value={vote} onChange={setVote} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {['zu','vielleicht','ab'].map(k=>(
              <div key={k} style={{ flex:1, textAlign:'center', padding:'12px 6px', background:voteMeta[k].bg, borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:26, fontWeight:800, color:voteMeta[k].color, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{tally[k]}</div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:voteMeta[k].color, marginTop:4 }}>{voteMeta[k].label}</div>
              </div>
            ))}
          </div>
          {/* demo: jump to meeting day */}
          {termin.phase === 'reserviert' && (
            <button onClick={()=>store.setTermin({ ...termin, phase:'heute' })} style={{ alignSelf:'center', border:'none', background:'transparent', color:'var(--ink-300)', fontSize:12, fontWeight:700, cursor:'pointer', textDecoration:'underline', padding:6 }}>
              Demo → Tag des Treffens
            </button>
          )}
        </>)}

        {/* PHASE: heute → close out / cancel */}
        {termin.phase === 'heute' && (<>
          <Button variant="gold" size="lg" fullWidth onClick={openCloseVisit} iconLeft="🍺">Besuch abschließen</Button>
          <button onClick={openPenalty} style={{ border:'none', background:'transparent', color:'var(--strafe)', fontSize:13, fontWeight:700, cursor:'pointer', padding:6 }}>
            Doch absagen? Kostet a Strafrunde
          </button>
        </>)}

        {/* PHASE: abgeschlossen → summary */}
        {termin.phase === 'abgeschlossen' && termin.visit && (
          <Card tone="dark" pad={20}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)' }}>Abend dokumentiert</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:34, fontWeight:800, color:'var(--gold-bright)', lineHeight:1 }}>{termin.visit.totalHoiben}</div><div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--pergament)', opacity:0.7, marginTop:4 }}>Hoiben</div></div>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:34, fontWeight:800, color:'var(--gold-bright)', lineHeight:1 }}>{termin.visit.stars||'–'}<span style={{ fontSize:18 }}>★</span></div><div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--pergament)', opacity:0.7, marginTop:4 }}>Bewertung</div></div>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:34, fontWeight:800, color:'var(--gold-bright)', lineHeight:1 }}>{present.length}</div><div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--pergament)', opacity:0.7, marginTop:4 }}>Dabei</div></div>
            </div>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--pergament)', opacity:0.85, marginTop:16, textAlign:'center' }}>Im Archiv hinterlegt & auf der Karte aktiviert.</div>
            <Button variant="gold" size="md" fullWidth onClick={openNewTermin} style={{ marginTop:14 }}>Nächsten Termin festlegen</Button>
          </Card>
        )}

        {/* member responses (always) */}
        <Card tone="white" pad={8}>
          {members.map((m,i)=>{
            const v = m.id===me.id?vote:m.vote;
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 8px', borderTop: i? '1px solid var(--ink-100)':'none' }}>
                <Avatar src={m.photo} name={m.name} size={40} ring={m.ring} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--ink-900)' }}>{m.name}{m.me && <span style={{color:'var(--muc-blau)'}}> · Du</span>}{m.id===termin.planerId && <span style={{ fontSize:12, color:'var(--gold-700)' }}> · plant</span>}</div>
                </div>
                <span style={{ fontSize:12, fontWeight:800, padding:'4px 10px', borderRadius:'var(--r-pill)', background:voteMeta[v].bg, color:voteMeta[v].color }}>{voteMeta[v].label}</span>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }
  window.TerminScreen = TerminScreen;
})();
