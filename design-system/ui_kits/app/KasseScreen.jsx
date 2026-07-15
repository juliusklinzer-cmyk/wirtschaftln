// Wirtschaftln — Vereinskasse (Bierkasse) screen
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { KasseEntry, Card, Button } = DS;
  const Icon = window.WNIcon;

  function KasseScreen({ data, store }) {
    const entries = store && store.kasse ? store.kasse : data.kasse.entries;
    const k = { saldo: store && store.saldo != null ? store.saldo : data.kasse.saldo, entries };
    const offen = k.entries.filter(e=>e.betrag<0 && !e.paid);
    const offenSum = offen.reduce((s,e)=>s+Math.abs(e.betrag),0);

    return (
      <div style={{ padding:'8px 16px 24px', display:'flex', flexDirection:'column', gap:16 }}>
        <Card tone="dark" pad={22} style={{ textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)' }}>Vereinskasse</div>
          <div style={{ fontSize:48, fontWeight:800, color:'var(--gold-bright)', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em', marginTop:6 }}>
            {k.saldo.toFixed(2).replace('.',',')} €
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--pergament)', opacity:0.8, marginTop:4 }}>verwaltet von Resi Gruber</div>
        </Card>

        {offen.length>0 && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--strafe-bg)', borderRadius:'var(--r-md)', border:'1px solid #F3C7C1' }}>
            <span style={{ fontSize:22 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--strafe)' }}>{offen.length} offene Strafen · {offenSum.toFixed(2).replace('.',',')} €</div>
              <div style={{ fontSize:12, fontWeight:600, color:'#A93226' }}>Bitte bis zum nächsten Stammtisch begleichen</div>
            </div>
          </div>
        )}

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'0 4px 8px' }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-500)' }}>Bewegungen</span>
            <div style={{ display:'flex', gap:8 }}>
              <Button size="sm" variant="secondary" iconLeft="🧾" onClick={()=>store && store.addAusgabe()}>Ausgabe</Button>
              <Button size="sm" variant="danger" iconLeft="⚖️" onClick={()=>store && store.reportMember()}>Melden</Button>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {k.entries.map(e=>(<KasseEntry key={e.id} name={e.name} photo={e.photo} grund={e.grund} betrag={e.betrag} datum={e.datum} paid={e.paid} status={e.status} gemeldet={e.gemeldet} kind={e.kind} icon={e.icon}
              onClick={e.betrag<0 && e.kind!=='ausgabe' && store ? ()=>store.openForderung(e) : undefined} />))}
          </div>
        </div>
      </div>
    );
  }
  window.KasseScreen = KasseScreen;
})();
