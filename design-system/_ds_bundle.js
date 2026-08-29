/* @ds-bundle: {"format":4,"namespace":"WirtschaftlnDesignSystem_7e7aff","components":[{"name":"CrestMark","sourcePath":"components/brand/CrestMark.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"SectionHeader","sourcePath":"components/core/SectionHeader.jsx"},{"name":"SegmentedTabs","sourcePath":"components/core/SegmentedTabs.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"},{"name":"AmtBadge","sourcePath":"components/domain/AmtBadge.jsx"},{"name":"BeerCounter","sourcePath":"components/domain/BeerCounter.jsx"},{"name":"KasseEntry","sourcePath":"components/domain/KasseEntry.jsx"},{"name":"PersonCard","sourcePath":"components/domain/PersonCard.jsx"},{"name":"RankRow","sourcePath":"components/domain/RankRow.jsx"},{"name":"VotePill","sourcePath":"components/domain/VotePill.jsx"},{"name":"StarRating","sourcePath":"components/domain/WirtshausCard.jsx"},{"name":"WirtshausCard","sourcePath":"components/domain/WirtshausCard.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/brand/CrestMark.jsx":"2f6bb5b7e491","components/core/Avatar.jsx":"6d1b5e803a75","components/core/Badge.jsx":"64ffdb511ca5","components/core/Button.jsx":"1628dfd9a0b9","components/core/Card.jsx":"a217c8bbb321","components/core/IconButton.jsx":"16a943f6b465","components/core/SectionHeader.jsx":"5eeef9f8b24a","components/core/SegmentedTabs.jsx":"6a4b109b0c3d","components/core/Stat.jsx":"9fb4c3aef318","components/domain/AmtBadge.jsx":"ada70a406eec","components/domain/BeerCounter.jsx":"672afc042d55","components/domain/KasseEntry.jsx":"0ecaea7f7f02","components/domain/PersonCard.jsx":"b63b535e5e04","components/domain/RankRow.jsx":"ad0b1a486776","components/domain/VotePill.jsx":"e1121077d640","components/domain/WirtshausCard.jsx":"5dfb3feb0944","components/forms/Input.jsx":"8b03d8bea5ba","components/forms/Switch.jsx":"c639118ef276","ui_kits/app/AppShell.jsx":"429a8be32256","ui_kits/app/HomeScreen.jsx":"e7829b39a32c","ui_kits/app/KasseScreen.jsx":"8258c4ef2694","ui_kits/app/LoginScreen.jsx":"984178e98b07","ui_kits/app/PhoneFrame.jsx":"703d93b162d0","ui_kits/app/RanglisteScreen.jsx":"be0b4bb25927","ui_kits/app/RegisterFlow.jsx":"8858badd3cfd","ui_kits/app/Root.jsx":"098fbc95c250","ui_kits/app/TerminScreen.jsx":"aa96c0f10906","ui_kits/app/WirtshausScreen.jsx":"55891d16266f","ui_kits/app/auth.js":"b56830bc500f","ui_kits/app/data.js":"3cf0f33cf0c3","ui_kits/app/icons.jsx":"4bbf43de0309","ui_kits/app/terminSheets.jsx":"fbd53be9f4b8","ui_kits/app/terminStore.js":"14de0f09e016"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.WirtschaftlnDesignSystem_7e7aff = window.WirtschaftlnDesignSystem_7e7aff || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/CrestMark.jsx
try { (() => {
/**
 * Wirtschaftln — CrestMark
 * Typographic lockup of the club wordmark in Fraktur + motto.
 * Pass `crest` (an <img src>) to prepend the shield. `tone`:
 * 'gold' (on dark) | 'navy' (on light) | 'mono'.
 */
function CrestMark({
  crest = null,
  tone = 'gold',
  size = 'md',
  motto = true,
  align = 'center',
  style = {}
}) {
  const sizes = {
    sm: {
      word: 26,
      crest: 34,
      motto: 11
    },
    md: {
      word: 40,
      crest: 52,
      motto: 13
    },
    lg: {
      word: 60,
      crest: 78,
      motto: 15
    }
  };
  const s = sizes[size] || sizes.md;
  const tones = {
    gold: {
      word: 'var(--gold-bright)',
      sub: 'var(--pergament)',
      motto: 'var(--gold)'
    },
    navy: {
      word: 'var(--navy)',
      sub: 'var(--ink-700)',
      motto: 'var(--gold-700)'
    },
    mono: {
      word: 'currentColor',
      sub: 'currentColor',
      motto: 'currentColor'
    }
  };
  const t = tones[tone] || tones.gold;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align,
      fontFamily: 'var(--font-ui)',
      gap: 2,
      ...style
    }
  }, crest && /*#__PURE__*/React.createElement("img", {
    src: crest,
    alt: "Wirtschaftln Wappen",
    style: {
      height: s.crest,
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-fraktur)',
      fontSize: s.word,
      color: t.word,
      lineHeight: 1,
      letterSpacing: '0.01em'
    }
  }, "Wirtschaftln"), motto && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: s.motto,
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: t.motto,
      marginTop: 6
    }
  }, "M\xFCnchen \xB7 seit 2019"));
}
Object.assign(__ds_scope, { CrestMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/CrestMark.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
/**
 * Wirtschaftln — Avatar
 * Member photo with optional gold ring (for active office holders),
 * rank badge, and online/present dot. Falls back to initials.
 */
function Avatar({
  src,
  name = '',
  size = 48,
  ring = false,
  badge = null,
  present = false,
  style = {}
}) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const ringWidth = Math.max(2, Math.round(size * 0.05));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flex: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--r-pill)',
      overflow: 'hidden',
      background: 'var(--ink-100)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: ring ? `${ringWidth}px solid var(--gold)` : `1px solid var(--ink-100)`,
      boxShadow: ring ? 'var(--sh-gold)' : 'var(--sh-xs)',
      boxSizing: 'border-box'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontWeight: 700,
      fontSize: size * 0.36,
      color: 'var(--ink-500)'
    }
  }, initials)), present && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: size * 0.28,
      height: size * 0.28,
      borderRadius: 'var(--r-pill)',
      background: 'var(--erfolg)',
      border: '2px solid var(--weiss)',
      boxSizing: 'border-box'
    }
  }), badge != null && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -2,
      top: -2,
      minWidth: size * 0.4,
      height: size * 0.4,
      padding: '0 4px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--gold)',
      color: 'var(--navy-900)',
      fontFamily: 'var(--font-ui)',
      fontWeight: 800,
      fontSize: size * 0.24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--weiss)',
      boxSizing: 'border-box'
    }
  }, badge));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
/**
 * Wirtschaftln — Badge
 * Small status/label pill. Tones map to semantic colors.
 * `gold` & `blau` are brand tones; `solid` fills, default is soft.
 */
function Badge({
  children,
  tone = 'neutral',
  solid = false,
  iconLeft = null,
  style = {}
}) {
  const tones = {
    neutral: {
      soft: ['var(--ink-50)', 'var(--ink-700)'],
      solid: ['var(--ink-700)', '#fff']
    },
    blau: {
      soft: ['var(--info-bg)', 'var(--muc-blau-700)'],
      solid: ['var(--muc-blau)', '#fff']
    },
    gold: {
      soft: ['#F6ECD4', 'var(--gold-700)'],
      solid: ['var(--gold)', 'var(--navy-900)']
    },
    erfolg: {
      soft: ['var(--erfolg-bg)', 'var(--erfolg)'],
      solid: ['var(--erfolg)', '#fff']
    },
    warnung: {
      soft: ['var(--warnung-bg)', '#9A7510'],
      solid: ['var(--warnung)', '#fff']
    },
    strafe: {
      soft: ['var(--strafe-bg)', 'var(--strafe)'],
      solid: ['var(--strafe)', '#fff']
    }
  };
  const [bg, color] = (tones[tone] || tones.neutral)[solid ? 'solid' : 'soft'];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 10px',
      borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-ui)',
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: '0.01em',
      lineHeight: 1.2,
      background: bg,
      color,
      whiteSpace: 'nowrap',
      ...style
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconLeft), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * Wirtschaftln — Button
 * Modern, soft-cornered button. Variants: primary (Münchner Blau),
 * gold (ceremonial CTA), secondary (outline), ghost, danger (Kasse).
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  type = 'button',
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const sizes = {
    sm: {
      padding: '7px 14px',
      fontSize: 13,
      radius: 'var(--r-sm)',
      gap: 6,
      height: 34
    },
    md: {
      padding: '10px 18px',
      fontSize: 15,
      radius: 'var(--r-md)',
      gap: 8,
      height: 44
    },
    lg: {
      padding: '14px 24px',
      fontSize: 17,
      radius: 'var(--r-md)',
      gap: 10,
      height: 54
    }
  };
  const s = sizes[size] || sizes.md;
  const palettes = {
    primary: {
      bg: 'var(--muc-blau)',
      bgHover: 'var(--muc-blau-600)',
      color: 'var(--weiss)',
      border: 'transparent',
      shadow: 'var(--sh-sm)'
    },
    gold: {
      bg: 'var(--grad-gold)',
      bgHover: 'var(--gold-600)',
      color: 'var(--navy-900)',
      border: 'transparent',
      shadow: 'var(--sh-gold)'
    },
    secondary: {
      bg: 'var(--weiss)',
      bgHover: 'var(--ink-50)',
      color: 'var(--muc-blau)',
      border: '1.5px solid var(--muc-blau)',
      shadow: 'none'
    },
    ghost: {
      bg: 'transparent',
      bgHover: 'var(--ink-50)',
      color: 'var(--ink-700)',
      border: '1.5px solid transparent',
      shadow: 'none'
    },
    danger: {
      bg: 'var(--strafe)',
      bgHover: '#A93226',
      color: 'var(--weiss)',
      border: 'transparent',
      shadow: 'var(--sh-sm)'
    }
  };
  const p = palettes[variant] || palettes.primary;
  const css = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    width: fullWidth ? '100%' : 'auto',
    minHeight: s.height,
    boxSizing: 'border-box',
    padding: s.padding,
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
    fontSize: s.fontSize,
    lineHeight: 1,
    letterSpacing: '-0.01em',
    color: p.color,
    background: disabled ? 'var(--ink-100)' : hover && !press ? p.bgHover : p.bg,
    border: disabled ? '1.5px solid transparent' : p.border,
    borderRadius: s.radius,
    boxShadow: disabled ? 'none' : press ? 'none' : p.shadow,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transform: press && !disabled ? 'scale(0.97)' : 'scale(1)',
    transition: 'transform var(--dur-fast) var(--ease-standard), background var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
    color: disabled ? 'var(--ink-300)' : p.color,
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: css
  }, rest), iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconLeft), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
/**
 * Wirtschaftln — Card
 * Base surface container. `tone`: white | parchment | brand | dark.
 * Optional gold hairline frame for ceremonial content.
 */
function Card({
  children,
  tone = 'white',
  framed = false,
  pad = 20,
  interactive = false,
  onClick,
  style = {}
}) {
  const tones = {
    white: {
      bg: 'var(--surface-card)',
      color: 'var(--text-body)',
      border: '1px solid var(--ink-100)'
    },
    parchment: {
      bg: 'var(--pergament)',
      color: 'var(--ink-700)',
      border: '1px solid var(--pergament-edge)'
    },
    brand: {
      bg: 'var(--grad-blau)',
      color: '#fff',
      border: 'none'
    },
    dark: {
      bg: 'var(--grad-navy)',
      color: 'var(--pergament)',
      border: 'none'
    }
  };
  const t = tones[tone] || tones.white;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      background: t.bg,
      color: t.color,
      border: framed ? '1.5px solid var(--gold)' : t.border,
      borderRadius: 'var(--r-lg)',
      padding: pad,
      boxShadow: tone === 'white' ? 'var(--sh-sm)' : 'var(--sh-md)',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
      boxSizing: 'border-box',
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--sh-lg)';
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = tone === 'white' ? 'var(--sh-sm)' : 'var(--sh-md)';
    } : undefined
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * Wirtschaftln — IconButton
 * Square/round icon-only control. Use for toolbar & nav actions.
 */
function IconButton({
  children,
  label,
  variant = 'soft',
  size = 40,
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const palettes = {
    soft: {
      bg: 'var(--ink-50)',
      bgHover: 'var(--ink-100)',
      color: 'var(--ink-700)',
      border: 'transparent'
    },
    blau: {
      bg: 'var(--muc-blau)',
      bgHover: 'var(--muc-blau-600)',
      color: '#fff',
      border: 'transparent'
    },
    gold: {
      bg: 'var(--gold)',
      bgHover: 'var(--gold-600)',
      color: 'var(--navy-900)',
      border: 'transparent'
    },
    ghost: {
      bg: 'transparent',
      bgHover: 'var(--ink-50)',
      color: 'var(--ink-700)',
      border: 'transparent'
    },
    outline: {
      bg: 'var(--weiss)',
      bgHover: 'var(--ink-50)',
      color: 'var(--ink-700)',
      border: '1px solid var(--ink-200)'
    }
  };
  const p = palettes[variant] || palettes.soft;
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      width: size,
      height: size,
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--r-md)',
      background: hover ? p.bgHover : p.bg,
      color: p.color,
      border: p.border,
      cursor: 'pointer',
      transform: press ? 'scale(0.92)' : 'scale(1)',
      transition: 'transform var(--dur-fast) var(--ease-standard), background var(--dur-base) var(--ease-standard)',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionHeader.jsx
try { (() => {
/**
 * Wirtschaftln — SectionHeader
 * Eyebrow + title row with optional Fraktur title and trailing action.
 */
function SectionHeader({
  eyebrow = null,
  title,
  fraktur = false,
  action = null,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--gold-700)',
      marginBottom: 4
    }
  }, eyebrow), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: fraktur ? 'var(--font-fraktur)' : 'var(--font-ui)',
      fontSize: fraktur ? 30 : 22,
      fontWeight: fraktur ? 400 : 800,
      letterSpacing: fraktur ? '0.01em' : '-0.02em',
      color: 'var(--ink-900)',
      lineHeight: 1.1
    }
  }, title)), action && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none'
    }
  }, action));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/SegmentedTabs.jsx
try { (() => {
/**
 * Wirtschaftln — SegmentedTabs
 * Apple-style segmented control. Used for filters
 * (Worldwide / Saison / Allzeit) and view switches.
 */
function SegmentedTabs({
  tabs = [],
  value,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      background: 'var(--ink-100)',
      borderRadius: 'var(--r-pill)',
      padding: 3,
      gap: 2,
      ...style
    }
  }, tabs.map(tab => {
    const key = typeof tab === 'string' ? tab : tab.value;
    const lbl = typeof tab === 'string' ? tab : tab.label;
    const active = key === value;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      onClick: () => onChange && onChange(key),
      style: {
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--r-pill)',
        padding: '7px 16px',
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        fontSize: 13,
        color: active ? 'var(--muc-blau)' : 'var(--ink-500)',
        background: active ? 'var(--weiss)' : 'transparent',
        boxShadow: active ? 'var(--sh-xs)' : 'none',
        transition: 'all var(--dur-base) var(--ease-standard)',
        whiteSpace: 'nowrap'
      }
    }, lbl);
  }));
}
Object.assign(__ds_scope, { SegmentedTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SegmentedTabs.jsx", error: String((e && e.message) || e) }); }

// components/core/Stat.jsx
try { (() => {
/**
 * Wirtschaftln — Stat
 * Big tabular numeral with label + optional unit/icon. The
 * gamified workhorse: Hoibe getrunken, Abende dabei, Wirtshäuser.
 */
function Stat({
  value,
  label,
  unit = null,
  icon = null,
  tone = 'blau',
  align = 'left',
  size = 'md',
  style = {}
}) {
  const colors = {
    blau: 'var(--muc-blau)',
    gold: 'var(--gold-700)',
    dark: 'var(--navy)',
    light: 'var(--weiss)',
    ink: 'var(--ink-900)'
  };
  const sizes = {
    sm: 26,
    md: 38,
    lg: 52
  };
  const numColor = colors[tone] || colors.blau;
  const labColor = tone === 'light' ? 'rgba(246,240,226,0.7)' : 'var(--ink-500)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      fontFamily: 'var(--font-ui)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      justifyContent: align === 'center' ? 'center' : 'flex-start'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignSelf: 'center',
      color: numColor
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: sizes[size],
      fontWeight: 800,
      letterSpacing: '-0.03em',
      color: numColor,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: sizes[size] * 0.4,
      fontWeight: 700,
      color: numColor,
      opacity: 0.7
    }
  }, unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: labColor,
      marginTop: 5
    }
  }, label));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stat.jsx", error: String((e && e.message) || e) }); }

