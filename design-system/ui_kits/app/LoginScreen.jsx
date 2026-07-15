// Wirtschaftln — LoginScreen: gate. Only members get in; others apply.
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const { Button, Input } = DS;
  const Icon = window.WNIcon;

  function LoginScreen({ onLogin, onRegister }) {
    const [email, setEmail] = React.useState('resi@wirtschaftln.de');
    const [pw, setPw] = React.useState('servus');

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* dark brand top */}
        <div style={{ position: 'absolute', inset: 0, background: 'var(--grad-navy)' }}></div>
        <div className="wn-raute wn-raute--sm" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, opacity: 0.85 }}></div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 28px 18px' }}>
          {/* crest + wordmark */}
          <div style={{ textAlign: 'center', marginBottom: 'auto', marginTop: 28 }}>
            <img src="../../assets/wirtschaftln-logo-verziert.png" alt="Wirtschaftln" style={{ height: 188, filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.4))' }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 40, color: 'var(--gold-bright)', lineHeight: 1 }}>Wirtschaftln</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--pergament)', opacity: 0.75, marginTop: 8 }}>
              Münchner Stammtisch · seit 2019
            </div>
          </div>
        </div>

        {/* sheet with form */}
        <div style={{
          position: 'relative', background: 'var(--weiss)', borderRadius: '24px 24px 0 0',
          padding: '22px 24px calc(22px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(7,25,58,0.35)',
        }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 2 }}>Servus, eini mit dir!</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', marginBottom: 16 }}>Nur für Stammtisch-Mitglieder. Mit Account anmelden.</div>

          <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} iconLeft={<Icon name="users" size={17} />} type="email" />
            <Input label="Passwort" value={pw} onChange={(e) => setPw(e.target.value)} type="password" iconLeft={<Icon name="check" size={17} />} />
            <Button type="submit" variant="primary" size="lg" fullWidth style={{ marginTop: 4 }}>Einloggen</Button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }}></span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-300)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>oder</span>
            <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }}></span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 10 }}>Noch nicht dabei? Stell einen Antrag.</div>
            <Button variant="gold" size="lg" fullWidth onClick={onRegister} iconLeft="🍺">Mitglied werden</Button>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-300)', marginTop: 10 }}>
              Aufnahme nur mit Bürgen aus der Runde.
            </div>
          </div>
        </div>
      </div>
    );
  }
  window.LoginScreen = LoginScreen;
})();
