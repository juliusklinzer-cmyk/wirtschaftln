// Wirtschaftln — Root: auth gate. Login/Register when logged out, app when in.
(function () {
  const PhoneFrame = window.PhoneFrame;

  function Root() {
    const [authed, setAuthed] = React.useState(window.WNAuth.isLoggedIn());
    const [view, setView] = React.useState('login'); // 'login' | 'register'

    if (authed) {
      const AppShell = window.AppShell;
      return <AppShell onLogout={() => { window.WNAuth.logout(); setAuthed(false); setView('login'); }} />;
    }

    const LoginScreen = window.LoginScreen;
    const RegisterFlow = window.RegisterFlow;
    const statusColor = view === 'login' ? 'var(--pergament)' : 'var(--ink-900)';
    return (
      <PhoneFrame statusColor={statusColor} bg={view === 'login' ? 'var(--navy-900)' : 'var(--bg-app)'}>
        {view === 'login'
          ? <LoginScreen
              onLogin={() => { window.WNAuth.login(); setAuthed(true); }}
              onRegister={() => setView('register')} />
          : <RegisterFlow
              onLogin={() => setAuthed(true)}
              onClose={() => setView('login')} />}
      </PhoneFrame>
    );
  }
  window.Root = Root;
})();