// components/domain/AmtBadge.jsx
try { (() => {
/**
 * Wirtschaftln — AmtBadge
 * A "Spaßamt" — honorary year-end office. Ceremonial gold seal with
 * Fraktur title. `size`: 'sm' (chip) | 'md' (seal).
 */
function AmtBadge({
  title,
  holder = null,
  icon = '🏅',
  size = 'md',
  style = {}
}) {
  if (size === 'sm') {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px 5px 8px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--navy)',
        color: 'var(--gold-bright)',
        border: '1px solid var(--border-on-dark)',
        fontFamily: 'var(--font-ui)',
        ...style
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 16,
        lineHeight: 1,
        color: 'var(--gold-bright)'
      }
    }, title));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '18px 16px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--grad-navy)',
      border: '1.5px solid var(--gold)',
      boxShadow: 'var(--sh-md)',
      fontFamily: 'var(--font-ui)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 60,
      borderRadius: 'var(--r-pill)',
      background: 'var(--grad-gold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 30,
      boxShadow: 'var(--sh-gold)',
      border: '2px solid var(--gold-bright)'
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-fraktur)',
      fontSize: 24,
      color: 'var(--gold-bright)',
      marginTop: 12,
      lineHeight: 1.1
    }
  }, title), holder && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--pergament)',
      marginTop: 4,
      opacity: 0.85
    }
  }, holder));
}
Object.assign(__ds_scope, { AmtBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/domain/AmtBadge.jsx", error: String((e && e.message) || e) }); }

// components/domain/BeerCounter.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Wirtschaftln — BeerCounter
 * The signature gamified control: tally Hoibe for the evening with a
 * big tappable stepper. Stein-gold accents, spring pop on change.
 */
function BeerCounter({
  value = 0,
  onChange,
  label = 'Hoibe heut’',
  max = 20,
  style = {}
}) {
  const [pop, setPop] = useState(false);
  const set = next => {
    const v = Math.max(0, Math.min(max, next));
    setPop(true);
    setTimeout(() => setPop(false), 180);
    onChange && onChange(v);
  };
  const StepBtn = ({
    dir,
    children
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: () => set(value + dir),
    style: {
      width: 52,
      height: 52,
      flex: 'none',
      borderRadius: 'var(--r-pill)',
      cursor: 'pointer',
      border: 'none',
      fontSize: 26,
      fontWeight: 700,
      lineHeight: 1,
      background: dir > 0 ? 'var(--grad-gold)' : 'var(--ink-50)',
      color: dir > 0 ? 'var(--navy-900)' : 'var(--ink-500)',
      boxShadow: dir > 0 ? 'var(--sh-gold)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform var(--dur-fast) var(--ease-spring)'
    },
    onMouseDown: e => e.currentTarget.style.transform = 'scale(0.9)',
    onMouseUp: e => e.currentTarget.style.transform = 'scale(1)',
    onMouseLeave: e => e.currentTarget.style.transform = 'scale(1)'
  }, children);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '16px 20px',
      background: 'var(--surface-card)',
      borderRadius: 'var(--r-lg)',
      border: '1px solid var(--ink-100)',
      boxShadow: 'var(--sh-sm)',
      fontFamily: 'var(--font-ui)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(StepBtn, {
    dir: -1
  }, "\u2212"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      fontWeight: 800,
      letterSpacing: '-0.04em',
      color: 'var(--gold-700)',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1,
      transform: pop ? 'scale(1.12)' : 'scale(1)',
      transition: 'transform var(--dur-base) var(--ease-spring)'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--ink-500)',
      marginTop: 4
    }
  }, label)), /*#__PURE__*/React.createElement(StepBtn, {
    dir: +1
  }, "+"));
}
Object.assign(__ds_scope, { BeerCounter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/domain/BeerCounter.jsx", error: String((e && e.message) || e) }); }

// components/domain/KasseEntry.jsx
try { (() => {
/**
 * Wirtschaftln — KasseEntry
 * One Vereinskasse line: who, why (Grund), how much. Penalties show red
 * & negative; payments green. `status` drives the pill: 'offen' |
 * 'beglichen' | 'aufgehoben' (falls back to `paid` / sign). Pass
 * `onClick` to make a Forderung tappable. Set `kind="ausgabe"` for a
 * club expenditure (icon tile instead of avatar, no status pill).
 */
function KasseEntry({
  name,
  photo,
  grund,
  betrag,
  datum = null,
  paid = false,
  status,
  gemeldet = false,
  kind = 'strafe',
  icon = '🧾',
  onClick,
  style = {}
}) {
  const isAusgabe = kind === 'ausgabe';
  const isStrafe = betrag < 0 && !isAusgabe;
  const st = status || (betrag >= 0 ? 'einzahlung' : paid ? 'beglichen' : 'offen');
  const aufgehoben = st === 'aufgehoben';
  const pill = {
    offen: ['var(--strafe)', 'Offen'],
    beglichen: ['var(--erfolg)', 'Bezahlt'],
    aufgehoben: ['var(--ink-300)', 'Aufgehoben']
  }[st];
  const amountColor = isAusgabe ? 'var(--ink-700)' : aufgehoben ? 'var(--ink-300)' : st === 'beglichen' ? 'var(--erfolg)' : isStrafe ? 'var(--strafe)' : 'var(--erfolg)';
  const sign = betrag > 0 ? '+' : '−';
  const abs = Math.abs(betrag).toFixed(2).replace('.', ',');
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: 'var(--surface-card)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--ink-100)',
      fontFamily: 'var(--font-ui)',
      cursor: onClick ? 'pointer' : 'default',
      opacity: aufgehoben ? 0.7 : 1,
      ...style
    }
  }, isAusgabe ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      flex: 'none',
      borderRadius: 'var(--r-md)',
      background: 'var(--pergament)',
      border: '1px solid var(--pergament-edge)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20
    }
  }, icon) : /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: photo,
    name: name,
    size: 40
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--ink-900)',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, name, gemeldet && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "\u2696\uFE0F")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--ink-500)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, grund, datum && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-300)'
    }
  }, " \xB7 ", datum))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: amountColor,
      fontVariantNumeric: 'tabular-nums',
      textDecoration: aufgehoben ? 'line-through' : 'none'
    }
  }, sign, " ", abs, " \u20AC"), isAusgabe ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--ink-300)'
    }
  }, "Ausgabe") : isStrafe && pill && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: pill[0]
    }
  }, pill[1])));
}
Object.assign(__ds_scope, { KasseEntry });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/domain/KasseEntry.jsx", error: String((e && e.message) || e) }); }

// components/domain/PersonCard.jsx
try { (() => {
/**
 * Wirtschaftln — PersonCard
 * Member card with photo, name, honorary office (Amt) and the three
 * core stats: Abende dabei, Hoibe getrunken, Wirtshäuser. The social
 * unit of the club. `layout`: 'tile' (vertical) | 'row' (horizontal).
 */
function PersonCard({
  name,
  photo,
  amt = null,
  since = null,
  abende = 0,
  mass = 0,
  wirtshaeuser = 0,
  ring = false,
  layout = 'tile',
  onClick,
  style = {}
}) {
  const stats = [{
    v: abende,
    l: 'Abende'
  }, {
    v: mass,
    l: 'Hoibe'
  }, {
    v: wirtshaeuser,
    l: 'Wirtsh.'
  }];
  const StatStrip = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0
    }
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.l,
    style: {
      flex: 1,
      textAlign: 'center',
      borderLeft: i ? '1px solid var(--ink-100)' : 'none',
      padding: '0 4px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: 'var(--muc-blau)',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, s.v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--ink-500)',
      marginTop: 4
    }
  }, s.l))));
  if (layout === 'row') {
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClick,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        background: 'var(--surface-card)',
        border: '1px solid var(--ink-100)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--sh-sm)',
        fontFamily: 'var(--font-ui)',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
      src: photo,
      name: name,
      size: 56,
      ring: ring
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--ink-900)'
      }
    }, name), amt && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
      tone: "gold",
      iconLeft: "\u2605"
    }, amt))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 180
      }
    }, StatStrip));
  }
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      width: '100%',
      background: 'var(--surface-card)',
      border: '1px solid var(--ink-100)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--sh-sm)',
      overflow: 'hidden',
      fontFamily: 'var(--font-ui)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 18px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      background: 'var(--pergament)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: photo,
    name: name,
    size: 76,
    ring: ring
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: 'var(--ink-900)',
      marginTop: 12
    }
  }, name), amt ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "gold",
    solid: true,
    iconLeft: "\u2605"
  }, amt)) : since && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--ink-500)',
      marginTop: 4
    }
  }, "Mitglied seit ", since)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 12px'
    }
  }, StatStrip));
}
Object.assign(__ds_scope, { PersonCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/domain/PersonCard.jsx", error: String((e && e.message) || e) }); }

// components/domain/RankRow.jsx
try { (() => {
/**
 * Wirtschaftln — RankRow
 * One leaderboard line: rank, member, value. Top-3 get gold/silver/
 * bronze rank chips; `me` highlights the current member.
 */
function RankRow({
  rank,
  name,
  photo,
  value,
  unit = 'Hoibe',
  me = false,
  amt = null,
  style = {}
}) {
  const medal = {
    1: 'var(--gold)',
    2: '#B8C0CC',
    3: '#C9853F'
  };
  const isTop = rank <= 3;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--font-ui)',
      background: me ? 'var(--info-bg)' : 'transparent',
      border: me ? '1.5px solid var(--muc-blau)' : '1.5px solid transparent',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      flex: 'none',
      borderRadius: 'var(--r-pill)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: 14,
      fontVariantNumeric: 'tabular-nums',
      background: isTop ? medal[rank] : 'var(--ink-50)',
      color: isTop ? 'var(--navy-900)' : 'var(--ink-500)',
      boxShadow: isTop ? 'var(--sh-xs)' : 'none'
    }
  }, rank), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: photo,
    name: name,
    size: 40,
    ring: rank === 1
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--ink-900)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name, me && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muc-blau)',
      fontWeight: 700
    }
  }, " \xB7 Du")), amt && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--gold-700)'
    }
  }, amt)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: 'var(--muc-blau)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--ink-400, var(--ink-500))',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }
  }, unit)));
}
Object.assign(__ds_scope, { RankRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/domain/RankRow.jsx", error: String((e && e.message) || e) }); }

// components/domain/VotePill.jsx
try { (() => {
/**
 * Wirtschaftln — VotePill
 * Availability vote for a Termin: Zusagen / Vielleicht / Absagen.
 * Segmented, semantic colors, fills the active choice.
 */
function VotePill({
  value = null,
  onChange,
  style = {}
}) {
  const opts = [{
    key: 'zu',
    label: 'Zusagen',
    icon: '✓',
    on: 'var(--erfolg)'
  }, {
    key: 'vielleicht',
    label: 'Vielleicht',
    icon: '~',
    on: 'var(--warnung)'
  }, {
    key: 'ab',
    label: 'Absagen',
    icon: '✕',
    on: 'var(--strafe)'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      ...style
    }
  }, opts.map(o => {
    const active = value === o.key;
    return /*#__PURE__*/React.createElement("button", {
      key: o.key,
      onClick: () => onChange && onChange(o.key),
      style: {
        flex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '11px 10px',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        fontSize: 14,
        border: active ? '1.5px solid transparent' : '1.5px solid var(--ink-200)',
        background: active ? o.on : 'var(--weiss)',
        color: active ? '#fff' : 'var(--ink-500)',
        boxShadow: active ? 'var(--sh-sm)' : 'none',
        transition: 'all var(--dur-base) var(--ease-standard)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 800
      }
    }, o.icon), o.label);
  }));
}
Object.assign(__ds_scope, { VotePill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/domain/VotePill.jsx", error: String((e && e.message) || e) }); }

// components/domain/WirtshausCard.jsx
try { (() => {
/**
 * Wirtschaftln — StarRating
 * Gold five-star rating. Read-only display or interactive.
 */
function StarRating({
  value = 0,
  max = 5,
  size = 18,
  onChange = null,
  showValue = false,
  style = {}
}) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    const filled = i <= Math.round(value);
    stars.push(/*#__PURE__*/React.createElement("span", {
      key: i,
      onClick: onChange ? () => onChange(i) : undefined,
      style: {
        fontSize: size,
        lineHeight: 1,
        cursor: onChange ? 'pointer' : 'default',
        color: filled ? 'var(--gold)' : 'var(--ink-200)',
        textShadow: filled ? '0 1px 1px rgba(166,132,62,0.3)' : 'none'
      }
    }, "\u2605"));
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-ui)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 2
    }
  }, stars), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * 0.78,
      fontWeight: 700,
      color: 'var(--ink-700)',
      fontVariantNumeric: 'tabular-nums',
      marginLeft: 2
    }
  }, Number(value).toFixed(1)));
}

/**
 * Wirtschaftln — WirtshausCard
 * Tavern card: photo, name, district, rating, visit status.
 * The collectible unit — every Wirtshaus visited once.
 */
function WirtshausCard({
  name,
  photo,
  bezirk = null,
  rating = 0,
  besuchtAm = null,
  naechstes = false,
  onClick,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      width: '100%',
      background: 'var(--surface-card)',
      borderRadius: 'var(--r-lg)',
      border: naechstes ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
      boxShadow: naechstes ? 'var(--sh-md)' : 'var(--sh-sm)',
      overflow: 'hidden',
      fontFamily: 'var(--font-ui)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 132,
      background: 'var(--ink-100)'
    }
  }, photo && /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10,
      display: 'flex',
      gap: 6
    }
  }, naechstes ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "gold",
    solid: true,
    iconLeft: "\uD83D\uDCCD"
  }, "N\xE4chstes Mal") : besuchtAm ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "blau",
    solid: true,
    iconLeft: "\u2713"
  }, "Besucht") : /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "neutral",
    solid: true
  }, "Offen"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: 'var(--ink-900)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), bezirk && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--ink-500)',
      marginTop: 2
    }
  }, bezirk)), /*#__PURE__*/React.createElement(StarRating, {
    value: rating,
    size: 15,
    showValue: true
  })), besuchtAm && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--ink-400, var(--ink-500))',
      marginTop: 10,
      borderTop: '1px solid var(--ink-100)',
      paddingTop: 10
    }
  }, "Besucht am ", besuchtAm)));
}
Object.assign(__ds_scope, { StarRating, WirtshausCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/domain/WirtshausCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * Wirtschaftln — Input
 * Text field with label, optional icon, hint/error. Apple-clean,
 * soft border that warms to Münchner Blau on focus.
 */
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  iconLeft = null,
  hint = null,
  error = null,
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const borderColor = error ? 'var(--strafe)' : focus ? 'var(--muc-blau)' : 'var(--ink-200)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-ui)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--ink-700)',
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 14px',
      background: disabled ? 'var(--ink-50)' : 'var(--weiss)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--r-md)',
      boxShadow: focus && !error ? 'var(--ring)' : 'none',
      transition: 'border-color var(--dur-base), box-shadow var(--dur-base)'
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--ink-300)'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      padding: '12px 0',
      fontFamily: 'var(--font-ui)',
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--ink-900)',
      minWidth: 0
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      marginTop: 6,
      color: error ? 'var(--strafe)' : 'var(--ink-500)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * Wirtschaftln — Switch
 * On/off toggle. On = Münchner Blau (or gold). Apple-style knob.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  tone = 'blau',
  label = null,
  style = {}
}) {
  const onColor = tone === 'gold' ? 'var(--gold)' : 'var(--muc-blau)';
  const toggle = /*#__PURE__*/React.createElement("button", {
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 48,
      height: 28,
      flex: 'none',
      borderRadius: 'var(--r-pill)',
      border: 'none',
      background: checked ? onColor : 'var(--ink-200)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: 3,
      display: 'flex',
      justifyContent: checked ? 'flex-end' : 'flex-start',
      alignItems: 'center',
      transition: 'background var(--dur-base) var(--ease-standard)',
      opacity: disabled ? 0.5 : 1,
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 'var(--r-pill)',
      background: 'var(--weiss)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      transition: 'all var(--dur-base) var(--ease-spring)'
    }
  }));
  if (!label) return toggle;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-ui)',
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--ink-700)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, toggle, label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
// Wirtschaftln — App shell (uses PhoneFrame; app bar + bottom tabs)
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    Avatar,
    IconButton,
    Button
  } = DS;
  const Icon = window.WNIcon;
  const PhoneFrame = window.PhoneFrame;
  const data = window.WN_DATA;
  const TABS = [{
    key: 'home',
    label: 'Hoam',
    icon: 'home',
    screen: 'HomeScreen'
  }, {
    key: 'termin',
    label: 'Termin',
    icon: 'calendar',
    screen: 'TerminScreen'
  }, {
    key: 'karte',
    label: 'Archiv',
    icon: 'map',
    screen: 'WirtshausScreen'
  }, {
    key: 'rang',
    label: 'Spezln',
    icon: 'users',
    screen: 'RanglisteScreen'
  }, {
    key: 'kasse',
    label: 'Kasse',
    icon: 'beer',
    screen: 'KasseScreen'
  }];
  const TITLES = {
    home: '',
    termin: 'Termin & Abstimmung',
    karte: 'Archiv',
    rang: 'Spezln',
    kasse: 'Vereinskasse'
  };
  function AppShell({
    onLogout
  }) {
    const [tab, setTab] = React.useState('home');
    const [menu, setMenu] = React.useState(false);
    const [termin, setTermin] = React.useState(window.WNTermin.INITIAL);
    const [taverns, setTaverns] = React.useState(data.taverns);
    const [kasse, setKasse] = React.useState(data.kasse.entries);
    const [saldo, setSaldo] = React.useState(data.kasse.saldo);
    const [sheet, setSheet] = React.useState(null);
    const [toastMsg, setToastMsg] = React.useState(null);
    const toastTimer = React.useRef(null);
    function toast(msg) {
      setToastMsg(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
    }
    const TAVERN_PHOTOS = ['https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=600&q=70', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=70', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=70'];
    const store = {
      termin,
      setTermin,
      taverns,
      kasse,
      saldo,
      openSheet: node => setSheet(node),
      closeSheet: () => setSheet(null),
      toast,
      addPenalty: entry => setKasse(k => [entry, ...k]),
      updatePenalty: (id, patch) => setKasse(k => k.map(e => e.id === id ? {
        ...e,
        ...patch
      } : e)),
      activateTavern: t => setTaverns(list => [{
        id: 't' + Date.now(),
        photo: TAVERN_PHOTOS[list.length % TAVERN_PHOTOS.length],
        besuchtAm: 'heute',
        rating: t.rating,
        kaiser: t.kaiser || 0,
        brodn: t.brodn || 0,
        ...t
      }, ...list]),
      jumpPhase: phase => {
        if (phase === 'planung') setTermin({
          ...window.WNTermin.INITIAL
        });else if (phase === 'heute') setTermin(prev => ({
          ...prev,
          wirtshaus: prev.wirtshaus || {
            name: 'Der Pschorr',
            adresse: 'Viktualienmarkt 15, 80331 München',
            bezirk: 'Altstadt',
            x: 50,
            y: 52
          },
          phase: 'heute',
          visit: null
        }));
        setTab('termin');
      },
      reportMember: () => setSheet(/*#__PURE__*/React.createElement(window.WNSheets.MeldenSheet, {
        members: data.members.filter(m => !m.me),
        onClose: () => setSheet(null),
        onSubmit: r => {
          setKasse(k => [{
            id: 'm' + Date.now(),
            name: r.name,
            photo: r.photo,
            grund: r.vorwurf,
            betrag: -Math.abs(r.betrag),
            datum: 'heute',
            status: 'offen',
            gemeldet: true
          }, ...k]);
          setSheet(null);
          toast('💸 PayPal-Link & E-Mail an ' + r.name.split(' ')[0] + ' gesendet');
        }
      })),
      openForderung: entry => setSheet(/*#__PURE__*/React.createElement(window.WNSheets.ForderungDialog, {
        entry: entry,
        onClose: () => setSheet(null),
        onStatus: status => {
          setKasse(k => k.map(e => e.id === entry.id ? {
            ...e,
            status,
            paid: status === 'beglichen'
          } : e));
          setSheet(null);
          const txt = {
            beglichen: '✓ Als beglichen markiert',
            offen: '○ Bleibt offen',
            aufgehoben: '✕ Forderung aufgehoben'
          }[status];
          toast(txt);
        }
      })),
      addAusgabe: () => setSheet(/*#__PURE__*/React.createElement(window.WNSheets.AusgabeSheet, {
        saldo: saldo,
        onClose: () => setSheet(null),
        onSubmit: a => {
          setKasse(k => [{
            id: 'a' + Date.now(),
            name: a.kategorie,
            grund: a.grund,
            betrag: -Math.abs(a.betrag),
            datum: 'heute',
            kind: 'ausgabe',
            icon: a.icon
          }, ...k]);
          setSaldo(s => s - Math.abs(a.betrag));
          setSheet(null);
          toast('🧾 Ausgabe gebucht · ' + a.betrag.toFixed(2).replace('.', ',') + ' €');
        }
      }))
    };
    const profile = window.WNAuth.getProfile();
    const me = data.members.find(m => m.me);
    // Prefer the registered applicant's photo/name if present
    const myPhoto = profile && profile.photo || me.photo;
    const myName = profile && (profile.spitzname || profile.vorname) || me.name;
    const ScreenComp = window[TABS.find(t => t.key === tab).screen];
    return /*#__PURE__*/React.createElement(PhoneFrame, {
      statusColor: "var(--ink-900)"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 16px 12px',
        flex: 'none',
        borderBottom: '1px solid var(--ink-100)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/wirtschaftln-logo-1.png",
      alt: "",
      style: {
        height: 34
      }
    }), /*#__PURE__*/React.createElement("div", null, tab === 'home' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 22,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, "Wirtschaftln"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--gold-700)'
      }
    }, data.saison)) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, TITLES[tab]))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      label: "Benachrichtigungen",
      variant: "ghost"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bell",
      size: 20
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => setMenu(m => !m),
      style: {
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: myPhoto,
      name: myName,
      size: 36,
      ring: true
    }))), menu && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      onClick: () => setMenu(false),
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 30
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 54,
        right: 16,
        zIndex: 31,
        width: 210,
        background: 'var(--weiss)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--sh-lg)',
        border: '1px solid var(--ink-100)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        background: 'var(--pergament)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: myPhoto,
      name: myName,
      size: 40,
      ring: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        color: 'var(--ink-900)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, myName), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--gold-700)'
      }
    }, profile ? 'Antrag läuft' : 'Mitglied'))), /*#__PURE__*/React.createElement("button", {
      onClick: onLogout,
      style: {
        width: '100%',
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '13px 14px',
        fontFamily: 'var(--font-ui)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--strafe)'
      }
    }, "Abmelden")))), (() => {
      const ph = termin.phase;
      const onPlan = ph === 'planung' || ph === 'reserviert';
      const Pill = ({
        active,
        label,
        onClick
      }) => /*#__PURE__*/React.createElement("button", {
        onClick: onClick,
        style: {
          flex: 1,
          border: 'none',
          cursor: 'pointer',
          borderRadius: 'var(--r-pill)',
          padding: '6px 10px',
          fontFamily: 'var(--font-ui)',
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: '0.02em',
          color: active ? 'var(--navy-900)' : 'var(--pergament)',
          background: active ? 'var(--grad-gold)' : 'transparent',
          boxShadow: active ? 'var(--sh-xs)' : 'none',
          transition: 'all var(--dur-base) var(--ease-standard)'
        }
      }, label);
      return /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          background: 'var(--navy-900)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          flex: 'none'
        }
      }, "Demo"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          display: 'flex',
          gap: 4,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 'var(--r-pill)',
          padding: 3
        }
      }, /*#__PURE__*/React.createElement(Pill, {
        active: onPlan,
        label: "Geplant",
        onClick: () => store.jumpPhase('planung')
      }), /*#__PURE__*/React.createElement(Pill, {
        active: ph === 'heute',
        label: "Tag des Treffens",
        onClick: () => store.jumpPhase('heute')
      })));
    })(), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(ScreenComp, {
      data: data,
      store: store,
      onNav: setTab
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        display: 'flex',
        background: 'var(--weiss)',
        borderTop: '1px solid var(--ink-100)',
        padding: '8px 6px 22px',
        boxShadow: '0 -4px 20px rgba(12,43,90,0.06)'
      }
    }, TABS.map(t => {
      const active = t.key === tab;
      return /*#__PURE__*/React.createElement("button", {
        key: t.key,
        onClick: () => setTab(t.key),
        style: {
          flex: 1,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '4px 0',
          color: active ? 'var(--muc-blau)' : 'var(--ink-300)',
          transition: 'color var(--dur-base)'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: t.icon,
        size: 23,
        stroke: active ? 2.4 : 2
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          fontWeight: active ? 800 : 600,
          letterSpacing: '0.02em'
        }
      }, t.label));
    })), sheet, toastMsg && /*#__PURE__*/React.createElement("div", {
      className: "wn-toast-in",
      style: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 96,
        zIndex: 70,
        background: 'var(--navy-900)',
        color: 'var(--pergament)',
        padding: '13px 16px',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--sh-lg)',
        fontSize: 14,
        fontWeight: 700,
        textAlign: 'center'
      }
    }, toastMsg));
  }
  window.AppShell = AppShell;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/HomeScreen.jsx
