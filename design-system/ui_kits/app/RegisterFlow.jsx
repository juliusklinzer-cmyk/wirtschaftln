// Wirtschaftln — RegisterFlow: multi-step Aufnahme-Antrag + Servus reveal.
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { Button, Input, Switch, Avatar, Badge } = DS;
  const Icon = window.WNIcon;
  const data = window.WN_DATA;

  const DRINKS = [
    { key: 'helles', label: 'Helles', icon: '🍺' },
    { key: 'weissbier', label: 'Weißbier', icon: '🌾' },
    { key: 'radler', label: 'Radler', icon: '🍋' },
    { key: 'dunkles', label: 'Dunkles', icon: '🟤' },
  ];
  const STEPS = ['Persönliches', 'Dein Auftritt', 'Bierkultur', 'Aufnahme', 'Kodex'];

  // --- little building blocks -------------------------------------------
  function FieldLabel({ children }) {
    return <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 8 }}>{children}</div>;
  }
  function OptionPill({ active, icon, label, sub, onClick }) {
    return (
      <button type="button" onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        padding: '12px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer',
        border: active ? '1.5px solid var(--muc-blau)' : '1.5px solid var(--ink-200)',
        background: active ? 'var(--info-bg)' : 'var(--weiss)',
        transition: 'all var(--dur-base) var(--ease-standard)',
      }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{label}</span>
          {sub && <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>{sub}</span>}
        </span>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', flex: 'none',
          border: active ? 'none' : '2px solid var(--ink-200)',
          background: active ? 'var(--muc-blau)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{active && <Icon name="check" size={14} color="#fff" stroke={3} />}</span>
      </button>
    );
  }

  // --- the Servus reveal -------------------------------------------------
  function ServusReveal({ form, onEnter, onClose }) {
    const confetti = [];
    for (let i = 0; i < 14; i++) {
      const left = 6 + (i * 6.4) % 88;
      const gold = i % 2 === 0;
      confetti.push(<span key={i} className="wn-confetti" style={{
        left: left + '%', background: gold ? 'var(--gold)' : 'var(--muc-blau)',
        animationDelay: (0.5 + (i % 5) * 0.12) + 's', width: gold ? 9 : 7, height: gold ? 9 : 7,
        borderRadius: i % 3 === 0 ? '50%' : '2px',
      }} />);
    }
    return (
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--grad-navy)' }}>
        <div className="wn-raute wn-raute--sm" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8 }}></div>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>{confetti}</div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 28px', position: 'relative', zIndex: 2 }}>
          {/* photo pops in a gold ring */}
          <div className="wn-reveal-photo" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: 'var(--grad-gold)', filter: 'blur(2px)', opacity: 0.55 }}></div>
            <div style={{ position: 'relative', borderRadius: '50%', padding: 5, background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)' }}>
              <Avatar src={form.photo} name={form.spitzname || form.vorname || '?'} size={132} style={{ border: '3px solid var(--navy-900)', borderRadius: '50%' }} />
            </div>
          </div>

          <div className="wn-reveal-servus" style={{ fontFamily: 'var(--font-fraktur)', fontSize: 64, color: 'var(--gold-bright)', lineHeight: 1, marginTop: 26, textShadow: '0 4px 18px rgba(0,0,0,0.4)' }}>
            Servus!
          </div>

          <div className="wn-reveal-name" style={{ marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--weiss)', letterSpacing: '-0.02em' }}>
              „{form.spitzname || form.vorname || 'Neimitglied'}“
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pergament)', opacity: 0.8, marginTop: 4 }}>
              {form.vorname} {form.nachname}
            </div>
          </div>

          <div className="wn-reveal-name" style={{ marginTop: 22, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {form.drink && <Badge tone="gold" solid>{DRINKS.find(d => d.key === form.drink)?.icon} {DRINKS.find(d => d.key === form.drink)?.label}</Badge>}
            {form.buerge && <Badge tone="blau" solid>Bürge: {form.buerge.split(' ')[0]}</Badge>}
          </div>
        </div>

        {/* bottom status sheet */}
        <div className="wn-reveal-name" style={{ position: 'relative', zIndex: 2, background: 'var(--weiss)', borderRadius: '24px 24px 0 0', padding: '20px 24px calc(22px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(7,25,58,0.4)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>📜</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Dei Antrag is raus!</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', marginTop: 2 }}>Der Stammtisch stimmt beim nächsten Treffen über deine Aufnahme ab. Schee, dass d’ dabei sein magst.</div>
            </div>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={onEnter}>App-Vorschau ansehen</Button>
          <Button variant="ghost" size="md" fullWidth onClick={onClose} style={{ marginTop: 8 }}>Zurück zum Login</Button>
        </div>
      </div>
    );
  }

  // --- main flow ---------------------------------------------------------
  function RegisterFlow({ onLogin, onClose }) {
    const [step, setStep] = React.useState(0);
    const [done, setDone] = React.useState(false);
    const fileRef = React.useRef(null);
    const [form, setForm] = React.useState({
      vorname: '', nachname: '', jahr: '', bezirk: '',
      spitzname: '', photo: null,
      drink: 'helles', wirtshaus: '',
      buerge: '', warum: '',
      r1: false, r2: false, r3: false,
    });
    const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

    function pickFile(e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => set('photo', r.result);
      r.readAsDataURL(f);
    }

    const canNext = [
      form.vorname.trim().length > 0,
      form.spitzname.trim().length > 0,
      !!form.drink,
      form.buerge.length > 0,
      form.r1 && form.r2 && form.r3,
    ][step];

    function next() {
      if (step < STEPS.length - 1) setStep(step + 1);
      else { window.WNAuth.saveProfile(form); setDone(true); }
    }
    function back() {
      if (step > 0) setStep(step - 1);
      else onClose();
    }

    if (done) return <ServusReveal form={form} onEnter={() => { window.WNAuth.login(); onLogin(); }} onClose={onClose} />;

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
        {/* header */}
        <div style={{ flex: 'none', padding: '6px 18px 14px', borderBottom: '1px solid var(--ink-100)', background: 'var(--weiss)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={back} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-500)', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, padding: 4 }}>
              <Icon name="back" size={20} /> {step === 0 ? 'Abbrechen' : 'Zurück'}
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-400, var(--ink-500))', letterSpacing: '0.04em' }}>Schritt {step + 1} / {STEPS.length}</span>
          </div>
          {/* progress */}
          <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? 'var(--muc-blau)' : 'var(--ink-100)', transition: 'background var(--dur-base)' }}></div>
            ))}
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginTop: 12 }}>{STEPS[step]}</div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 0 && (<>
            <Input label="Vorname" value={form.vorname} onChange={e => set('vorname', e.target.value)} placeholder="z.B. Korbinian" />
            <Input label="Nachname" value={form.nachname} onChange={e => set('nachname', e.target.value)} placeholder="z.B. Hofbauer" />
            <div style={{ display: 'flex', gap: 12 }}>
              <Input label="Geburtsjahr" value={form.jahr} onChange={e => set('jahr', e.target.value)} placeholder="1990" style={{ flex: 1 }} />
              <Input label="Stadtviertel" value={form.bezirk} onChange={e => set('bezirk', e.target.value)} placeholder="Haidhausen" style={{ flex: 1 }} />
            </div>
          </>)}

          {step === 1 && (<>
            <div>
              <FieldLabel>Dein Foto</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar src={form.photo} name={form.spitzname || form.vorname || '?'} size={84} ring={!!form.photo} />
                <div style={{ flex: 1 }}>
                  <Button variant="secondary" size="md" onClick={() => fileRef.current && fileRef.current.click()} iconLeft="📷">
                    {form.photo ? 'Anderes Bild' : 'Bild hochladen'}
                  </Button>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 6 }}>Zeig dein Gsicht — gilt fürs Mitgliederbuch.</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{ display: 'none' }} />
              </div>
            </div>
            <Input label="Spitzname" value={form.spitzname} onChange={e => set('spitzname', e.target.value)} placeholder="z.B. Der Korbi" hint="So steht's auf der Rangliste." />
          </>)}

          {step === 2 && (<>
            <div>
              <FieldLabel>Stamm-Getränk</FieldLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {DRINKS.map(d => (
                  <OptionPill key={d.key} active={form.drink === d.key} icon={d.icon} label={d.label} onClick={() => set('drink', d.key)} />
                ))}
              </div>
            </div>
            <Input label="Lieblings-Wirtshaus" value={form.wirtshaus} onChange={e => set('wirtshaus', e.target.value)} placeholder="z.B. Augustiner-Keller" iconLeft="🍺" />
          </>)}

          {step === 3 && (<>
            <div>
              <FieldLabel>Wer bürgt für dich?</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.members.slice(0, 5).map(m => (
                  <OptionPill key={m.id} active={form.buerge === m.name} label={m.name} sub={m.amt || 'Mitglied'} onClick={() => set('buerge', m.name)} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Warum willst du dabei sein?</FieldLabel>
              <textarea value={form.warum} onChange={e => set('warum', e.target.value)} placeholder="Ein, zwei Sätze für die Runde…" rows={3}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', padding: 12, fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink-900)', resize: 'none', outline: 'none' }} />
            </div>
          </>)}

          {step === 4 && (<>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 2 }}>Der Stammtisch-Kodex. Ohne den geht nix.</div>
            {[
              ['r1', 'Hoibe ehrlich zählen', 'Kein Schummeln bei der Rangliste.'],
              ['r2', 'Zugesagt heißt erschienen', 'Wer absagt und nicht kommt, zahlt in die Kasse.'],
              ['r3', 'Nie zweimal dasselbe Wirtshaus', 'Jeden Stammtisch ein neues Wirtshaus.'],
            ].map(([k, t, s]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-md)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{t}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-500)', marginTop: 2 }}>{s}</div>
                </div>
                <Switch checked={form[k]} onChange={v => set(k, v)} />
              </div>
            ))}
          </>)}
        </div>

        {/* footer */}
        <div style={{ flex: 'none', padding: '14px 18px calc(18px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--ink-100)', background: 'var(--weiss)' }}>
          <Button variant={step === STEPS.length - 1 ? 'gold' : 'primary'} size="lg" fullWidth disabled={!canNext} onClick={next}
            iconLeft={step === STEPS.length - 1 ? '🍺' : null}>
            {step === STEPS.length - 1 ? 'Antrag absenden' : 'Weiter'}
          </Button>
        </div>
      </div>
    );
  }
  window.RegisterFlow = RegisterFlow;
})();
