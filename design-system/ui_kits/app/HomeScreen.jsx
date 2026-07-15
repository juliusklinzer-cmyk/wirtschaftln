// Wirtschaftln — Home / "Heute" screen
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { Card, Stat, VotePill, BeerCounter, Button, RankRow, Badge } = DS;
  const Icon = window.WNIcon;

  function HomeScreen({ data, store, onNav }) {
    const n = data.naechster;
    const t = store && store.termin;
    const venue = t ? (t.wirtshaus ? t.wirtshaus.name : 'organisiert von ' + t.planer.split(' ')[0]) : n.wirtshaus;
    const datum = t ? t.datum.split(',')[0] : n.datum;
    const zeit = t ? t.zeit : n.zeit;
    const ort = t && t.wirtshaus ? t.wirtshaus.bezirk : n.bezirk;
    const reserviert = t && t.wirtshaus;
    const me = data.members.find(m => m.me);
    const [vote, setVote] = React.useState(me.vote || 'zu');
    const [mass, setMass] = React.useState(0);
    // RSVP tally — same source as the Termin screen, with your live answer applied
    const tally = { zu:0, vielleicht:0, ab:0 };
    data.members.forEach(m => { tally[m.id===me.id ? vote : m.vote]++; });
    const top = [...data.members].sort((a,b)=>b.mass-a.mass).slice(0,3);

    return (
      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero — next Stammtisch */}
        <Card tone="dark" pad={0} style={{ overflow: 'hidden' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 8 }}></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Nächster Stammtisch</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize: 12, fontWeight: 700, color: 'var(--pergament)', background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'var(--r-pill)' }}>
                <Icon name="clock" size={14} color="var(--gold-bright)" /> in 12 Tagen
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: reserviert ? 30 : 24, color: 'var(--gold-bright)', marginTop: 10, lineHeight: 1.25 }}>{venue}</div>
            <div style={{ display:'flex', gap:14, marginTop: 8, color: 'var(--pergament)', fontSize: 14, fontWeight: 600, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Icon name="calendar" size={15} color="var(--gold)" />{datum}, {zeit}</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Icon name="pin" size={15} color="var(--gold)" />{ort}</span>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:14, marginBottom:14 }}>
              <Badge tone="erfolg" solid>{tally.zu} zugesagt</Badge>
              <Badge tone="warnung" solid>{tally.vielleicht} vielleicht</Badge>
              <Badge tone="strafe" solid>{tally.ab} abgesagt</Badge>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing:'0.08em', textTransform:'uppercase', color: 'rgba(246,240,226,0.6)', marginBottom: 8 }}>Deine Antwort</div>
            <VotePill value={vote} onChange={setVote} />
          </div>
        </Card>

        {/* Your season */}
        <Card tone="white" pad={18}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Deine Saison</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:13, fontWeight:800, color:'var(--gold-700)' }}>
              <Icon name="flame" size={16} color="var(--gold)" /> 6 Abende in Folge
            </span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <Stat value={me.mass} label="Hoibe" tone="blau" align="center" />
            <Stat value={me.abende} label="Abende" tone="ink" align="center" />
            <Stat value={me.wirtshaeuser} label="Wirtsh." tone="gold" align="center" />
            <Stat value="2." label="Rang" tone="blau" align="center" />
          </div>
        </Card>

        {/* Mini leaderboard */}
        <Card tone="white" pad={14}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'2px 4px 10px' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Hoibe-Spezln</span>
            <Button size="sm" variant="ghost" onClick={()=>onNav('rang')} iconRight={<Icon name="chevron" size={16} />}>Alle</Button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {top.map((m,i)=>(<RankRow key={m.id} rank={i+1} name={m.name} photo={m.photo} value={m.mass} amt={m.amt} me={m.me} />))}
          </div>
        </Card>

        {/* Wirtschaftler melden */}
        <button onClick={()=>store && store.reportMember()} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', padding:'14px 16px', background:'var(--weiss)', border:'1px solid var(--ink-100)', borderRadius:'var(--r-lg)', boxShadow:'var(--sh-sm)', cursor:'pointer', fontFamily:'var(--font-ui)' }}>
          <span style={{ width:40, height:40, flex:'none', borderRadius:'var(--r-md)', background:'var(--strafe-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⚖️</span>
          <span style={{ flex:1 }}>
            <span style={{ display:'block', fontSize:15, fontWeight:800, color:'var(--ink-900)' }}>Wirtschaftler melden</span>
            <span style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--ink-500)' }}>Verstoß eintragen — PayPal-Link & Mail gehen raus</span>
          </span>
          <Icon name="chevron" size={18} color="var(--ink-300)" />
        </button>
      </div>
    );
  }
  window.HomeScreen = HomeScreen;
})();