try { (() => {
// Wirtschaftln — Home / "Heute" screen
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    Card,
    Stat,
    VotePill,
    BeerCounter,
    Button,
    RankRow,
    Badge
  } = DS;
  const Icon = window.WNIcon;
  function HomeScreen({
    data,
    store,
    onNav
  }) {
    const n = data.naechster;
    const t = store && store.termin;
    const venue = t ? t.wirtshaus ? t.wirtshaus.name : 'organisiert von ' + t.planer.split(' ')[0] : n.wirtshaus;
    const datum = t ? t.datum.split(',')[0] : n.datum;
    const zeit = t ? t.zeit : n.zeit;
    const ort = t && t.wirtshaus ? t.wirtshaus.bezirk : n.bezirk;
    const reserviert = t && t.wirtshaus;
    const me = data.members.find(m => m.me);
    const [vote, setVote] = React.useState(me.vote || 'zu');
    const [mass, setMass] = React.useState(0);
    // RSVP tally — same source as the Termin screen, with your live answer applied
    const tally = {
      zu: 0,
      vielleicht: 0,
      ab: 0
    };
    data.members.forEach(m => {
      tally[m.id === me.id ? vote : m.vote]++;
    });
    const top = [...data.members].sort((a, b) => b.mass - a.mass).slice(0, 3);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '8px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      tone: "dark",
      pad: 0,
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "wn-raute wn-raute--sm",
      style: {
        height: 8
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--gold)'
      }
    }, "N\xE4chster Stammtisch"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--pergament)',
        background: 'rgba(255,255,255,0.1)',
        padding: '4px 10px',
        borderRadius: 'var(--r-pill)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 14,
      color: "var(--gold-bright)"
    }), " in 12 Tagen")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: reserviert ? 30 : 24,
        color: 'var(--gold-bright)',
        marginTop: 10,
        lineHeight: 1.25
      }
    }, venue), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 14,
        marginTop: 8,
        color: 'var(--pergament)',
        fontSize: 14,
        fontWeight: 600,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 15,
      color: "var(--gold)"
    }), datum, ", ", zeit), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pin",
      size: 15,
      color: "var(--gold)"
    }), ort)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginTop: 14,
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "erfolg",
      solid: true
    }, tally.zu, " zugesagt"), /*#__PURE__*/React.createElement(Badge, {
      tone: "warnung",
      solid: true
    }, tally.vielleicht, " vielleicht"), /*#__PURE__*/React.createElement(Badge, {
      tone: "strafe",
      solid: true
    }, tally.ab, " abgesagt")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(246,240,226,0.6)',
        marginBottom: 8
      }
    }, "Deine Antwort"), /*#__PURE__*/React.createElement(VotePill, {
      value: vote,
      onChange: setVote
    }))), /*#__PURE__*/React.createElement(Card, {
      tone: "white",
      pad: 18
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Deine Saison"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 13,
        fontWeight: 800,
        color: 'var(--gold-700)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "flame",
      size: 16,
      color: "var(--gold)"
    }), " 6 Abende in Folge")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      value: me.mass,
      label: "Hoibe",
      tone: "blau",
      align: "center"
    }), /*#__PURE__*/React.createElement(Stat, {
      value: me.abende,
      label: "Abende",
      tone: "ink",
      align: "center"
    }), /*#__PURE__*/React.createElement(Stat, {
      value: me.wirtshaeuser,
      label: "Wirtsh.",
      tone: "gold",
      align: "center"
    }), /*#__PURE__*/React.createElement(Stat, {
      value: "2.",
      label: "Rang",
      tone: "blau",
      align: "center"
    }))), /*#__PURE__*/React.createElement(Card, {
      tone: "white",
      pad: 14
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 4px 10px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Hoibe-Spezln"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      onClick: () => onNav('rang'),
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "chevron",
        size: 16
      })
    }, "Alle")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }
    }, top.map((m, i) => /*#__PURE__*/React.createElement(RankRow, {
      key: m.id,
      rank: i + 1,
      name: m.name,
      photo: m.photo,
      value: m.mass,
      amt: m.amt,
      me: m.me
    })))), /*#__PURE__*/React.createElement("button", {
      onClick: () => store && store.reportMember(),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        background: 'var(--weiss)',
        border: '1px solid var(--ink-100)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--sh-sm)',
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        flex: 'none',
        borderRadius: 'var(--r-md)',
        background: 'var(--strafe-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20
      }
    }, "\u2696\uFE0F"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Wirtschaftler melden"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--ink-500)'
      }
    }, "Versto\xDF eintragen \u2014 PayPal-Link & Mail gehen raus")), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 18,
      color: "var(--ink-300)"
    })));
  }
  window.HomeScreen = HomeScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/KasseScreen.jsx
try { (() => {
// Wirtschaftln — Vereinskasse (Bierkasse) screen
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    KasseEntry,
    Card,
    Button
  } = DS;
  const Icon = window.WNIcon;
  function KasseScreen({
    data,
    store
  }) {
    const entries = store && store.kasse ? store.kasse : data.kasse.entries;
    const k = {
      saldo: store && store.saldo != null ? store.saldo : data.kasse.saldo,
      entries
    };
    const offen = k.entries.filter(e => e.betrag < 0 && !e.paid);
    const offenSum = offen.reduce((s, e) => s + Math.abs(e.betrag), 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '8px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      tone: "dark",
      pad: 22,
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--gold)'
      }
    }, "Vereinskasse"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 48,
        fontWeight: 800,
        color: 'var(--gold-bright)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.03em',
        marginTop: 6
      }
    }, k.saldo.toFixed(2).replace('.', ','), " \u20AC"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--pergament)',
        opacity: 0.8,
        marginTop: 4
      }
    }, "verwaltet von Resi Gruber")), offen.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--strafe-bg)',
        borderRadius: 'var(--r-md)',
        border: '1px solid #F3C7C1'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22
      }
    }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        color: 'var(--strafe)'
      }
    }, offen.length, " offene Strafen \xB7 ", offenSum.toFixed(2).replace('.', ','), " \u20AC"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: '#A93226'
      }
    }, "Bitte bis zum n\xE4chsten Stammtisch begleichen"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '0 4px 8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)'
      }
    }, "Bewegungen"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      iconLeft: "\uD83E\uDDFE",
      onClick: () => store && store.addAusgabe()
    }, "Ausgabe"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "danger",
      iconLeft: "\u2696\uFE0F",
      onClick: () => store && store.reportMember()
    }, "Melden"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, k.entries.map(e => /*#__PURE__*/React.createElement(KasseEntry, {
      key: e.id,
      name: e.name,
      photo: e.photo,
      grund: e.grund,
      betrag: e.betrag,
      datum: e.datum,
      paid: e.paid,
      status: e.status,
      gemeldet: e.gemeldet,
      kind: e.kind,
      icon: e.icon,
      onClick: e.betrag < 0 && e.kind !== 'ausgabe' && store ? () => store.openForderung(e) : undefined
    })))));
  }
  window.KasseScreen = KasseScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/KasseScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/LoginScreen.jsx
try { (() => {
// Wirtschaftln — LoginScreen: gate. Only members get in; others apply.
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    Button,
    Input
  } = DS;
  const Icon = window.WNIcon;
  function LoginScreen({
    onLogin,
    onRegister
  }) {
    const [email, setEmail] = React.useState('resi@wirtschaftln.de');
    const [pw, setPw] = React.useState('servus');
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'var(--grad-navy)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-raute wn-raute--sm",
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        opacity: 0.85
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 28px 18px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        marginBottom: 'auto',
        marginTop: 28
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/wirtschaftln-logo-verziert.png",
      alt: "Wirtschaftln",
      style: {
        height: 188,
        filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.4))'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 40,
        color: 'var(--gold-bright)',
        lineHeight: 1
      }
    }, "Wirtschaftln"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--pergament)',
        opacity: 0.75,
        marginTop: 8
      }
    }, "M\xFCnchner Stammtisch \xB7 seit 2019"))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        background: 'var(--weiss)',
        borderRadius: '24px 24px 0 0',
        padding: '22px 24px calc(22px + env(safe-area-inset-bottom))',
        boxShadow: '0 -10px 40px rgba(7,25,58,0.35)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: 'var(--ink-900)',
        marginBottom: 2
      }
    }, "Servus, eini mit dir!"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--ink-500)',
        marginBottom: 16
      }
    }, "Nur f\xFCr Stammtisch-Mitglieder. Mit Account anmelden."), /*#__PURE__*/React.createElement("form", {
      onSubmit: e => {
        e.preventDefault();
        onLogin();
      },
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "E-Mail",
      value: email,
      onChange: e => setEmail(e.target.value),
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "users",
        size: 17
      }),
      type: "email"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Passwort",
      value: pw,
      onChange: e => setPw(e.target.value),
      type: "password",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 17
      })
    }), /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true,
      style: {
        marginTop: 4
      }
    }, "Einloggen")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '18px 0'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--ink-100)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--ink-300)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }
    }, "oder"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--ink-100)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--ink-500)',
        marginBottom: 10
      }
    }, "Noch nicht dabei? Stell einen Antrag."), /*#__PURE__*/React.createElement(Button, {
      variant: "gold",
      size: "lg",
      fullWidth: true,
      onClick: onRegister,
      iconLeft: "\uD83C\uDF7A"
    }, "Mitglied werden"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--ink-300)',
        marginTop: 10
      }
    }, "Aufnahme nur mit B\xFCrgen aus der Runde."))));
  }
  window.LoginScreen = LoginScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/PhoneFrame.jsx
try { (() => {
// Wirtschaftln — PhoneFrame: shared device bezel + status bar.
// Children fill the area below the status bar (flex column).
(function () {
  function PhoneFrame({
    children,
    statusColor = 'var(--ink-900)',
    bg = 'var(--bg-app)'
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: 390,
        height: 'min(844px, 96vh)',
        background: bg,
        borderRadius: 38,
        boxShadow: '0 40px 90px rgba(12,43,90,0.30), 0 0 0 11px #0c0f14, 0 0 0 13px #2a2f38',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 46,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 26px 0',
        flex: 'none',
        fontSize: 14,
        fontWeight: 700,
        color: statusColor,
        zIndex: 20
      }
    }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        fontSize: 12
      }
    }, "\u25AE\u25AE\u25AE \u25BF \u25AE")), children);
  }
  window.PhoneFrame = PhoneFrame;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/PhoneFrame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/RanglisteScreen.jsx
