// Wirtschaftln — PhoneFrame: shared device bezel + status bar.
// Children fill the area below the status bar (flex column).
(function () {
  function PhoneFrame({ children, statusColor = 'var(--ink-900)', bg = 'var(--bg-app)' }) {
    return (
      <div style={{
        width: 390, height: 'min(844px, 96vh)', background: bg, borderRadius: 38,
        boxShadow: '0 40px 90px rgba(12,43,90,0.30), 0 0 0 11px #0c0f14, 0 0 0 13px #2a2f38',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
        fontFamily: 'var(--font-ui)',
      }}>
        {/* status bar */}
        <div style={{
          height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 26px 0', flex: 'none', fontSize: 14, fontWeight: 700, color: statusColor, zIndex: 20,
        }}>
          <span>9:41</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>▮▮▮ ▿ ▮</span>
        </div>
        {children}
      </div>
    );
  }
  window.PhoneFrame = PhoneFrame;
})();