try { (() => {
// Wirtschaftln — Spezln / Rangliste: Wirtschaftln Points (WP) leaderboard
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    Avatar,
    SegmentedTabs,
    Card,
    Badge
  } = DS;

  // ── Wirtschaftln Points ──────────────────────────────────────────────
  // Hoibe ×1 · Teilnahme ×5 (+1 je Streak-Stufe) · Organisieren ×5 · Runde ×10
  const PTS = {
    hoibe: 1,
    teilnahme: 5,
    organisiert: 5,
    runde: 10
  };
  function streakBonus(s) {
    return s > 0 ? s * (s + 1) / 2 : 0;
  } // 1+2+…+s; Minus-Streak gibt keinen Bonus
  function wpOf(s) {
    return s.hoibe * PTS.hoibe + s.teilnahmen * PTS.teilnahme + streakBonus(s.streak) + s.organisiert * PTS.organisiert + s.runden * PTS.runde;
  }
  // Stored numbers = Allzeit totals; Saison ≈ laufende Saison.
  function statsFor(m, season) {
    const f = season === 'saison' ? 0.45 : 1;
    const sc = n => Math.round(n * f);
    return {
      hoibe: sc(m.mass),
      teilnahmen: sc(m.abende),
      organisiert: sc(m.organisiert),
      runden: sc(m.runden),
      wirtshaeuser: sc(m.wirtshaeuser),
      streak: m.streak // current streak is live, not seasonal — Minus = wackelt
    };
  }
  const MEDAL = {
    1: 'var(--gold)',
    2: '#B8C0CC',
    3: '#C9853F'
  };
  const officeOf = (m, rank) => rank === 1 ? {
    label: 'Präsident',
    icon: '👑'
  } : m.amt === 'Kassenwartin' ? {
    label: 'Kassenwart',
    icon: '💰'
  } : m.amt === 'Schriftführer' ? {
    label: 'Schriftführer',
    icon: '✒️'
  } : null;

  // streak tag — flame for a positive run, frost/warning when it goes minus.
  // After the 3rd miss you "wackelt" and can buy free with a Runde.
  function StreakTag({
    cur,
    best,
    big
  }) {
    const neg = cur < 0,
      wackelt = cur <= -3;
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: neg ? 'var(--strafe-bg)' : 'var(--pergament)',
        border: '1px solid ' + (neg ? 'var(--strafe)' : 'var(--pergament-edge)'),
        borderRadius: 'var(--r-pill)',
        padding: big ? '6px 12px' : '3px 9px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: big ? 15 : 12
      }
    }, neg ? wackelt ? '⚠️' : '🥶' : '🔥'), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: big ? 13 : 12,
        fontWeight: 800,
        color: neg ? 'var(--strafe)' : 'var(--ink-900)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, cur > 0 ? '+' : '', cur), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: big ? 12 : 11,
        fontWeight: 600,
        color: neg ? 'var(--strafe)' : 'var(--ink-500)'
      }
    }, wackelt ? 'wackelt' : 'Streak'), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ink-400, var(--ink-500))'
      }
    }, "\xB7 Rekord ", best));
  }

  // compact streak chip for the cards (no record)
  function StreakChip({
    cur
  }) {
    const neg = cur < 0,
      wackelt = cur <= -3;
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: neg ? 'var(--strafe-bg)' : 'var(--pergament)',
        border: '1px solid ' + (neg ? 'var(--strafe)' : 'var(--pergament-edge)'),
        borderRadius: 'var(--r-pill)',
        padding: '3px 8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, neg ? wackelt ? '⚠️' : '🥶' : '🔥'), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: neg ? 'var(--strafe)' : 'var(--ink-900)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, cur > 0 ? '+' : '', cur), wackelt && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--strafe)'
      }
    }, "wackelt"));
  }

  // small counter chip (e.g. Schweinsbraten)
  function CountChip({
    icon,
    value,
    label
  }) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'var(--pergament)',
        border: '1px solid var(--pergament-edge)',
        borderRadius: 'var(--r-pill)',
        padding: '3px 9px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: 'var(--ink-900)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, value), label && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ink-500)'
      }
    }, label));
  }

  // a held badge shown as a small gold disc
  function BadgeDot({
    icon,
    name,
    size = 24
  }) {
    return /*#__PURE__*/React.createElement("span", {
      title: name,
      style: {
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        background: 'var(--grad-gold)',
        border: '1.5px solid var(--gold-bright)',
        boxShadow: 'var(--sh-xs)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.55
      }
    }, icon);
  }

  // ── Simple, tappable member row ──────────────────────────────────────
  function MemberCard({
    m,
    rank,
    s,
    wp,
    office,
    badges,
    onClick
  }) {
    const medal = MEDAL[rank];
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClick,
      style: {
        padding: '13px 14px 12px',
        background: 'var(--surface-card)',
        borderRadius: 'var(--r-lg)',
        border: m.me ? '1.5px solid var(--muc-blau)' : medal ? '1.5px solid ' + medal : '1px solid var(--ink-100)',
        boxShadow: rank <= 3 ? 'var(--sh-md)' : 'var(--sh-sm)',
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        width: 20,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 800,
        color: medal ? 'var(--gold-700)' : 'var(--ink-400, var(--ink-500))',
        fontVariantNumeric: 'tabular-nums'
      }
    }, rank), /*#__PURE__*/React.createElement(Avatar, {
      src: m.photo,
      name: m.name,
      size: 46,
      ring: rank === 1
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: 'var(--ink-900)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, m.name), m.me && /*#__PURE__*/React.createElement(Badge, {
      tone: "blau",
      solid: true
    }, "Du")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: office ? 'var(--gold-700)' : 'var(--ink-500)',
        marginTop: 2
      }
    }, office ? office.icon + ' ' + office.label : 'Mitglied')), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 800,
        color: 'var(--navy)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums'
      }
    }, wp), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.1em',
        color: 'var(--gold-700)'
      }
    }, "WP"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement(StreakChip, {
      cur: s.streak
    }), badges.map(b => /*#__PURE__*/React.createElement(BadgeDot, {
      key: b.name,
      icon: b.icon,
      name: b.name,
      size: 22
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        marginTop: 10
      }
    }, [{
      icon: '🍺',
      value: s.hoibe,
      label: 'Hoibe'
    }, {
      icon: '🎟️',
      value: s.teilnahmen,
      label: 'Dabei'
    }, {
      icon: '🏠',
      value: s.wirtshaeuser,
      label: 'Wirtsh.'
    }, {
      icon: '📋',
      value: s.organisiert,
      label: 'Orga'
    }, {
      icon: '🍻',
      value: s.runden,
      label: 'Runden'
    }, {
      icon: '🐷',
      value: m.schweinsbraten,
      label: 'Brodn'
    }].map(st => /*#__PURE__*/React.createElement("div", {
      key: st.label,
      style: {
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        padding: '7px 2px',
        background: 'var(--pergament)',
        borderRadius: 'var(--r-sm, 8px)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13
      }
    }, st.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--navy)',
        lineHeight: 1,
        marginTop: 2,
        fontVariantNumeric: 'tabular-nums'
      }
    }, st.value), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginTop: 2
      }
    }, st.label)))));
  }

  // ── Detail dialog (opens on tap) ─────────────────────────────────────
  function StatBox({
    icon,
    value,
    label
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        padding: '12px 4px',
        background: 'var(--pergament)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18
      }
    }, icon), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: 'var(--navy)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        marginTop: 4
      }
    }, value), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginTop: 4
      }
    }, label));
  }
  function MemberDetail({
    m,
    rank,
    s,
    wp,
    office,
    badges,
    onClose
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,25,58,0.55)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-sheet-in",
      style: {
        position: 'relative',
        width: '100%',
        maxWidth: 344,
        maxHeight: '88%',
        overflowY: 'auto',
        background: 'var(--weiss)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--sh-lg)',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--grad-navy)',
        padding: '20px 20px 18px',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      "aria-label": "Schlie\xDFen",
      style: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,0.16)',
        color: '#fff',
        fontSize: 16,
        fontWeight: 800,
        cursor: 'pointer'
      }
    }, "\xD7"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: m.photo,
      name: m.name,
      size: 58,
      ring: true,
      badge: rank === 1 ? '★' : null
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: '#fff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, m.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--gold-bright)',
        marginTop: 3
      }
    }, office ? office.icon + ' ' + office.label : 'Mitglied', " \xB7 Platz ", rank)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 'auto',
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--gold-bright)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums'
      }
    }, wp), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.1em',
        color: 'var(--pergament)',
        opacity: 0.8
      }
    }, "WP")))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '16px 18px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement(StreakTag, {
      cur: s.streak,
      best: m.bestStreak,
      big: true
    })), s.streak <= -3 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        padding: '10px 12px',
        background: 'var(--strafe-bg)',
        border: '1px solid var(--strafe)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 20
      }
    }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--strafe)',
        lineHeight: 1.4
      }
    }, "Dritte Absage in Folge \u2014 du wackelst. Mit einer ", /*#__PURE__*/React.createElement("b", null, "Runde"), " kaufst du dich wieder frei.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(StatBox, {
      icon: "\uD83C\uDF7A",
      value: s.hoibe,
      label: "Hoibe"
    }), /*#__PURE__*/React.createElement(StatBox, {
      icon: "\uD83C\uDF9F\uFE0F",
      value: s.teilnahmen,
      label: "Teilnahmen"
    }), /*#__PURE__*/React.createElement(StatBox, {
      icon: "\uD83C\uDFE0",
      value: s.wirtshaeuser,
      label: "Wirtsh."
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(StatBox, {
      icon: "\uD83D\uDCCB",
      value: s.organisiert,
      label: "Organisiert"
    }), /*#__PURE__*/React.createElement(StatBox, {
      icon: "\uD83C\uDF7B",
      value: s.runden,
      label: "Runden"
    }), /*#__PURE__*/React.createElement(StatBox, {
      icon: "\uD83D\uDC37",
      value: m.schweinsbraten,
      label: "Schweinsbr."
    })), badges.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        margin: '18px 0 10px'
      }
    }, "Saison-Badges"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, badges.map(b => /*#__PURE__*/React.createElement("div", {
      key: b.name,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: 'var(--pergament)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement(BadgeDot, {
      icon: b.icon,
      name: b.name,
      size: 30
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 18,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, b.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ink-500)',
        marginTop: 2
      }
    }, b.tag)))))))));
  }

  // navy seal badge for the bottom gallery
  function SeasonBadge({
    icon,
    name,
    tag,
    holder
  }) {
    if (!holder) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '16px 12px',
        borderRadius: 'var(--r-lg)',
        background: 'var(--grad-navy)',
        border: '1.5px solid var(--gold)',
        boxShadow: 'var(--sh-md)',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 50,
        height: 50,
        borderRadius: 'var(--r-pill)',
        background: 'var(--grad-gold)',
        border: '2px solid var(--gold-bright)',
        boxShadow: 'var(--sh-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 25
      }
    }, icon), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 19,
        color: 'var(--gold-bright)',
        marginTop: 10,
        lineHeight: 1.05
      }
    }, name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--pergament)',
        opacity: 0.7,
        marginTop: 3
      }
    }, tag), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 'var(--r-pill)',
        padding: '4px 10px 4px 4px'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: holder.photo,
      name: holder.name,
      size: 22
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--pergament)'
      }
    }, holder.name.split(' ')[0])));
  }
  function RanglisteScreen({
    data
  }) {
    const [season, setSeason] = React.useState('saison');
    const [detailId, setDetailId] = React.useState(null);
    const ranked = data.members.map(m => {
      const s = statsFor(m, season);
      return {
        m,
        s,
        wp: wpOf(s)
      };
    }).sort((a, b) => b.wp - a.wp);

    // office & badge holders
    const byMax = key => data.members.reduce((a, b) => b[key] > a[key] ? b : a);
    const byMin = key => data.members.reduce((a, b) => b[key] < a[key] ? b : a);
    const kassenwart = data.members.find(m => m.amt === 'Kassenwartin');
    const schriftfuehrer = data.members.find(m => m.amt === 'Schriftführer');
    const bestTavern = [...data.taverns].filter(t => t.besuchtAm).sort((a, b) => b.rating - a.rating)[0];
    const meisterEder = bestTavern ? data.members.find(m => m.name === bestTavern.organisator) : null;
    const president = ranked[0].m;
    const offices = [{
      icon: '👑',
      title: 'Präsident',
      holder: president,
      mode: 'Automatisch',
      duties: 'Zahlt immer zuletzt · entscheidet final · kann Schulden erlassen'
    }, {
      icon: '💰',
      title: 'Kassenwart',
      holder: kassenwart,
      mode: 'Gewählt',
      duties: 'Pflegt die Kasse · treibt Schulden ein · markiert Ausgaben'
    }, {
      icon: '✒️',
      title: 'Schriftführer',
      holder: schriftfuehrer,
      mode: 'Gewählt',
      duties: 'Dokumentiert alles Wichtige · gibt Vergaben & Änderungen bekannt'
    }];
    const badgeDefs = [{
      icon: '🐺',
      name: 'Zacher Hund',
      tag: 'am meisten dabei',
      holder: byMax('abende')
    }, {
      icon: '🍺',
      name: 'Maximator',
      tag: 'meiste Hoibe',
      holder: byMax('mass')
    }, {
      icon: '💸',
      name: 'Großbauer',
      tag: 'meiste Runden',
      holder: byMax('runden')
    }, {
      icon: '😴',
      name: 'Heiwong',
      tag: 'am wenigsten da',
      holder: byMin('abende')
    }, {
      icon: '⭐',
      name: 'Meister Eder',
      tag: 'bestes Wirtshaus reserviert',
      holder: meisterEder
    }, {
      icon: '🚕',
      name: 'Taxler',
      tag: 'fährt & nimmt alle mit',
      holder: byMax('taxi')
    }, {
      icon: '🐷',
      name: 'Die Sau',
      tag: 'meiste Schweinsbraten',
      holder: byMax('schweinsbraten')
    }];
    // map member id → badges they hold
    const badgesOf = {};
    badgeDefs.forEach(b => {
      if (b.holder) (badgesOf[b.holder.id] = badgesOf[b.holder.id] || []).push(b);
    });
    const me = data.members.find(m => m.me);
    const meStreak = statsFor(me, season).streak;
    const detail = detailId && ranked.find(r => r.m.id === detailId);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(SegmentedTabs, {
      value: season,
      onChange: setSeason,
      tabs: [{
        label: 'Diese Saison',
        value: 'saison'
      }, {
        label: 'Allzeit',
        value: 'all'
      }]
    }), /*#__PURE__*/React.createElement(StreakTag, {
      cur: meStreak,
      best: me.bestStreak
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, ranked.map((r, i) => /*#__PURE__*/React.createElement(MemberCard, {
      key: r.m.id,
      m: r.m,
      rank: i + 1,
      s: r.s,
      wp: r.wp,
      office: officeOf(r.m, i + 1),
      badges: badgesOf[r.m.id] || [],
      onClick: () => setDetailId(r.m.id)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '0 2px 10px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 22,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, "Die \xC4mter"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ink-500)'
      }
    }, "\xB7 gew\xE4hlt & automatisch")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, offices.map(o => o.holder && /*#__PURE__*/React.createElement("div", {
      key: o.title,
      style: {
        display: 'flex',
        gap: 14,
        background: 'var(--surface-card)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--ink-100)',
        boxShadow: 'var(--sh-sm)',
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        width: 52,
        height: 52,
        borderRadius: 'var(--r-pill)',
        background: 'var(--grad-gold)',
        border: '2px solid var(--gold-bright)',
        boxShadow: 'var(--sh-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26
      }
    }, o.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 21,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, o.title), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--gold-700)',
        background: 'var(--pergament)',
        border: '1px solid var(--pergament-edge)',
        borderRadius: 'var(--r-pill)',
        padding: '3px 8px'
      }
    }, o.mode)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: o.holder.photo,
      name: o.holder.name,
      size: 28,
      ring: true
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, o.holder.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--ink-500)',
        marginTop: 8,
        lineHeight: 1.45
      }
    }, o.duties)))))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '0 2px 10px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 22,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, "Saison-Badges"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ink-500)'
      }
    }, "\xB7 wandern automatisch weiter")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }
    }, badgeDefs.map(b => /*#__PURE__*/React.createElement(SeasonBadge, {
      key: b.name,
      icon: b.icon,
      name: b.name,
      tag: b.tag,
      holder: b.holder
    })))), detail && /*#__PURE__*/React.createElement(MemberDetail, {
      m: detail.m,
      rank: ranked.indexOf(detail) + 1,
      s: detail.s,
      wp: detail.wp,
      office: officeOf(detail.m, ranked.indexOf(detail) + 1),
      badges: badgesOf[detail.m.id] || [],
      onClose: () => setDetailId(null)
    }));
  }
  window.RanglisteScreen = RanglisteScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/RanglisteScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/RegisterFlow.jsx
try { (() => {
// Wirtschaftln — RegisterFlow: multi-step Aufnahme-Antrag + Servus reveal.
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    Button,
    Input,
    Switch,
    Avatar,
    Badge
  } = DS;
  const Icon = window.WNIcon;
  const data = window.WN_DATA;
  const DRINKS = [{
    key: 'helles',
    label: 'Helles',
    icon: '🍺'
  }, {
    key: 'weissbier',
    label: 'Weißbier',
    icon: '🌾'
  }, {
    key: 'radler',
    label: 'Radler',
    icon: '🍋'
  }, {
    key: 'dunkles',
    label: 'Dunkles',
    icon: '🟤'
  }];
  const STEPS = ['Persönliches', 'Dein Auftritt', 'Bierkultur', 'Aufnahme', 'Kodex'];

  // --- little building blocks -------------------------------------------
  function FieldLabel({
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-700)',
        marginBottom: 8
      }
    }, children);
  }
  function OptionPill({
    active,
    icon,
    label,
    sub,
    onClick
  }) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClick,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        border: active ? '1.5px solid var(--muc-blau)' : '1.5px solid var(--ink-200)',
        background: active ? 'var(--info-bg)' : 'var(--weiss)',
        transition: 'all var(--dur-base) var(--ease-standard)'
      }
    }, icon && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 20
      }
    }, icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--ink-900)'
      }
    }, label), sub && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--ink-500)'
      }
    }, sub)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: '50%',
        flex: 'none',
        border: active ? 'none' : '2px solid var(--ink-200)',
        background: active ? 'var(--muc-blau)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, active && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 14,
      color: "#fff",
      stroke: 3
    })));
  }

  // --- the Servus reveal -------------------------------------------------
  function ServusReveal({
    form,
    onEnter,
    onClose
  }) {
    const confetti = [];
    for (let i = 0; i < 14; i++) {
      const left = 6 + i * 6.4 % 88;
      const gold = i % 2 === 0;
      confetti.push(/*#__PURE__*/React.createElement("span", {
        key: i,
        className: "wn-confetti",
        style: {
          left: left + '%',
          background: gold ? 'var(--gold)' : 'var(--muc-blau)',
          animationDelay: 0.5 + i % 5 * 0.12 + 's',
          width: gold ? 9 : 7,
          height: gold ? 9 : 7,
          borderRadius: i % 3 === 0 ? '50%' : '2px'
        }
      }));
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--grad-navy)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "wn-raute wn-raute--sm",
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 8
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }
    }, confetti), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 28px',
        position: 'relative',
        zIndex: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "wn-reveal-photo",
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: -10,
        borderRadius: '50%',
        background: 'var(--grad-gold)',
        filter: 'blur(2px)',
        opacity: 0.55
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        borderRadius: '50%',
        padding: 5,
        background: 'var(--grad-gold)',
        boxShadow: 'var(--sh-gold)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: form.photo,
      name: form.spitzname || form.vorname || '?',
      size: 132,
      style: {
        border: '3px solid var(--navy-900)',
        borderRadius: '50%'
      }
    }))), /*#__PURE__*/React.createElement("div", {
      className: "wn-reveal-servus",
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 64,
        color: 'var(--gold-bright)',
        lineHeight: 1,
        marginTop: 26,
        textShadow: '0 4px 18px rgba(0,0,0,0.4)'
      }
    }, "Servus!"), /*#__PURE__*/React.createElement("div", {
      className: "wn-reveal-name",
      style: {
        marginTop: 12,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        fontWeight: 800,
        color: 'var(--weiss)',
        letterSpacing: '-0.02em'
      }
    }, "\u201E", form.spitzname || form.vorname || 'Neimitglied', "\u201C"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--pergament)',
        opacity: 0.8,
        marginTop: 4
      }
    }, form.vorname, " ", form.nachname)), /*#__PURE__*/React.createElement("div", {
      className: "wn-reveal-name",
      style: {
        marginTop: 22,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }
    }, form.drink && /*#__PURE__*/React.createElement(Badge, {
      tone: "gold",
      solid: true
    }, DRINKS.find(d => d.key === form.drink)?.icon, " ", DRINKS.find(d => d.key === form.drink)?.label), form.buerge && /*#__PURE__*/React.createElement(Badge, {
      tone: "blau",
      solid: true
    }, "B\xFCrge: ", form.buerge.split(' ')[0]))), /*#__PURE__*/React.createElement("div", {
      className: "wn-reveal-name",
      style: {
        position: 'relative',
        zIndex: 2,
        background: 'var(--weiss)',
        borderRadius: '24px 24px 0 0',
        padding: '20px 24px calc(22px + env(safe-area-inset-bottom))',
        boxShadow: '0 -10px 40px rgba(7,25,58,0.4)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22
      }
    }, "\uD83D\uDCDC"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Dei Antrag is raus!"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--ink-500)',
        marginTop: 2
      }
    }, "Der Stammtisch stimmt beim n\xE4chsten Treffen \xFCber deine Aufnahme ab. Schee, dass d\u2019 dabei sein magst."))), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      onClick: onEnter
    }, "App-Vorschau ansehen"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "md",
      fullWidth: true,
      onClick: onClose,
      style: {
        marginTop: 8
      }
    }, "Zur\xFCck zum Login")));
  }

  // --- main flow ---------------------------------------------------------
  function RegisterFlow({
    onLogin,
    onClose
  }) {
    const [step, setStep] = React.useState(0);
    const [done, setDone] = React.useState(false);
    const fileRef = React.useRef(null);
    const [form, setForm] = React.useState({
      vorname: '',
      nachname: '',
      jahr: '',
      bezirk: '',
      spitzname: '',
      photo: null,
      drink: 'helles',
      wirtshaus: '',
      buerge: '',
      warum: '',
      r1: false,
      r2: false,
      r3: false
    });
    const set = (k, v) => setForm(s => ({
      ...s,
      [k]: v
    }));
    function pickFile(e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => set('photo', r.result);
      r.readAsDataURL(f);
    }
    const canNext = [form.vorname.trim().length > 0, form.spitzname.trim().length > 0, !!form.drink, form.buerge.length > 0, form.r1 && form.r2 && form.r3][step];
    function next() {
      if (step < STEPS.length - 1) setStep(step + 1);else {
        window.WNAuth.saveProfile(form);
        setDone(true);
      }
    }
    function back() {
      if (step > 0) setStep(step - 1);else onClose();
    }
    if (done) return /*#__PURE__*/React.createElement(ServusReveal, {
      form: form,
      onEnter: () => {
        window.WNAuth.login();
        onLogin();
      },
      onClose: onClose
    });
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        padding: '6px 18px 14px',
        borderBottom: '1px solid var(--ink-100)',
        background: 'var(--weiss)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: back,
      style: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: 'var(--ink-500)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        fontSize: 14,
        padding: 4
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "back",
      size: 20
    }), " ", step === 0 ? 'Abbrechen' : 'Zurück'), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--ink-400, var(--ink-500))',
        letterSpacing: '0.04em'
      }
    }, "Schritt ", step + 1, " / ", STEPS.length)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 5,
        marginTop: 12
      }
    }, STEPS.map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: s,
      style: {
        flex: 1,
        height: 5,
        borderRadius: 3,
        background: i <= step ? 'var(--muc-blau)' : 'var(--ink-100)',
        transition: 'background var(--dur-base)'
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: 'var(--ink-900)',
        marginTop: 12
      }
    }, STEPS[step])), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, step === 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Input, {
      label: "Vorname",
      value: form.vorname,
      onChange: e => set('vorname', e.target.value),
      placeholder: "z.B. Korbinian"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Nachname",
      value: form.nachname,
      onChange: e => set('nachname', e.target.value),
      placeholder: "z.B. Hofbauer"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Geburtsjahr",
      value: form.jahr,
      onChange: e => set('jahr', e.target.value),
      placeholder: "1990",
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Stadtviertel",
      value: form.bezirk,
      onChange: e => set('bezirk', e.target.value),
      placeholder: "Haidhausen",
      style: {
        flex: 1
      }
    }))), step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Dein Foto"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: form.photo,
      name: form.spitzname || form.vorname || '?',
      size: 84,
      ring: !!form.photo
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "md",
      onClick: () => fileRef.current && fileRef.current.click(),
      iconLeft: "\uD83D\uDCF7"
    }, form.photo ? 'Anderes Bild' : 'Bild hochladen'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-500)',
        marginTop: 6
      }
    }, "Zeig dein Gsicht \u2014 gilt f\xFCrs Mitgliederbuch.")), /*#__PURE__*/React.createElement("input", {
      ref: fileRef,
      type: "file",
      accept: "image/*",
      onChange: pickFile,
      style: {
        display: 'none'
      }
    }))), /*#__PURE__*/React.createElement(Input, {
      label: "Spitzname",
      value: form.spitzname,
      onChange: e => set('spitzname', e.target.value),
      placeholder: "z.B. Der Korbi",
      hint: "So steht's auf der Rangliste."
    })), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Stamm-Getr\xE4nk"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10
      }
    }, DRINKS.map(d => /*#__PURE__*/React.createElement(OptionPill, {
      key: d.key,
      active: form.drink === d.key,
      icon: d.icon,
      label: d.label,
      onClick: () => set('drink', d.key)
    })))), /*#__PURE__*/React.createElement(Input, {
      label: "Lieblings-Wirtshaus",
      value: form.wirtshaus,
      onChange: e => set('wirtshaus', e.target.value),
      placeholder: "z.B. Augustiner-Keller",
      iconLeft: "\uD83C\uDF7A"
    })), step === 3 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Wer b\xFCrgt f\xFCr dich?"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, data.members.slice(0, 5).map(m => /*#__PURE__*/React.createElement(OptionPill, {
      key: m.id,
      active: form.buerge === m.name,
      label: m.name,
      sub: m.amt || 'Mitglied',
      onClick: () => set('buerge', m.name)
    })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FieldLabel, null, "Warum willst du dabei sein?"), /*#__PURE__*/React.createElement("textarea", {
      value: form.warum,
      onChange: e => set('warum', e.target.value),
      placeholder: "Ein, zwei S\xE4tze f\xFCr die Runde\u2026",
      rows: 3,
      style: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1.5px solid var(--ink-200)',
        borderRadius: 'var(--r-md)',
        padding: 12,
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        color: 'var(--ink-900)',
        resize: 'none',
        outline: 'none'
      }
    }))), step === 4 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--ink-500)',
        marginBottom: 2
      }
    }, "Der Stammtisch-Kodex. Ohne den geht nix."), [['r1', 'Hoibe ehrlich zählen', 'Kein Schummeln bei der Rangliste.'], ['r2', 'Zugesagt heißt erschienen', 'Wer absagt und nicht kommt, zahlt in die Kasse.'], ['r3', 'Nie zweimal dasselbe Wirtshaus', 'Jeden Stammtisch ein neues Wirtshaus.']].map(([k, t, s]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px',
        background: 'var(--weiss)',
        border: '1px solid var(--ink-100)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--ink-900)'
      }
    }, t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--ink-500)',
        marginTop: 2
      }
    }, s)), /*#__PURE__*/React.createElement(Switch, {
      checked: form[k],
      onChange: v => set(k, v)
    }))))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        padding: '14px 18px calc(18px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--ink-100)',
        background: 'var(--weiss)'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: step === STEPS.length - 1 ? 'gold' : 'primary',
      size: "lg",
      fullWidth: true,
      disabled: !canNext,
      onClick: next,
      iconLeft: step === STEPS.length - 1 ? '🍺' : null
    }, step === STEPS.length - 1 ? 'Antrag absenden' : 'Weiter')));
  }
  window.RegisterFlow = RegisterFlow;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/RegisterFlow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Root.jsx
try { (() => {
// Wirtschaftln — Root: auth gate. Login/Register when logged out, app when in.
(function () {
  const PhoneFrame = window.PhoneFrame;
  function Root() {
    const [authed, setAuthed] = React.useState(window.WNAuth.isLoggedIn());
    const [view, setView] = React.useState('login'); // 'login' | 'register'

    if (authed) {
      const AppShell = window.AppShell;
      return /*#__PURE__*/React.createElement(AppShell, {
        onLogout: () => {
          window.WNAuth.logout();
          setAuthed(false);
          setView('login');
        }
      });
    }
    const LoginScreen = window.LoginScreen;
    const RegisterFlow = window.RegisterFlow;
    const statusColor = view === 'login' ? 'var(--pergament)' : 'var(--ink-900)';
    return /*#__PURE__*/React.createElement(PhoneFrame, {
      statusColor: statusColor,
      bg: view === 'login' ? 'var(--navy-900)' : 'var(--bg-app)'
    }, view === 'login' ? /*#__PURE__*/React.createElement(LoginScreen, {
      onLogin: () => {
        window.WNAuth.login();
        setAuthed(true);
      },
      onRegister: () => setView('register')
    }) : /*#__PURE__*/React.createElement(RegisterFlow, {
      onLogin: () => setAuthed(true),
      onClose: () => setView('login')
    }));
  }
  window.Root = Root;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Root.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/TerminScreen.jsx
try { (() => {
// Wirtschaftln — Termin screen: full lifecycle (Planung → reserviert → heute → abgeschlossen)
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    Card,
    Avatar,
    Badge,
    Button,
    VotePill
  } = DS;
  const Icon = window.WNIcon;
  const T = window.WNTermin;
  const S = window.WNSheets;
  const voteMeta = {
    zu: {
      label: 'Zugesagt',
      color: 'var(--erfolg)',
      bg: 'var(--erfolg-bg)'
    },
    vielleicht: {
      label: 'Vielleicht',
      color: 'var(--warnung)',
      bg: 'var(--warnung-bg)'
    },
    ab: {
      label: 'Abgesagt',
      color: 'var(--strafe)',
      bg: 'var(--strafe-bg)'
    }
  };
  function DateChip({
    datum
  }) {
    const tag = datum.split('.')[0].split(',').pop().trim();
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: 58,
        height: 58,
        flex: 'none',
        borderRadius: 'var(--r-md)',
        background: 'var(--grad-blau)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--sh-sm)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }
    }, "Juli"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 24,
        fontWeight: 800,
        lineHeight: 1
      }
    }, tag));
  }
  function TerminScreen({
    data,
    store
  }) {
    const termin = store.termin;
    const me = data.members.find(m => m.me);
    const isPlaner = me.id === termin.planerId;
    const [vote, setVote] = React.useState(me.vote || 'zu');
    const present = data.members.filter(m => (m.id === me.id ? vote : m.vote) === 'zu');
    const order = {
      zu: 0,
      vielleicht: 1,
      ab: 2
    };
    const members = [...data.members].sort((a, b) => order[a.id === me.id ? vote : a.vote] - order[b.id === me.id ? vote : b.vote]);
    const tally = {
      zu: 0,
      vielleicht: 0,
      ab: 0
    };
    data.members.forEach(m => {
      tally[m.id === me.id ? vote : m.vote]++;
    });
    function addToCalendar() {
      const a = document.createElement('a');
      a.href = T.makeICS(termin);
      a.download = 'stammtisch.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      store.toast('📅 Kalender-Datei erstellt — mit Adresse & Uhrzeit');
    }
    function openAddWirtshaus() {
      store.openSheet(/*#__PURE__*/React.createElement(S.AddWirtshausSheet, {
        onClose: store.closeSheet,
        onPick: w => {
          store.setTermin({
            ...termin,
            wirtshaus: w,
            phase: 'reserviert'
          });
          store.closeSheet();
          store.toast('🍺 ' + w.name + ' reserviert');
        }
      }));
    }
    function openNewTermin() {
      store.openSheet(/*#__PURE__*/React.createElement(S.NewTerminSheet, {
        members: data.members,
        onClose: store.closeSheet,
        onCreate: t => {
          store.setTermin({
            ...T.INITIAL,
            ...t,
            wirtshaus: null,
            phase: 'planung'
          });
          store.closeSheet();
          store.toast('✓ Neuer Termin — ' + t.planer + ' plant');
        }
      }));
    }
    function openCloseVisit() {
      store.openSheet(/*#__PURE__*/React.createElement(S.CloseVisitSheet, {
        participants: present,
        wirtshaus: termin.wirtshaus,
        onClose: store.closeSheet,
        onSave: res => {
          store.activateTavern({
            name: termin.wirtshaus.name,
            bezirk: termin.wirtshaus.bezirk,
            rating: res.stars || 4,
            kaiser: res.kaiserschmarrn && res.kaiserschmarrn.stars || 0,
            brodn: res.schweinsbraten && res.schweinsbraten.stars || 0,
            organisator: termin.planer,
            x: termin.wirtshaus.x,
            y: termin.wirtshaus.y
          });
          store.setTermin({
            ...termin,
            phase: 'abgeschlossen',
            visit: {
              totalHoiben: res.totalHoiben,
              stars: res.stars,
              text: res.text
            }
          });
          store.closeSheet();
          store.toast('🏅 Besuch im Archiv & auf der Karte');
        }
      }));
    }
    function openPenalty() {
      store.openSheet(/*#__PURE__*/React.createElement(S.PenaltyDialog, {
        anwesend: present.length,
        onClose: store.closeSheet,
        onSend: () => {
          store.addPenalty({
            id: 'p' + Date.now(),
            name: me.name,
            photo: me.photo,
            grund: 'Strafrunde – Absage unter 24 h',
            betrag: -(T.HOIBE_PREIS * present.length),
            datum: 'heute',
            paid: false
          });
          setVote('ab');
          store.closeSheet();
          store.toast('✉️ Strafrunde-Mail an die Runde gesendet');
        }
      }));
    }

    // ---------- Proposal / status card per phase ----------
    function ProposalCard() {
      if (termin.phase === 'planung') {
        return /*#__PURE__*/React.createElement(Card, {
          tone: "parchment",
          framed: true,
          pad: 20
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold-700)'
          }
        }, "N\xE4chster Stammtisch"), /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 12
          }
        }, /*#__PURE__*/React.createElement(DateChip, {
          datum: termin.datum
        }), /*#__PURE__*/React.createElement("div", {
          style: {
            minWidth: 0
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--ink-900)'
          }
        }, termin.datum.split(',')[0]), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink-500)',
            marginTop: 2
          }
        }, termin.zeit, " Uhr"))), /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 16,
            padding: '12px 14px',
            background: 'rgba(0,106,179,0.06)',
            borderRadius: 'var(--r-md)',
            border: '1px dashed var(--muc-blau)'
          }
        }, /*#__PURE__*/React.createElement(Avatar, {
          src: data.members.find(m => m.id === termin.planerId)?.photo,
          name: termin.planer,
          size: 36,
          ring: true
        }), /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ink-500)'
          }
        }, "Wirtshaus offen"), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--muc-blau)'
          }
        }, "organisiert von ", termin.planer.split(' ')[0]))), isPlaner ? /*#__PURE__*/React.createElement(Button, {
          variant: "gold",
          size: "lg",
          fullWidth: true,
          onClick: openAddWirtshaus,
          iconLeft: /*#__PURE__*/React.createElement(Icon, {
            name: "pin",
            size: 17
          }),
          style: {
            marginTop: 14
          }
        }, "Wirtshaus festlegen") : /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink-500)',
            marginTop: 14,
            textAlign: 'center'
          }
        }, termin.planer.split(' ')[0], " legt das Wirtshaus noch fest."));
      }
      // reserviert / heute / abgeschlossen all show the venue
      const w = termin.wirtshaus;
      const closed = termin.phase === 'heute' || termin.phase === 'abgeschlossen';
      return /*#__PURE__*/React.createElement(Card, {
        tone: "parchment",
        framed: true,
        pad: 20
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--gold-700)'
        }
      }, "N\xE4chster Stammtisch"), termin.phase === 'abgeschlossen' ? /*#__PURE__*/React.createElement(Badge, {
        tone: "blau",
        solid: true,
        iconLeft: "\u2713"
      }, "Besucht") : /*#__PURE__*/React.createElement(Badge, {
        tone: "gold",
        solid: true,
        iconLeft: "\u2713"
      }, "Reserviert")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: 'var(--font-fraktur)',
          fontSize: 26,
          color: 'var(--navy)',
          marginTop: 10,
          lineHeight: 1.3
        }
      }, w.name), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginTop: 12
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--ink-700)'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "calendar",
        size: 15,
        color: "var(--gold-700)"
      }), termin.datum.split(',')[0], ", ", termin.zeit, " Uhr"), /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-500)'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "pin",
        size: 15,
        color: "var(--gold-700)"
      }), w.adresse)), !closed && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 8,
          marginTop: 16
        }
      }, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "md",
        fullWidth: true,
        onClick: addToCalendar,
        iconLeft: /*#__PURE__*/React.createElement(Icon, {
          name: "calendar",
          size: 16
        })
      }, "Zum Kalender"), isPlaner && /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "md",
        onClick: openAddWirtshaus
      }, "\xC4ndern")));
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '8px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)'
      }
    }, data.saison), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      onClick: openNewTermin,
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 15
      })
    }, "Neuer Termin")), /*#__PURE__*/React.createElement(ProposalCard, null), termin.phase === 'heute' && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--navy)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 20,
      color: "var(--gold-bright)"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        color: 'var(--gold-bright)'
      }
    }, "Anmeldung geschlossen"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--pergament)',
        opacity: 0.8
      }
    }, "Heut is Stammtisch. Jetzt z\xE4hlt's."))), (termin.phase === 'planung' || termin.phase === 'reserviert') && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        margin: '0 4px 8px'
      }
    }, "Hast du Zeit?"), /*#__PURE__*/React.createElement(VotePill, {
      value: vote,
      onChange: setVote
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, ['zu', 'vielleicht', 'ab'].map(k => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        flex: 1,
        textAlign: 'center',
        padding: '12px 6px',
        background: voteMeta[k].bg,
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 26,
        fontWeight: 800,
        color: voteMeta[k].color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, tally[k]), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: voteMeta[k].color,
        marginTop: 4
      }
    }, voteMeta[k].label)))), termin.phase === 'reserviert' && /*#__PURE__*/React.createElement("button", {
      onClick: () => store.setTermin({
        ...termin,
        phase: 'heute'
      }),
      style: {
        alignSelf: 'center',
        border: 'none',
        background: 'transparent',
        color: 'var(--ink-300)',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        textDecoration: 'underline',
        padding: 6
      }
    }, "Demo \u2192 Tag des Treffens")), termin.phase === 'heute' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "gold",
      size: "lg",
      fullWidth: true,
      onClick: openCloseVisit,
      iconLeft: "\uD83C\uDF7A"
    }, "Besuch abschlie\xDFen"), /*#__PURE__*/React.createElement("button", {
      onClick: openPenalty,
      style: {
        border: 'none',
        background: 'transparent',
        color: 'var(--strafe)',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        padding: 6
      }
    }, "Doch absagen? Kostet a Strafrunde")), termin.phase === 'abgeschlossen' && termin.visit && /*#__PURE__*/React.createElement(Card, {
      tone: "dark",
      pad: 20
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--gold)'
      }
    }, "Abend dokumentiert"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34,
        fontWeight: 800,
        color: 'var(--gold-bright)',
        lineHeight: 1
      }
    }, termin.visit.totalHoiben), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--pergament)',
        opacity: 0.7,
        marginTop: 4
      }
    }, "Hoibe")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34,
        fontWeight: 800,
        color: 'var(--gold-bright)',
        lineHeight: 1
      }
    }, termin.visit.stars || '–', /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18
      }
    }, "\u2605")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--pergament)',
        opacity: 0.7,
        marginTop: 4
      }
    }, "Bewertung")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34,
        fontWeight: 800,
        color: 'var(--gold-bright)',
        lineHeight: 1
      }
    }, present.length), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--pergament)',
        opacity: 0.7,
        marginTop: 4
      }
    }, "Dabei"))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--pergament)',
        opacity: 0.85,
        marginTop: 16,
        textAlign: 'center'
      }
    }, "Im Archiv hinterlegt & auf der Karte aktiviert."), /*#__PURE__*/React.createElement(Button, {
      variant: "gold",
      size: "md",
      fullWidth: true,
      onClick: openNewTermin,
      style: {
        marginTop: 14
      }
    }, "N\xE4chsten Termin festlegen")), /*#__PURE__*/React.createElement(Card, {
      tone: "white",
      pad: 8
    }, members.map((m, i) => {
      const v = m.id === me.id ? vote : m.vote;
      return /*#__PURE__*/React.createElement("div", {
        key: m.id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 8px',
          borderTop: i ? '1px solid var(--ink-100)' : 'none'
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        src: m.photo,
        name: m.name,
        size: 40,
        ring: m.ring
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--ink-900)'
        }
      }, m.name, m.me && /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--muc-blau)'
        }
      }, " \xB7 Du"), m.id === termin.planerId && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--gold-700)'
        }
      }, " \xB7 plant"))), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 'var(--r-pill)',
          background: voteMeta[v].bg,
          color: voteMeta[v].color
        }
      }, voteMeta[v].label));
    })));
  }
  window.TerminScreen = TerminScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/TerminScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/WirtshausScreen.jsx
try { (() => {
// Wirtschaftln — Wirtshäuser screen: full Google map (Karte) + card list (Liste)
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    WirtshausCard,
    SegmentedTabs,
    Stat,
    Card,
    Badge,
    StarRating,
    Avatar
  } = DS;

  // Google map centred on Munich — our own beer-mug pins are overlaid on top,
  // so the embed itself shows no marker (keyless embeds only allow one).
  const MUNICH_MAP = 'https://www.google.com/maps?ll=48.137,11.575&z=12&t=m&output=embed';

  // Beer-mug teardrop pins, overlaid on the Google map
  function MapPins({
    taverns,
    activeIdx,
    onPick
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 4,
        pointerEvents: 'none'
      }
    }, taverns.map((t, i) => {
      const isActive = i === activeIdx;
      const next = t.naechstes;
      const x = t.x != null ? t.x : 50,
        y = t.y != null ? t.y : 50;
      return /*#__PURE__*/React.createElement("button", {
        key: t.id,
        onClick: () => onPick(i),
        style: {
          position: 'absolute',
          left: x + '%',
          top: y + '%',
          transform: 'translate(-50%,-100%)',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          pointerEvents: 'auto',
          filter: isActive ? 'drop-shadow(0 4px 6px rgba(12,43,90,.4))' : 'drop-shadow(0 2px 3px rgba(12,43,90,.3))',
          zIndex: isActive ? 5 : 1
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isActive ? 36 : 28,
          height: isActive ? 36 : 28,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          transition: 'all var(--dur-base) var(--ease-standard)',
          background: next ? 'var(--grad-gold)' : isActive ? 'var(--muc-blau)' : 'var(--navy)',
          border: '2px solid #fff',
          boxShadow: 'var(--sh-sm)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          transform: 'rotate(45deg)',
          fontSize: isActive ? 16 : 13
        }
      }, next ? '📍' : '🍺')));
    }));
  }

  // Compact tavern card that sits over the map (photo left, info right)
  function MapBottomCard({
    t,
    idx,
    count,
    onPrev,
    onNext
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        background: 'var(--surface-card)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        border: t.naechstes ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
        boxShadow: 'var(--sh-lg)',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        width: 104,
        flex: 'none',
        background: 'var(--ink-100)'
      }
    }, t.photo && /*#__PURE__*/React.createElement("img", {
      src: t.photo,
      alt: t.name,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        padding: '12px 12px 12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, t.naechstes ? /*#__PURE__*/React.createElement(Badge, {
      tone: "gold",
      solid: true,
      iconLeft: "\uD83D\uDCCD"
    }, "N\xE4chstes Mal") : t.besuchtAm ? /*#__PURE__*/React.createElement(Badge, {
      tone: "blau",
      solid: true,
      iconLeft: "\u2713"
    }, "Besucht") : /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral",
      solid: true
    }, "Offen"), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--ink-400, var(--ink-500))'
      }
    }, idx + 1, " / ", count)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: 'var(--ink-900)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, t.name), t.organisator && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--gold-700)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, "organisiert von ", t.organisator.split(' ')[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink-500)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, t.bezirk), t.rating > 0 && /*#__PURE__*/React.createElement(StarRating, {
      value: t.rating,
      size: 14,
      showValue: true
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--ink-100)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onPrev,
      "aria-label": "Vorheriges",
      style: navBtn
    }, "\u2039"), /*#__PURE__*/React.createElement("button", {
      onClick: onNext,
      "aria-label": "N\xE4chstes",
      style: {
        ...navBtn,
        borderTop: '1px solid var(--ink-100)'
      }
    }, "\u203A")));
  }
  const navBtn = {
    flex: 1,
    width: 42,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--navy)',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Medal styling for ranked positions
  const MEDAL = {
    1: {
      bg: 'var(--grad-gold)',
      fg: 'var(--navy-900)'
    },
    2: {
      bg: 'linear-gradient(135deg,#E7ECF2,#C2CAD6)',
      fg: '#4A5568'
    },
    3: {
      bg: 'linear-gradient(135deg,#E0A267,#C9853F)',
      fg: '#fff'
    }
  };

  // ranking metrics
  const METRICS = {
    stars: {
      field: 'rating',
      icon: '★',
      label: 'STERNE',
      champ: 'Wirtshaus Nr. 1',
      heading: 'Alle Wirtshäuser',
      empty: 'Noch keine Bewertung.'
    },
    kaiser: {
      field: 'kaiser',
      icon: '🥞',
      label: 'SCHMARRN',
      champ: 'Schmarrn-König',
      heading: 'Beste Kaiserschmarrn',
      empty: 'Noch kein Kaiserschmarrn bewertet. 🥞'
    },
    brodn: {
      field: 'brodn',
      icon: '🍖',
      label: 'BRODN',
      champ: 'Brodn-König',
      heading: 'Beste Schweinsbraten',
      empty: 'Noch kein Brodn bewertet. 🍖'
    }
  };

  // One cool numbered row in the ranking
  function RankedCard({
    rank,
    t,
    mc,
    onClick
  }) {
    const top = rank <= 3;
    const medal = MEDAL[rank] || {
      bg: 'var(--ink-100)',
      fg: 'var(--ink-500)'
    };
    const score = (t[mc.field] || 0).toFixed(1);
    const icon = mc.icon;
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClick,
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--surface-card)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        border: rank === 1 ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
        boxShadow: top ? 'var(--sh-md)' : 'var(--sh-sm)',
        padding: '10px 12px 10px 10px',
        fontFamily: 'var(--font-ui)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        position: 'relative',
        width: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    }, rank === 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -13,
        fontSize: 16,
        lineHeight: 1
      }
    }, "\uD83D\uDC51"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: medal.bg,
        color: medal.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        boxShadow: top ? 'var(--sh-xs)' : 'none'
      }
    }, rank)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        width: 54,
        height: 54,
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        background: 'var(--ink-100)'
      }
    }, t.photo && /*#__PURE__*/React.createElement("img", {
      src: t.photo,
      alt: t.name,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, t.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink-500)',
        marginTop: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, t.bezirk), t.organisator && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--gold-700)',
        marginTop: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, "organisiert von ", t.organisator.split(' ')[0])), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 3,
        justifyContent: 'flex-end'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22,
        fontWeight: 800,
        color: 'var(--navy)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, score), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16
      }
    }, icon)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: 'var(--gold-700)',
        marginTop: 3
      }
    }, mc.label)));
  }

  // Full-detail dialog for a tavern (opened from the ranking)
  function DetailModal({
    t,
    rank,
    members,
    onClose
  }) {
    const org = members.find(m => m.name === t.organisator);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,25,58,0.55)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-sheet-in",
      style: {
        position: 'relative',
        width: '100%',
        maxWidth: 340,
        background: 'var(--weiss)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--sh-lg)',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        height: 158
      }
    }, t.photo && /*#__PURE__*/React.createElement("img", {
      src: t.photo,
      alt: t.name,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(7,25,58,0) 40%, rgba(7,25,58,0.82) 100%)'
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      "aria-label": "Schlie\xDFen",
      style: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,0.92)',
        color: 'var(--ink-700)',
        fontSize: 16,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, "\xD7"), rank && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 12,
        left: 12,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--grad-gold)',
        color: 'var(--navy-900)',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '5px 11px',
        borderRadius: 'var(--r-pill)',
        boxShadow: 'var(--sh-sm)'
      }
    }, rank === 1 ? '👑 ' : '', "Platz ", rank), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 24,
        color: 'var(--gold-bright)',
        lineHeight: 1.15,
        textShadow: '0 1px 4px rgba(0,0,0,0.4)'
      }
    }, t.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--pergament)',
        marginTop: 3
      }
    }, t.bezirk))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '16px 18px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        textAlign: 'center',
        padding: '12px 4px',
        background: 'var(--pergament)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 800,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, t.rating > 0 ? t.rating.toFixed(1) : '–', " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, "\u2605")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginTop: 5
      }
    }, "Sterne")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        textAlign: 'center',
        padding: '12px 4px',
        background: 'var(--pergament)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 800,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, t.kaiser > 0 ? t.kaiser.toFixed(1) : '–', " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, "\uD83E\uDD5E")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginTop: 5
      }
    }, "Schmarrn")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        textAlign: 'center',
        padding: '12px 4px',
        background: 'var(--pergament)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 800,
        color: 'var(--navy)',
        lineHeight: 1
      }
    }, t.brodn > 0 ? t.brodn.toFixed(1) : '–', " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, "\uD83C\uDF56")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginTop: 5
      }
    }, "Brodn"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 14,
        padding: '12px 14px',
        background: 'rgba(0,106,179,0.06)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: org && org.photo,
      name: t.organisator || '?',
      size: 38,
      ring: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--ink-500)'
      }
    }, "Organisiert von"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--muc-blau)'
      }
    }, t.organisator || 'Unbekannt'))), t.besuchtAm && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--ink-500)',
        marginTop: 14,
        textAlign: 'center'
      }
    }, "Besucht am ", t.besuchtAm))));
  }
  function WirtshausScreen({
    data,
    store
  }) {
    const [view, setView] = React.useState('karte'); // 'karte' | 'rang' | 'kaiser'
    const [idx, setIdx] = React.useState(0);
    const [detail, setDetail] = React.useState(null); // { t, rank }

    // Base taverns from the live store (so closed-out visits show up here)
    const base = (store && store.taverns ? store.taverns : data.taverns).filter(t => !t.naechstes);
    // Inject the reserved Termin venue as the gold "nächstes" pin
    const ph = store && store.termin ? store.termin.phase : null;
    let injected = [];
    if (store && (ph === 'reserviert' || ph === 'heute') && store.termin.wirtshaus) {
      const w = store.termin.wirtshaus;
      injected = [{
        id: 'next',
        name: w.name,
        bezirk: w.bezirk,
        rating: 0,
        besuchtAm: null,
        naechstes: true,
        x: w.x,
        y: w.y,
        photo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=70'
      }];
    }
    const taverns = [...injected, ...base];
    const visited = taverns.filter(t => t.besuchtAm);
    const avg = visited.length ? (visited.reduce((s, t) => s + t.rating, 0) / visited.length).toFixed(1) : '–';
    const Toggle = /*#__PURE__*/React.createElement(SegmentedTabs, {
      value: view,
      onChange: setView,
      style: {
        alignSelf: 'flex-start'
      },
      tabs: [{
        label: 'Karte',
        value: 'karte'
      }, {
        label: 'Sterne',
        value: 'rang'
      }, {
        label: 'Schmarrn',
        value: 'kaiser'
      }, {
        label: 'Brodn',
        value: 'brodn'
      }]
    });

    // ── KARTE: full Google map + selected Wirtshaus pinned at the bottom ──
    if (view === 'karte') {
      const safeIdx = Math.min(idx, taverns.length - 1);
      const activeT = taverns[safeIdx];
      const step = d => setIdx(i => {
        const n = Math.min(i, taverns.length - 1) + d;
        return (n + taverns.length) % taverns.length;
      });
      return /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute',
          inset: 0,
          overflow: 'hidden'
        }
      }, /*#__PURE__*/React.createElement("iframe", {
        title: "Wirtshaus-Karte",
        src: MUNICH_MAP,
        loading: "lazy",
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none'
        }
      }), /*#__PURE__*/React.createElement(MapPins, {
        taverns: taverns,
        activeIdx: safeIdx,
        onPick: setIdx
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute',
          top: 12,
          left: 14,
          zIndex: 5
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.94)',
          borderRadius: 'var(--r-pill)',
          padding: 4,
          boxShadow: 'var(--sh-md)',
          backdropFilter: 'blur(4px)'
        }
      }, Toggle)), /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 14,
          zIndex: 5
        }
      }, /*#__PURE__*/React.createElement(MapBottomCard, {
        t: activeT,
        idx: safeIdx,
        count: taverns.length,
        onPrev: () => step(-1),
        onNext: () => step(1)
      })));
    }

    // ── RANGLISTE / SCHMARRN / BRODN: numbered ranking, best → worst ──
    const metricKey = view === 'kaiser' ? 'kaiser' : view === 'brodn' ? 'brodn' : 'stars';
    const mc = METRICS[metricKey];
    const ranked = visited.filter(t => (t[mc.field] || 0) > 0).sort((a, b) => (b[mc.field] || 0) - (a[mc.field] || 0));
    const champ = ranked[0];
    const champScore = champ ? (champ[mc.field] || 0).toFixed(1) : '–';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, Toggle, champ && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--sh-md)'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: champ.photo,
      alt: champ.name,
      style: {
        width: '100%',
        height: 150,
        objectFit: 'cover',
        display: 'block'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(7,25,58,0.05) 0%, rgba(7,25,58,0.85) 100%)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 12,
        left: 12,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--grad-gold)',
        color: 'var(--navy-900)',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '5px 12px',
        borderRadius: 'var(--r-pill)',
        boxShadow: 'var(--sh-sm)'
      }
    }, "\uD83D\uDC51 ", mc.champ), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 12,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-fraktur)',
        fontSize: 24,
        color: 'var(--gold-bright)',
        lineHeight: 1.1,
        textShadow: '0 1px 4px rgba(0,0,0,0.4)'
      }
    }, champ.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--pergament)',
        marginTop: 3
      }
    }, champ.bezirk)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        display: 'flex',
        alignItems: 'baseline',
        gap: 3,
        color: '#fff'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 30,
        fontWeight: 800,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums'
      }
    }, champScore), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 20
      }
    }, mc.icon)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '2px 2px 0'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, mc.heading), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink-500)'
      }
    }, "\xB7 vom Besten zum Schlechtesten")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, ranked.map((t, i) => /*#__PURE__*/React.createElement(RankedCard, {
      key: t.id,
      rank: i + 1,
      t: t,
      mc: mc,
      onClick: () => setDetail({
        t,
        rank: i + 1
      })
    })), ranked.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '30px 16px',
        color: 'var(--ink-500)',
        fontSize: 14,
        fontWeight: 600
      }
    }, mc.empty)), detail && /*#__PURE__*/React.createElement(DetailModal, {
      t: detail.t,
      rank: detail.rank,
      members: data.members,
      onClose: () => setDetail(null)
    }));
  }
  window.WirtshausScreen = WirtshausScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/WirtshausScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/auth.js
try { (() => {
// Wirtschaftln — auth & profile state (localStorage-backed).
// Prototype only: no real backend. Demo login always succeeds.
(function () {
  const AUTH_KEY = 'wn_auth_v1'; // 'in' when logged in
  const PROFILE_KEY = 'wn_profile_v1'; // the registered/own member profile

  const Auth = {
    isLoggedIn() {
      try {
        return localStorage.getItem(AUTH_KEY) === 'in';
      } catch (e) {
        return false;
      }
    },
    login() {
      try {
        localStorage.setItem(AUTH_KEY, 'in');
      } catch (e) {}
    },
    logout() {
      try {
        localStorage.removeItem(AUTH_KEY);
      } catch (e) {}
    },
    getProfile() {
      try {
        const r = localStorage.getItem(PROFILE_KEY);
        return r ? JSON.parse(r) : null;
      } catch (e) {
        return null;
      }
    },
    saveProfile(p) {
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      } catch (e) {}
    },
    clearProfile() {
      try {
        localStorage.removeItem(PROFILE_KEY);
      } catch (e) {}
    }
  };
  window.WNAuth = Auth;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/auth.js", error: String((e && e.message) || e) }); }

// ui_kits/app/data.js
try { (() => {
// Wirtschaftln — mock data for the UI kit (window global, not a module)
window.WN_DATA = {
  saison: 'Saison 9 · Frühjahr 2026',
  members: [{
    id: 'sepp',
    name: 'Sepp Brunner',
    photo: 'https://i.pravatar.cc/200?img=12',
    amt: null,
    abende: 38,
    mass: 128,
    wirtshaeuser: 9,
    ring: true,
    vote: 'zu',
    streak: 6,
    bestStreak: 8,
    organisiert: 5,
    runden: 3,
    taxi: 2,
    schweinsbraten: 7
  }, {
    id: 'resi',
    name: 'Resi Gruber',
    photo: 'https://i.pravatar.cc/200?img=45',
    amt: 'Kassenwartin',
    abende: 34,
    mass: 96,
    wirtshaeuser: 9,
    ring: true,
    vote: 'zu',
    me: true,
    streak: 4,
    bestStreak: 6,
    organisiert: 8,
    runden: 2,
    taxi: 1,
    schweinsbraten: 3
  }, {
    id: 'hans',
    name: 'Hans Huber',
    photo: 'https://i.pravatar.cc/200?img=33',
    amt: null,
    abende: 30,
    mass: 88,
    wirtshaeuser: 8,
    ring: false,
    vote: 'vielleicht',
    streak: 2,
    bestStreak: 4,
    organisiert: 2,
    runden: 1,
    taxi: 5,
    schweinsbraten: 4
  }, {
    id: 'toni',
    name: 'Toni Wimmer',
    photo: 'https://i.pravatar.cc/200?img=8',
    amt: null,
    abende: 27,
    mass: 81,
    wirtshaeuser: 8,
    ring: false,
    vote: 'ab',
    streak: -2,
    bestStreak: 3,
    organisiert: 1,
    runden: 0,
    taxi: 0,
    schweinsbraten: 9
  }, {
    id: 'vroni',
    name: 'Vroni Maier',
    photo: 'https://i.pravatar.cc/200?img=26',
    amt: null,
    abende: 25,
    mass: 74,
    wirtshaeuser: 7,
    ring: false,
    vote: 'zu',
    streak: 3,
    bestStreak: 5,
    organisiert: 2,
    runden: 4,
    taxi: 3,
    schweinsbraten: 2
  }, {
    id: 'flo',
    name: 'Florian Egger',
    photo: 'https://i.pravatar.cc/200?img=15',
    amt: 'Schriftführer',
    abende: 24,
    mass: 70,
    wirtshaeuser: 7,
    ring: true,
    vote: 'zu',
    streak: 5,
    bestStreak: 7,
    organisiert: 4,
    runden: 1,
    taxi: 1,
    schweinsbraten: 5
  }, {
    id: 'kathi',
    name: 'Kathi Lang',
    photo: 'https://i.pravatar.cc/200?img=49',
    amt: null,
    abende: 19,
    mass: 52,
    wirtshaeuser: 6,
    ring: false,
    vote: 'vielleicht',
    streak: 2,
    bestStreak: 3,
    organisiert: 1,
    runden: 0,
    taxi: 0,
    schweinsbraten: 1
  }, {
    id: 'bene',
    name: 'Benedikt Stadler',
    photo: 'https://i.pravatar.cc/200?img=53',
    amt: null,
    abende: 14,
    mass: 41,
    wirtshaeuser: 5,
    ring: false,
    vote: 'zu',
    streak: -3,
    bestStreak: 2,
    organisiert: 0,
    runden: 1,
    taxi: 4,
    schweinsbraten: 2
  }, {
    id: 'lena',
    name: 'Lena Voss',
    photo: 'https://i.pravatar.cc/200?img=20',
    amt: null,
    abende: 11,
    mass: 33,
    wirtshaeuser: 5,
    ring: false,
    vote: 'zu',
    streak: 1,
    bestStreak: 2,
    organisiert: 0,
    runden: 0,
    taxi: 6,
    schweinsbraten: 0
  }],
  // Munich taverns — never the same twice
  taverns: [{
    id: 't1',
    name: 'Augustiner-Keller',
    bezirk: 'Maxvorstadt',
    rating: 4.7,
    kaiser: 4.6,
    brodn: 4.8,
    organisator: 'Sepp Brunner',
    besuchtAm: '11. Apr 2026',
    x: 38,
    y: 40,
    photo: 'https://images.unsplash.com/photo-1571805618149-c5a3ffc8e2f2?w=600&q=70'
  }, {
    id: 't2',
    name: 'Wirtshaus in der Au',
    bezirk: 'Au-Haidhausen',
    rating: 4.5,
    kaiser: 4.9,
    brodn: 4.4,
    organisator: 'Resi Gruber',
    besuchtAm: '28. Mär 2026',
    x: 62,
    y: 58,
    photo: 'https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=600&q=70'
  }, {
    id: 't3',
    name: 'Löwenbräukeller',
    bezirk: 'Maxvorstadt',
    rating: 4.2,
    kaiser: 3.8,
    brodn: 4.1,
    organisator: 'Hans Huber',
    besuchtAm: '14. Mär 2026',
    x: 30,
    y: 48,
    photo: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=70'
  }, {
    id: 't4',
    name: 'Zum Flaucher',
    bezirk: 'Isarvorstadt',
    rating: 4.8,
    kaiser: 4.7,
    brodn: 4.9,
    organisator: 'Florian Egger',
    besuchtAm: '29. Feb 2026',
    x: 52,
    y: 72,
    photo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=70'
  }, {
    id: 't5',
    name: 'Hofbräuhaus',
    bezirk: 'Altstadt',
    rating: 3.9,
    kaiser: 3.2,
    brodn: 3.6,
    organisator: 'Toni Wimmer',
    besuchtAm: '15. Feb 2026',
    x: 50,
    y: 50,
    photo: 'https://images.unsplash.com/photo-1546622891-02c72c1537b6?w=600&q=70'
  }, {
    id: 't6',
    name: 'Paulaner am Nockherberg',
    bezirk: 'Au',
    rating: 4.4,
    kaiser: 4.3,
    brodn: 4.5,
    organisator: 'Vroni Maier',
    besuchtAm: '01. Feb 2026',
    x: 60,
    y: 66,
    photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70'
  },
  // upcoming
  {
    id: 't7',
    name: 'Wirtshaus am Hart',
    bezirk: 'Am Hart',
    rating: 0,
    besuchtAm: null,
    naechstes: true,
    x: 44,
    y: 22,
    photo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=70'
  }],
  kasse: {
    saldo: 184.50,
    entries: [{
      id: 'k1',
      member: 'toni',
      name: 'Toni Wimmer',
      photo: 'https://i.pravatar.cc/200?img=8',
      grund: 'Zugesagt & nicht erschienen',
      betrag: -10,
      datum: '11. Apr',
      paid: false
    }, {
      id: 'k2',
      member: 'hans',
      name: 'Hans Huber',
      photo: 'https://i.pravatar.cc/200?img=33',
      grund: 'Zu spät — über 30 min',
      betrag: -5,
      datum: '11. Apr',
      paid: false
    }, {
      id: 'k3',
      member: 'resi',
      name: 'Resi Gruber',
      photo: 'https://i.pravatar.cc/200?img=45',
      grund: 'Strafe beglichen',
      betrag: 10,
      datum: '12. Apr',
      paid: true
    }, {
      id: 'k4',
      member: 'vroni',
      name: 'Vroni Maier',
      photo: 'https://i.pravatar.cc/200?img=26',
      grund: 'Runde geschmissen 🍻',
      betrag: 24,
      datum: '28. Mär',
      paid: true
    }, {
      id: 'k5',
      member: 'sepp',
      name: 'Sepp Brunner',
      photo: 'https://i.pravatar.cc/200?img=12',
      grund: 'Falsches Wirtshaus vorgeschlagen',
      betrag: -3,
      datum: '14. Mär',
      paid: true
    }]
  },
  naechster: {
    wirtshaus: 'Wirtshaus am Hart',
    bezirk: 'Am Hart',
    datum: 'Donnerstag, 11. Juli',
    zeit: '19:00',
    planer: 'Resi Gruber',
    zugesagt: 5,
    vielleicht: 2,
    abgesagt: 1
  },
  aemter: [{
    title: 'Bierwart',
    holder: 'Sepp Brunner',
    icon: '🍺'
  }, {
    title: 'Kassenwartin',
    holder: 'Resi Gruber',
    icon: '💰'
  }, {
    title: 'Spätzünder',
    holder: 'Toni Wimmer',
    icon: '🐌'
  }, {
    title: 'Schriftführer',
    holder: 'Florian Egger',
    icon: '✒️'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/app/icons.jsx
try { (() => {
// Wirtschaftln UI kit — inline icon set (Lucide-style 24px stroke paths).
// Substituting Lucide geometry; documented in readme ICONOGRAPHY.
const WN_ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>',
  map: '<path d="m9 4-6 2.5v15L9 19l6 2.5 6-2.5v-15L15 6.5 9 4z"/><path d="M9 4v15M15 6.5v15"/>',
  trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 16h6M10 16l-.5 4h5l-.5-4"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18M16.5 13.5h.01"/>',
  beer: '<path d="M6 11h9v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z"/><path d="M15 13h2.5a2.5 2.5 0 0 1 0 5H15M6 11V8a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  star: '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.4 6.2 21.4l1.1-6.5L2.6 9.8l6.5-.9L12 3z"/>',
  pin: '<path d="M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M17 20a5.5 5.5 0 0 0-3-4.9"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  flame: '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.7-2.8 1.5-3.5C9 10 9.5 11 10 11.5 10 9 11 5 12 3z"/>'
};
function Icon({
  name,
  size = 22,
  color = 'currentColor',
  stroke = 2,
  style = {}
}) {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style,
    dangerouslySetInnerHTML: {
      __html: WN_ICON_PATHS[name] || ''
    }
  });
}
window.WNIcon = Icon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/terminSheets.jsx
try { (() => {
// Wirtschaftln — Termin sheets & dialogs (rendered as full-frame overlays).
(function () {
  const DS = window.WirtschaftlnDesignSystem_7e7aff;
  const {
    Button,
    Input,
    Avatar,
    Badge,
    StarRating
  } = DS;
  const Icon = window.WNIcon;
  const T = window.WNTermin;

  // ---- generic bottom sheet ------------------------------------------
  function Sheet({
    title,
    sub,
    onClose,
    children,
    footer
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      className: "wn-scrim",
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,25,58,0.45)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-sheet-in",
      style: {
        position: 'relative',
        background: 'var(--weiss)',
        borderRadius: '24px 24px 0 0',
        maxHeight: '92%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(7,25,58,0.4)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--ink-100)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, title), sub && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--ink-500)',
        marginTop: 2
      }
    }, sub)), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      "aria-label": "Schlie\xDFen",
      style: {
        border: 'none',
        background: 'var(--ink-50)',
        width: 34,
        height: 34,
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: 18,
        color: 'var(--ink-500)',
        flex: 'none'
      }
    }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px'
      }
    }, children), footer && /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 'none',
        padding: '14px 20px calc(18px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--ink-100)'
      }
    }, footer)));
  }
  function PlaceRow({
    p,
    onClick
  }) {
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        padding: '12px 12px',
        border: '1px solid var(--ink-100)',
        borderRadius: 'var(--r-md)',
        background: 'var(--weiss)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        flex: 'none',
        borderRadius: 'var(--r-sm)',
        background: 'var(--info-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pin",
      size: 20,
      color: "var(--muc-blau)"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--ink-900)'
      }
    }, p.name), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--ink-500)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, p.adresse)), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 18,
      color: "var(--ink-300)"
    }));
  }

  // ---- 1) Wirtshaus festlegen (Google-style address search) ----------
  function AddWirtshausSheet({
    onClose,
    onPick
  }) {
    const [q, setQ] = React.useState('');
    const results = T.PLACES.filter(p => (p.name + ' ' + p.adresse + ' ' + p.bezirk).toLowerCase().includes(q.toLowerCase()));
    return /*#__PURE__*/React.createElement(Sheet, {
      title: "Wirtshaus festlegen",
      sub: "Such die Adresse \u2014 wir merken sie f\xFCr die Karte.",
      onClose: onClose
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Adresse oder Name",
      value: q,
      onChange: e => setQ(e.target.value),
      placeholder: "z.B. Hofbr\xE4ukeller\u2026",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "map",
        size: 17
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        margin: '10px 2px 14px',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ink-400, var(--ink-500))'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 800,
        color: '#4285F4'
      }
    }, "G"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 800,
        color: '#EA4335'
      }
    }, "o"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 800,
        color: '#FBBC05'
      }
    }, "o"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 800,
        color: '#4285F4'
      }
    }, "g"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 800,
        color: '#34A853'
      }
    }, "l"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 800,
        color: '#EA4335'
      }
    }, "e"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink-400, var(--ink-500))'
      }
    }, "Places \xB7 M\xFCnchen")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, results.map(p => /*#__PURE__*/React.createElement(PlaceRow, {
      key: p.id,
      p: p,
      onClick: () => onPick({
        name: p.name,
        adresse: p.adresse,
        bezirk: p.bezirk,
        x: p.x,
        y: p.y
      })
    })), results.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        color: 'var(--ink-400, var(--ink-500))',
        fontSize: 14,
        padding: '24px 0'
      }
    }, "Nix gfunden. Anders schreiben?")));
  }

  // ---- 2) Neuen Termin festlegen + Planer zuweisen -------------------
  function NewTerminSheet({
    members,
    onClose,
    onCreate
  }) {
    const [datum, setDatum] = React.useState('Donnerstag, 25. Juli 2026');
    const [zeit, setZeit] = React.useState('19:00');
    const [planer, setPlaner] = React.useState(members[0]);
    return /*#__PURE__*/React.createElement(Sheet, {
      title: "Neuer Termin",
      sub: "Gleich am Tisch ausmachen \u2014 wer plant das n\xE4chste Mal?",
      onClose: onClose,
      footer: /*#__PURE__*/React.createElement(Button, {
        variant: "gold",
        size: "lg",
        fullWidth: true,
        iconLeft: "\uD83C\uDF7A",
        onClick: () => onCreate({
          datum,
          zeit,
          planerId: planer.id,
          planer: planer.name
        })
      }, "Termin anlegen")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Datum",
      value: datum,
      onChange: e => setDatum(e.target.value),
      style: {
        flex: 2
      },
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "calendar",
        size: 16
      })
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Zeit",
      value: zeit,
      onChange: e => setZeit(e.target.value),
      style: {
        flex: 1
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-700)',
        margin: '18px 0 8px'
      }
    }, "Wer plant & reserviert?"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, members.map(m => {
      const active = planer.id === m.id;
      return /*#__PURE__*/React.createElement("button", {
        key: m.id,
        onClick: () => setPlaner(m),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
          padding: '10px 12px',
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          border: active ? '1.5px solid var(--muc-blau)' : '1.5px solid var(--ink-200)',
          background: active ? 'var(--info-bg)' : 'var(--weiss)'
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        src: m.photo,
        name: m.name,
        size: 38,
        ring: m.ring
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'block',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--ink-900)'
        }
      }, m.name), m.amt && /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--gold-700)'
        }
      }, m.amt)), active && /*#__PURE__*/React.createElement(Badge, {
        tone: "blau",
        solid: true
      }, "Planer"));
    })));
  }

  // ---- mini hoibe stepper for the close-out sheet --------------------
  function MiniStepper({
    value,
    onChange
  }) {
    const Btn = ({
      d,
      ch
    }) => /*#__PURE__*/React.createElement("button", {
      onClick: () => onChange(Math.max(0, value + d)),
      style: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        fontSize: 18,
        fontWeight: 700,
        background: d > 0 ? 'var(--gold)' : 'var(--ink-50)',
        color: d > 0 ? 'var(--navy-900)' : 'var(--ink-500)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, ch);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Btn, {
      d: -1,
      ch: "\u2212"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 22,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: 800,
        color: 'var(--gold-700)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, value), /*#__PURE__*/React.createElement(Btn, {
      d: 1,
      ch: "+"
    }));
  }

  // ---- 3) Besuch abschließen -----------------------------------------
  // ± stepper for a one-decimal star rating, starts at 3.0
  function StarStepper({
    value,
    onChange
  }) {
    const clamp = v => Math.max(0, Math.min(5, Math.round(v * 10) / 10));
    const btn = {
      width: 44,
      height: 44,
      flex: 'none',
      borderRadius: '50%',
      border: '1.5px solid var(--ink-200)',
      background: 'var(--weiss)',
      cursor: 'pointer',
      fontSize: 22,
      fontWeight: 800,
      color: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onChange(clamp(value - 0.1)),
      "aria-label": "Weniger",
      style: btn
    }, "\u2212"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        minWidth: 96,
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 34,
        fontWeight: 800,
        color: 'var(--navy)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, value.toFixed(1).replace('.', ',')), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 24,
        color: 'var(--gold)'
      }
    }, "\u2605")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onChange(clamp(value + 0.1)),
      "aria-label": "Mehr",
      style: btn
    }, "+"));
  }
  function CloseVisitSheet({
    participants,
    wirtshaus,
    onClose,
    onSave
  }) {
    const [rows, setRows] = React.useState(() => participants.map(p => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      hoiben: 0,
      braten: false,
      taxi: false
    })));
    const [stars, setStars] = React.useState(3);
    const [text, setText] = React.useState('');
    const [kaiserOpen, setKaiserOpen] = React.useState(false);
    const [kaiserStars, setKaiserStars] = React.useState(0);
    const [kaiserText, setKaiserText] = React.useState('');
    const [brodnOpen, setBrodnOpen] = React.useState(false);
    const [brodnStars, setBrodnStars] = React.useState(0);
    const [brodnText, setBrodnText] = React.useState('');
    const setRow = (id, patch) => setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      ...patch
    } : r));
    const totalHoiben = rows.reduce((s, r) => s + r.hoiben, 0);
    return /*#__PURE__*/React.createElement(Sheet, {
      title: "Besuch abschlie\xDFen",
      sub: (wirtshaus && wirtshaus.name) + ' · trag ein, was war',
      onClose: onClose,
      footer: /*#__PURE__*/React.createElement(Button, {
        variant: "gold",
        size: "lg",
        fullWidth: true,
        iconLeft: "\uD83C\uDF7A",
        onClick: () => onSave({
          rows,
          stars,
          text,
          totalHoiben,
          kaiserschmarrn: {
            stars: kaiserStars,
            text: kaiserText
          },
          schweinsbraten: {
            stars: brodnStars,
            text: brodnText
          }
        })
      }, "Abschlie\xDFen & ins Archiv")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginBottom: 8
      }
    }, "Pro Mitglied \xB7 ", totalHoiben, " Hoibe gesamt"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, rows.map(r => /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: '1px solid var(--ink-100)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: r.photo,
      name: r.name,
      size: 34
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--ink-900)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, r.name.split(' ')[0]), /*#__PURE__*/React.createElement("button", {
      onClick: () => setRow(r.id, {
        taxi: !r.taxi
      }),
      title: "Mit dem Auto da? (Taxler)",
      style: {
        width: 34,
        height: 34,
        flex: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: 16,
        border: r.taxi ? 'none' : '1.5px solid var(--ink-200)',
        background: r.taxi ? 'var(--grad-gold)' : 'var(--weiss)',
        filter: r.taxi ? 'none' : 'grayscale(1) opacity(0.5)'
      }
    }, "\uD83D\uDE95"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setRow(r.id, {
        braten: !r.braten
      }),
      title: "Schweinsbraten?",
      style: {
        width: 34,
        height: 34,
        flex: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: 17,
        border: r.braten ? 'none' : '1.5px solid var(--ink-200)',
        background: r.braten ? 'var(--grad-gold)' : 'var(--weiss)',
        filter: r.braten ? 'none' : 'grayscale(1) opacity(0.5)'
      }
    }, "\uD83C\uDF56"), /*#__PURE__*/React.createElement(MiniStepper, {
      value: r.hoiben,
      onChange: v => setRow(r.id, {
        hoiben: v
      })
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: 'var(--ink-100)',
        margin: '18px 0'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-700)',
        marginBottom: 12
      }
    }, "Deine Bewertung"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(StarStepper, {
      value: stars,
      onChange: setStars
    })), /*#__PURE__*/React.createElement("textarea", {
      value: text,
      onChange: e => setText(e.target.value),
      rows: 3,
      placeholder: "Wie war's? Bedienung, Bier, Brotzeit\u2026",
      style: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1.5px solid var(--ink-200)',
        borderRadius: 'var(--r-md)',
        padding: 12,
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        color: 'var(--ink-900)',
        resize: 'none',
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => setKaiserOpen(true),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        marginTop: 14,
        padding: '12px 14px',
        background: 'var(--weiss)',
        border: '1.5px solid var(--ink-200)',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        flex: 'none',
        borderRadius: 'var(--r-md)',
        background: 'var(--pergament)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20
      }
    }, "\uD83E\uDD5E"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Kaiserschmarrn?"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--ink-500)'
      }
    }, kaiserStars > 0 ? kaiserStars + ' / 5 · tippen zum Ändern' : 'Den Nachtisch bewerten')), kaiserStars > 0 && /*#__PURE__*/React.createElement(StarRating, {
      value: kaiserStars,
      size: 14,
      showValue: false
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 18,
      color: "var(--ink-300)"
    })), kaiserOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => setKaiserOpen(false),
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,25,58,0.55)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-sheet-in",
      style: {
        position: 'relative',
        width: '100%',
        maxWidth: 330,
        background: 'var(--weiss)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--sh-lg)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--pergament)',
        padding: '20px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34
      }
    }, "\uD83E\uDD5E"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: 'var(--navy)',
        marginTop: 6
      }
    }, "Kaiserschmarrn"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--ink-500)',
        marginTop: 4
      }
    }, "Wie war der Nachtisch?")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '18px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement(StarRating, {
      value: kaiserStars,
      size: 34,
      onChange: setKaiserStars
    })), /*#__PURE__*/React.createElement("textarea", {
      value: kaiserText,
      onChange: e => setKaiserText(e.target.value),
      rows: 3,
      placeholder: "Fluffig? Z'wenig Rosinen? Erz\xE4hl\u2026",
      style: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1.5px solid var(--ink-200)',
        borderRadius: 'var(--r-md)',
        padding: 12,
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        color: 'var(--ink-900)',
        resize: 'none',
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "gold",
      size: "lg",
      fullWidth: true,
      onClick: () => setKaiserOpen(false),
      style: {
        marginTop: 14
      }
    }, "Speichern")))), /*#__PURE__*/React.createElement("button", {
      onClick: () => setBrodnOpen(true),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        marginTop: 10,
        padding: '12px 14px',
        background: 'var(--weiss)',
        border: '1.5px solid var(--ink-200)',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        flex: 'none',
        borderRadius: 'var(--r-md)',
        background: 'var(--pergament)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20
      }
    }, "\uD83C\uDF56"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Schweinsbraten?"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--ink-500)'
      }
    }, brodnStars > 0 ? brodnStars + ' / 5 · tippen zum Ändern' : 'Den Brodn bewerten')), brodnStars > 0 && /*#__PURE__*/React.createElement(StarRating, {
      value: brodnStars,
      size: 14,
      showValue: false
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron",
      size: 18,
      color: "var(--ink-300)"
    })), brodnOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => setBrodnOpen(false),
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,25,58,0.55)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-sheet-in",
      style: {
        position: 'relative',
        width: '100%',
        maxWidth: 330,
        background: 'var(--weiss)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--sh-lg)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--pergament)',
        padding: '20px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34
      }
    }, "\uD83C\uDF56"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: 'var(--navy)',
        marginTop: 6
      }
    }, "Schweinsbraten"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--ink-500)',
        marginTop: 4
      }
    }, "Wie war der Brodn?")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '18px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement(StarRating, {
      value: brodnStars,
      size: 34,
      onChange: setBrodnStars
    })), /*#__PURE__*/React.createElement("textarea", {
      value: brodnText,
      onChange: e => setBrodnText(e.target.value),
      rows: 3,
      placeholder: "Knusprig? So\xDF'n a Gedicht? Erz\xE4hl\u2026",
      style: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1.5px solid var(--ink-200)',
        borderRadius: 'var(--r-md)',
        padding: 12,
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        color: 'var(--ink-900)',
        resize: 'none',
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "gold",
      size: "lg",
      fullWidth: true,
      onClick: () => setBrodnOpen(false),
      style: {
        marginTop: 14
      }
    }, "Speichern")))));
  }

  // ---- 4) Strafrunde dialog (cancel < 24h) ---------------------------
  function PenaltyDialog({
    anwesend,
    onClose,
    onSend
  }) {
    const preis = T.HOIBE_PREIS;
    const gesamt = preis * anwesend;
    const fmt = n => n.toFixed(2).replace('.', ',');
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,25,58,0.55)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-sheet-in",
      style: {
        position: 'relative',
        width: '100%',
        maxWidth: 330,
        background: 'var(--weiss)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--sh-lg)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--strafe-bg)',
        padding: '20px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34
      }
    }, "\uD83C\uDF7B"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: 'var(--strafe)',
        marginTop: 6
      }
    }, "Absage = Strafrunde"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: '#A93226',
        marginTop: 4
      }
    }, "Weniger als 24 h vorher abgesagt. Du gibst eine Runde an alle, die heut da sind.")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '18px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink-700)',
        padding: '6px 0'
      }
    }, /*#__PURE__*/React.createElement("span", null, "Hoibe (Augustiner St\xFCberl)"), /*#__PURE__*/React.createElement("span", {
      className: "wn-tnum"
    }, fmt(preis), " \u20AC")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink-700)',
        padding: '6px 0',
        borderBottom: '1px solid var(--ink-100)'
      }
    }, /*#__PURE__*/React.createElement("span", null, "Anwesende heut"), /*#__PURE__*/React.createElement("span", {
      className: "wn-tnum"
    }, "\xD7 ", anwesend)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0 16px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Strafrunde"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 24,
        fontWeight: 800,
        color: 'var(--strafe)'
      },
      className: "wn-tnum"
    }, fmt(gesamt), " \u20AC")), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      size: "lg",
      fullWidth: true,
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "bell",
        size: 17
      }),
      onClick: onSend
    }, "E-Mail an die Runde senden"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "md",
      fullWidth: true,
      onClick: onClose,
      style: {
        marginTop: 8
      }
    }, "Doch nicht absagen"))));
  }

  // ---- 5) Wirtschaftler melden ---------------------------------------
  const VORWUERFE = ['Zugesagt & nicht erschienen', 'Zu spät (über 30 min)', 'Falsches Wirtshaus vorgeschlagen', 'Runde vergessen', 'Daneben benommen', 'Sonstiges'];
  function MeldenSheet({
    members,
    onClose,
    onSubmit
  }) {
    const [m, setM] = React.useState(null);
    const [vorwurf, setVorwurf] = React.useState('');
    const [betrag, setBetrag] = React.useState('3,80');
    const valid = m && vorwurf.trim().length > 0;
    const parse = s => parseFloat(String(s).replace(',', '.')) || 0;
    return /*#__PURE__*/React.createElement(Sheet, {
      title: "Wirtschaftler melden",
      sub: "Wer hat sich was zuschulden kommen lassen?",
      onClose: onClose,
      footer: /*#__PURE__*/React.createElement(Button, {
        variant: "danger",
        size: "lg",
        fullWidth: true,
        disabled: !valid,
        iconLeft: "\u2696\uFE0F",
        onClick: () => onSubmit({
          memberId: m.id,
          name: m.name,
          photo: m.photo,
          vorwurf,
          betrag: parse(betrag)
        })
      }, "Melden & PayPal-Link senden")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-700)',
        marginBottom: 8
      }
    }, "Wer?"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 6,
        marginBottom: 6
      }
    }, members.map(x => {
      const active = m && m.id === x.id;
      return /*#__PURE__*/React.createElement("button", {
        key: x.id,
        onClick: () => setM(x),
        style: {
          flex: 'none',
          width: 72,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'center'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          borderRadius: '50%',
          padding: 2,
          background: active ? 'var(--strafe)' : 'transparent'
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        src: x.photo,
        name: x.name,
        size: 52,
        style: {
          border: '2px solid var(--weiss)',
          borderRadius: '50%'
        }
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: active ? 'var(--strafe)' : 'var(--ink-500)',
          marginTop: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }
      }, x.name.split(' ')[0]));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-700)',
        margin: '14px 0 8px'
      }
    }, "Vorwurf"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12
      }
    }, VORWUERFE.map(v => {
      const active = vorwurf === v;
      return /*#__PURE__*/React.createElement("button", {
        key: v,
        onClick: () => setVorwurf(v),
        style: {
          border: active ? '1.5px solid var(--strafe)' : '1.5px solid var(--ink-200)',
          background: active ? 'var(--strafe-bg)' : 'var(--weiss)',
          color: active ? 'var(--strafe)' : 'var(--ink-700)',
          borderRadius: 'var(--r-pill)',
          padding: '7px 12px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer'
        }
      }, v);
    })), /*#__PURE__*/React.createElement(Input, {
      label: "Eigener Vorwurf",
      value: vorwurf,
      onChange: e => setVorwurf(e.target.value),
      placeholder: "Was war los?"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Forderung (\u20AC)",
      value: betrag,
      onChange: e => setBetrag(e.target.value),
      iconLeft: "\uD83D\uDCB6",
      hint: "Richtwert: Hoibe im Augustiner St\xFCberl = 3,80 \u20AC"
    })));
  }

  // ---- 6) Forderung verwalten ----------------------------------------
  function ForderungDialog({
    entry,
    onClose,
    onStatus
  }) {
    const abs = Math.abs(entry.betrag).toFixed(2).replace('.', ',');
    const opts = [['beglichen', 'Als beglichen markieren', 'var(--erfolg)', '✓'], ['offen', 'Noch offen', 'var(--warnung)', '○'], ['aufgehoben', 'Aufheben (erlassen)', 'var(--ink-500)', '✕']];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(7,25,58,0.55)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "wn-sheet-in",
      style: {
        position: 'relative',
        width: '100%',
        maxWidth: 330,
        background: 'var(--weiss)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--sh-lg)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '18px 20px',
        background: 'var(--pergament)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      src: entry.photo,
      name: entry.name,
      size: 46
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, entry.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--ink-500)'
      }
    }, entry.grund)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: 'var(--strafe)'
      }
    }, abs, " \u20AC")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: 'var(--info-bg)',
        borderRadius: 'var(--r-md)',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18
      }
    }, "\uD83D\uDD17"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--muc-blau)'
      }
    }, "PayPal-Link gesendet"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--ink-700)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, "paypal.me/wirtschaftln/", abs.replace(',', '')))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, opts.map(([key, label, color, glyph]) => {
      const active = (entry.status || 'offen') === key;
      return /*#__PURE__*/React.createElement("button", {
        key: key,
        onClick: () => onStatus(key),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          textAlign: 'left',
          padding: '12px 14px',
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          border: active ? `1.5px solid ${color}` : '1.5px solid var(--ink-200)',
          background: active ? 'var(--ink-50)' : 'var(--weiss)',
          fontFamily: 'var(--font-ui)',
          fontSize: 15,
          fontWeight: 700,
          color
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          flex: 'none'
        }
      }, glyph), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1,
          color: 'var(--ink-900)'
        }
      }, label));
    })))));
  }

  // ---- 7) Ausgabe erfassen (club expenditure) ------------------------
  const KATEGORIEN = [{
    key: 'brotzeit',
    label: 'Brotzeit',
    icon: '🥨'
  }, {
    key: 'bier',
    label: 'Bier & Getränk',
    icon: '🍺'
  }, {
    key: 'reservierung',
    label: 'Reservierung',
    icon: '📋'
  }, {
    key: 'ausflug',
    label: 'Ausflug',
    icon: '🚌'
  }, {
    key: 'feier',
    label: 'Jahresfeier',
    icon: '🎉'
  }, {
    key: 'sonstiges',
    label: 'Sonstiges',
    icon: '🧾'
  }];
  function AusgabeSheet({
    saldo,
    onClose,
    onSubmit
  }) {
    const [kat, setKat] = React.useState(KATEGORIEN[0]);
    const [grund, setGrund] = React.useState('');
    const [betrag, setBetrag] = React.useState('');
    const parse = s => parseFloat(String(s).replace(',', '.')) || 0;
    const wert = parse(betrag);
    const valid = grund.trim().length > 0 && wert > 0;
    const rest = saldo - wert;
    return /*#__PURE__*/React.createElement(Sheet, {
      title: "Ausgabe erfassen",
      sub: "Geld aus der Vereinskasse \u2014 wof\xFCr?",
      onClose: onClose,
      footer: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "lg",
        fullWidth: true,
        disabled: !valid,
        iconLeft: kat.icon,
        onClick: () => onSubmit({
          grund,
          betrag: wert,
          icon: kat.icon,
          kategorie: kat.label
        })
      }, valid ? `${wert.toFixed(2).replace('.', ',')} € auszahlen` : 'Ausgabe buchen')
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-700)',
        marginBottom: 8
      }
    }, "Kategorie"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 16
      }
    }, KATEGORIEN.map(c => {
      const active = kat.key === c.key;
      return /*#__PURE__*/React.createElement("button", {
        key: c.key,
        onClick: () => setKat(c),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 12px',
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          textAlign: 'left',
          border: active ? '1.5px solid var(--muc-blau)' : '1.5px solid var(--ink-200)',
          background: active ? 'var(--info-bg)' : 'var(--weiss)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 19
        }
      }, c.icon), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--ink-900)'
        }
      }, c.label));
    })), /*#__PURE__*/React.createElement(Input, {
      label: "Wof\xFCr genau?",
      value: grund,
      onChange: e => setGrund(e.target.value),
      placeholder: "z.B. Brezn & Obatzda f\xFCr die Runde"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Betrag (\u20AC)",
      value: betrag,
      onChange: e => setBetrag(e.target.value),
      type: "text",
      iconLeft: "\uD83D\uDCB6",
      placeholder: "0,00"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        padding: '12px 14px',
        background: 'var(--ink-50)',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-500)'
      }
    }, "Kassenstand danach"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: rest < 0 ? 'var(--strafe)' : 'var(--ink-900)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, rest.toFixed(2).replace('.', ','), " \u20AC")));
  }
  window.WNSheets = {
    Sheet,
    AddWirtshausSheet,
    NewTerminSheet,
    CloseVisitSheet,
    PenaltyDialog,
    MeldenSheet,
    ForderungDialog,
    AusgabeSheet
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/terminSheets.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/terminStore.js
try { (() => {
// Wirtschaftln — Termin store: lifecycle state, place search (Google mock),
// Hoibe reference price (Augustiner Stüberl), calendar (.ics) export.
(function () {
  // Reference price for a Hoibe — always the Augustiner Stüberl price.
  const HOIBE_PREIS = 3.80;

  // Mocked "Google" place results for the Wirtshaus address search.
  const PLACES = [{
    id: 'p1',
    name: 'Wirtshaus am Hart',
    adresse: 'Lerchenauer Str. 271, 80935 München',
    bezirk: 'Am Hart',
    x: 44,
    y: 22
  }, {
    id: 'p2',
    name: 'Augustiner Stüberl',
    adresse: 'Landsberger Str. 19, 80339 München',
    bezirk: 'Schwanthalerhöhe',
    x: 26,
    y: 52
  }, {
    id: 'p3',
    name: 'Hofbräukeller am Wiener Platz',
    adresse: 'Innere Wiener Str. 19, 81667 München',
    bezirk: 'Haidhausen',
    x: 64,
    y: 54
  }, {
    id: 'p4',
    name: 'Der Pschorr',
    adresse: 'Viktualienmarkt 15, 80331 München',
    bezirk: 'Altstadt',
    x: 50,
    y: 52
  }, {
    id: 'p5',
    name: 'Paulaner Bräuhaus',
    adresse: 'Kapuzinerplatz 5, 80337 München',
    bezirk: 'Isarvorstadt',
    x: 48,
    y: 64
  }, {
    id: 'p6',
    name: 'Wirtshaus zum Isartal',
    adresse: 'Brudermühlstr. 2, 81371 München',
    bezirk: 'Sendling',
    x: 42,
    y: 74
  }, {
    id: 'p7',
    name: 'Sankt Emmeramsmühle',
    adresse: 'Emmeramstr. 41, 81925 München',
    bezirk: 'Bogenhausen',
    x: 74,
    y: 34
  }];

  // The current upcoming Termin. Phases:
  //  'planung'      — planner set, no Wirtshaus yet  → "organisiert von X"
  //  'reserviert'   — Wirtshaus chosen, reserved      → calendar, voting open
  //  'heute'        — meeting day, registration closed → close the visit
  //  'abgeschlossen'— visit logged, archived + on map
  const INITIAL = {
    phase: 'planung',
    datum: 'Donnerstag, 11. Juli 2026',
    zeit: '19:00',
    planerId: 'resi',
    planer: 'Resi Gruber',
    wirtshaus: null // { name, adresse, bezirk, x, y }
  };
  function pad(n) {
    return String(n).padStart(2, '0');
  }
  function makeICS(termin) {
    const w = termin.wirtshaus || {
      name: 'Wirtshaus folgt',
      adresse: 'München'
    };
    // fixed demo date 2026-07-11 19:00–23:00 local
    const dtStart = '20260711T190000';
    const dtEnd = '20260711T230000';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wirtschaftln//Stammtisch//DE', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@wirtschaftln.de', 'DTSTAMP:' + dtStart, 'DTSTART:' + dtStart, 'DTEND:' + dtEnd, 'SUMMARY:🍺 Stammtisch – ' + w.name, 'LOCATION:' + (w.adresse || '').replace(/,/g, '\\,'), 'DESCRIPTION:Wirtschaftln Stammtisch. Organisiert von ' + termin.planer + '.', 'END:VEVENT', 'END:VCALENDAR'];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
  }
  window.WNTermin = {
    HOIBE_PREIS,
    PLACES,
    INITIAL,
    makeICS
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/terminStore.js", error: String((e && e.message) || e) }); }

__ds_ns.CrestMark = __ds_scope.CrestMark;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.SegmentedTabs = __ds_scope.SegmentedTabs;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.AmtBadge = __ds_scope.AmtBadge;

__ds_ns.BeerCounter = __ds_scope.BeerCounter;

__ds_ns.KasseEntry = __ds_scope.KasseEntry;

__ds_ns.PersonCard = __ds_scope.PersonCard;

__ds_ns.RankRow = __ds_scope.RankRow;

__ds_ns.VotePill = __ds_scope.VotePill;

__ds_ns.StarRating = __ds_scope.StarRating;

__ds_ns.WirtshausCard = __ds_scope.WirtshausCard;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

})();
