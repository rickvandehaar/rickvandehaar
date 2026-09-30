// Builds every static SVG on the profile, once per theme, into assets/.
// Run: pnpm build
import { fileURLToPath } from 'node:url';
import * as si from 'simple-icons';
import { themes } from './lib/theme.mjs';
import { text, measure, wrap, round } from './lib/type.mjs';
import { glyph, tile } from './lib/glyphs.mjs';
import { doc, write, card } from './lib/svg.mjs';

const out = (name, t) => fileURLToPath(new URL(`../assets/${name}-${t.name}.svg`, import.meta.url));
const pct = (t, total) => `${round((t / total) * 100)}%`;

// ---------------------------------------------------------------- header

function header(t) {
  const W = 900;
  const H = 340;
  const X = 52;

  const words = ['RHS UI', 'RHS Command', 'websites that convert', 'webshops that sell'];
  const slot = 3.4;
  const T = words.length * slot;
  const typeStep = 0.07;
  const delStep = 0.028;
  const mono = { font: 'mono', size: 18 };
  const prefix = '$ building ';
  const typeX = X + measure(prefix, mono);
  const typeY = 286;
  const charW = measure('M', mono);

  const cursorFrames = [];
  const wordLayers = words.map((word, i) => {
    const n = word.length;
    const start = i * slot + 0.15;
    const holdEnd = (i + 1) * slot - n * delStep - 0.25;
    const frames = [[0, 0]];
    for (let k = 1; k <= n; k++) frames.push([start + k * typeStep, k]);
    for (let k = n - 1; k >= 0; k--) frames.push([holdEnd + (n - k) * delStep, k]);
    cursorFrames.push(...frames.filter(([time]) => time > 0).map(([time, k]) => [time, k * charW]));
    const kf = frames.map(([time, k]) => `${pct(time, T)} { transform: scaleX(${round(k / n)}); }`).join(' ');
    const w = measure(word, mono) + 2;
    return {
      css: `.tw${i} { transform-origin: 0 0; animation: tw${i} ${T}s step-end infinite; } @keyframes tw${i} { ${kf} 100% { transform: scaleX(0); } }`,
      svg: `<clipPath id="clip-tw${i}"><rect class="tw${i}" x="0" y="-20" width="${round(w)}" height="28"/></clipPath>
      <g clip-path="url(#clip-tw${i})"${i > 0 ? ' class="rm-hide"' : ''}>${text(word, { ...mono, x: 0, y: 0, fill: t.accent })}</g>`,
    };
  });
  cursorFrames.sort((a, b) => a[0] - b[0]);
  // The cursor rests after the first word (the reduced-motion state); frames move it relative to that.
  const word0End = words[0].length * charW;
  const cursorKf = [[0, 0], ...cursorFrames].map(([time, x]) => `${pct(time, T)} { transform: translateX(${round(x - word0End)}px); }`).join(' ');

  // Terminal on the right: a release that only ships after its gates.
  const TX = 604;
  const TY = 58;
  const TW = 248;
  const TH = 222;
  const lines = [
    { at: 0.4, icon: null, label: 'pnpm release', fill: t.text },
    { at: 1.3, icon: 'check', label: 'typecheck', fill: t.muted },
    { at: 2.0, icon: 'check', label: 'tests', fill: t.muted },
    { at: 2.7, icon: 'check', label: 'a11y + seo gates', fill: t.muted },
    { at: 3.5, icon: 'check', label: 'proven on dev', fill: t.muted },
    { at: 4.5, icon: 'arrow', label: 'shipped', fill: t.accent },
  ];
  const TT = 9;
  const termCss = lines
    .map((l, i) => `.tl${i} { animation: tl${i} ${TT}s step-end infinite; } @keyframes tl${i} { 0% { opacity: 0; } ${pct(l.at, TT)} { opacity: 1; } 92% { opacity: 0; } }`)
    .join('\n');
  const termLines = lines
    .map((l, i) => {
      const y = TY + 66 + i * 26;
      const lead = l.icon
        ? glyph(l.icon, { x: TX + 20, y: y - 12, size: 14, stroke: l.icon === 'arrow' ? t.accent : t.ok, width: 2.25 })
        : text('$', { font: 'mono', size: 14, x: TX + 22, y, fill: t.faint });
      return `<g class="tl${i}">${lead}${text(l.label, { font: 'mono', size: 14, x: TX + 42, y, fill: l.fill })}</g>`;
    })
    .join('\n');

  const css = `
.blob-a { animation: drift-a 16s ease-in-out infinite alternate; }
.blob-b { animation: drift-b 19s ease-in-out infinite alternate; }
@keyframes drift-a { from { transform: translate(0px, 0px); } to { transform: translate(90px, 30px); } }
@keyframes drift-b { from { transform: translate(0px, 0px); } to { transform: translate(-80px, -24px); } }
.pulse { transform-origin: ${X + 4}px 66px; animation: pulse 2.4s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(3.2); opacity: 0; } }
.cursor-move { animation: cursor ${T}s step-end infinite; }
@keyframes cursor { ${cursorKf} 100% { transform: translateX(${round(-word0End)}px); } }
.cursor-blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
.rise { animation: rise .9s cubic-bezier(.2,.7,.2,1) both; }
.rise-2 { animation-delay: .12s; } .rise-3 { animation-delay: .24s; } .rise-4 { animation-delay: .36s; }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
${wordLayers.map((w) => w.css).join('\n')}
${termCss}`;

  const body = `
  <defs>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>
    <filter id="blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="60"/></filter>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${t.line}"/></pattern>
    <radialGradient id="dots-fade" cx="0.75" cy="0.35" r="0.75"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <mask id="dots-mask"><rect width="${W}" height="${H}" fill="url(#dots-fade)"/></mask>
  </defs>
  ${card(t, { w: W, h: H, r: 24, id: 'header' })}
  <g clip-path="url(#frame)">
    <g class="blob-a"><ellipse cx="700" cy="40" rx="220" ry="120" fill="${t.glow}" opacity="${t.name === 'dark' ? 0.35 : 0.3}" filter="url(#blur)"/></g>
    <g class="blob-b"><ellipse cx="420" cy="360" rx="200" ry="90" fill="${t.glow}" opacity="${t.name === 'dark' ? 0.18 : 0.16}" filter="url(#blur)"/></g>
    <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dots-mask)" opacity="0.8"/>
  </g>

  <g class="rise">
    <circle class="pulse" cx="${X + 4}" cy="66" r="4" fill="${t.accent}"/>
    <circle cx="${X + 4}" cy="66" r="4" fill="${t.accent}"/>
    ${text('RHS AGENCY  /  THE NETHERLANDS', { font: 'monoMedium', size: 13, x: X + 18, y: 70.5, fill: t.accent, tracking: 0.14 })}
  </g>
  <g class="rise rise-2">${text('Rick van de Haar', { font: 'bold', size: 58, x: X - 3, y: 142, fill: t.text, tracking: -0.025 })}</g>
  <g class="rise rise-3">
    ${text('I design and build premium websites, webshops', { font: 'regular', size: 19.5, x: X, y: 190, fill: t.muted })}
    ${text('and the software that ships them.', { font: 'regular', size: 19.5, x: X, y: 218, fill: t.muted })}
  </g>
  <g class="rise rise-4">
    <rect x="${X}" y="248" width="340" height="1" fill="${t.line}"/>
    ${text(prefix, { ...mono, x: X, y: typeY, fill: t.faint })}
    <g transform="translate(${round(typeX)} ${typeY})">
      ${wordLayers.map((w) => w.svg).join('\n')}
      <g class="cursor-move"><rect class="cursor-blink" x="${round(2 + word0End)}" y="-15" width="9" height="19" rx="1.5" fill="${t.accent}" opacity="0.85"/></g>
    </g>
  </g>

  <g class="rise rise-3">
    <rect x="${TX}" y="${TY}" width="${TW}" height="${TH}" rx="14" fill="${t.bg}" fill-opacity="${t.name === 'dark' ? 0.72 : 0.85}" stroke="${t.line}"/>
    <path d="M${TX} ${TY + 36}h${TW}" stroke="${t.lineSoft}"/>
    <circle cx="${TX + 20}" cy="${TY + 18}" r="4.5" fill="${t.line}"/>
    <circle cx="${TX + 36}" cy="${TY + 18}" r="4.5" fill="${t.line}"/>
    <circle cx="${TX + 52}" cy="${TY + 18}" r="4.5" fill="${t.line}"/>
    ${text('release.log', { font: 'mono', size: 12, x: TX + TW - 18, y: TY + 22, fill: t.faint, anchor: 'end' })}
    ${termLines}
  </g>`;

  return doc({ width: W, height: H, title: 'Rick van de Haar. I design and build premium websites, webshops and the software that ships them.', css, body });
}

// ---------------------------------------------------------------- about (code card)

function about(t) {
  const W = 900;
  const c = t.code;
  const K = (s) => ({ s, f: c.key });
  const S = (s) => ({ s: `"${s}"`, f: c.str });
  const P = (s) => ({ s, f: c.punct });
  const list = (items) => [P('['), ...items.flatMap((it, i) => [S(it), ...(i < items.length - 1 ? [P(', ')] : [])]), P(']')];
  const rows = [
    [{ s: 'const ', f: c.kw }, { s: 'rick', f: t.text }, P(' = {')],
    [K('  role'), P(': '), S('Founder, RHS Agency'), P(',')],
    [K('  based'), P(': '), S('The Netherlands'), P(',')],
    [K('  builds'), P(': '), ...list(['websites', 'webshops', 'platforms', 'apps']), P(',')],
    [K('  stack'), P(': '), ...list(['Next.js', 'Supabase', 'Shopify', 'Electron']), P(',')],
    [K('  workflow'), P(': '), S('one developer, a fleet of AI agents'), P(',')],
    [K('  principle'), P(': '), S('prove it on real data, then ship'), P(',')],
    [P('};')],
  ];
  const size = 16.5;
  const lh = 30;
  const top = 64;
  const H = top + rows.length * lh + 28;
  const cw = measure('M', { font: 'mono', size });

  const code = rows
    .map((row, i) => {
      const y = top + 22 + i * lh;
      let x = 76;
      const parts = row.map((tok) => {
        const p = text(tok.s, { font: 'mono', size, x, y, fill: tok.f });
        x += tok.s.length * cw;
        return p;
      });
      const num = text(String(i + 1), { font: 'mono', size: 13, x: 50, y: y - 1, fill: t.faint, anchor: 'end' });
      return `<g class="ln" style="animation-delay:${round(0.15 + i * 0.07)}s">${num}${parts.join('')}</g>`;
    })
    .join('\n');
  const lastY = top + 22 + (rows.length - 1) * lh;

  const css = `
.ln { animation: ln .7s cubic-bezier(.2,.7,.2,1) both; }
@keyframes ln { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
.caret { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }`;

  const body = `
  ${card(t, { w: W, h: H, r: 20, id: 'about' })}
  <path d="M0 44.5h${W}" stroke="${t.lineSoft}"/>
  <circle cx="24" cy="22" r="5" fill="${t.line}"/>
  <circle cx="42" cy="22" r="5" fill="${t.line}"/>
  <circle cx="60" cy="22" r="5" fill="${t.line}"/>
  ${text('rick.ts', { font: 'monoMedium', size: 13, x: W / 2, y: 27, fill: t.muted, anchor: 'middle' })}
  ${text('TypeScript', { font: 'mono', size: 12, x: W - 24, y: 27, fill: t.faint, anchor: 'end' })}
  <rect x="62" y="${top}" width="1" height="${rows.length * lh}" fill="${t.lineSoft}"/>
  ${code}
  <rect class="caret" x="${round(76 + 2 * cw + 4)}" y="${lastY - 14}" width="8" height="18" rx="1.5" fill="${t.accent}" opacity="0.85"/>`;

  return doc({
    width: W,
    height: H,
    title: 'About Rick: founder of RHS Agency in the Netherlands. Builds websites, webshops, platforms and apps with Next.js, Supabase, Shopify and Electron. One developer with a fleet of AI agents. Principle: prove it on real data, then ship.',
    css,
    body,
  });
}

// ---------------------------------------------------------------- project cards

const projects = [
  {
    id: 'rhs-ui',
    glyph: 'library',
    title: 'RHS UI',
    status: 'OPEN SOURCE · MIT',
    live: true,
    text: 'Components, blocks and icons for React and Next.js. Installs with the shadcn CLI, and you own every line of source.',
    chips: ['React', 'shadcn registry', 'Tailwind'],
  },
  {
    id: 'rhs-command',
    glyph: 'command',
    title: 'RHS Command',
    status: 'PRIVATE · DAILY DRIVER',
    live: true,
    text: 'The desktop control plane for my Claude Code and Codex sessions, with an iOS companion to follow and steer from anywhere.',
    chips: ['Electron', 'Expo', 'TypeScript'],
  },
  {
    id: 'rhs-agency',
    glyph: 'agency',
    title: 'RHS Agency',
    status: 'LIVE · RHSAGENCY.NL',
    live: true,
    text: 'Fast, converting websites with design, build, hosting and maintenance in one subscription, for Dutch businesses.',
    chips: ['Next.js 16', 'Supabase', 'Stripe'],
  },
  {
    id: 'client-work',
    glyph: 'store',
    title: 'Client platforms',
    status: 'PRIVATE · PER CLIENT',
    live: false,
    text: 'Shopify storefronts, B2B portals, ERP sync and memberships. Multi-brand and multilingual, built as one shared system.',
    chips: ['Shopify', 'Hono', 'Railway'],
  },
];

function project(p, t) {
  const W = 440;
  const P = 28;
  const descOpts = { font: 'regular', size: 16 };
  const lines = wrap(p.text, W - 2 * P, descOpts);
  const titleY = 138;
  const descY = titleY + 34;
  const chipsY = descY + (lines.length - 1) * 24 + 26;
  const H = chipsY + 30 + P;

  const statusOpts = { font: 'monoMedium', size: 11, tracking: 0.08 };
  const sw = measure(p.status, statusOpts) + 36;
  const sx = W - P - sw;
  const status = `
  <rect x="${round(sx)}" y="${P + 12}" width="${round(sw)}" height="28" rx="14" fill="${t.chip}" stroke="${t.chipLine}"/>
  ${p.live ? `<circle class="beat" cx="${round(sx + 15)}" cy="${P + 26}" r="3.5" fill="${t.ok}"/>` : ''}
  <circle cx="${round(sx + 15)}" cy="${P + 26}" r="3.5" fill="${p.live ? t.ok : t.faint}"/>
  ${text(p.status, { ...statusOpts, x: sx + 26, y: P + 30, fill: t.muted })}`;

  let cx = P;
  const chips = p.chips
    .map((c) => {
      const o = { font: 'mono', size: 12.5 };
      const w = measure(c, o) + 24;
      const s = `<rect x="${round(cx)}" y="${chipsY}" width="${round(w)}" height="30" rx="8" fill="${t.chip}" stroke="${t.chipLine}"/>${text(c, { ...o, x: cx + 12, y: chipsY + 19.5, fill: t.muted })}`;
      cx += w + 8;
      return s;
    })
    .join('');

  const css = `
.beat { transform-box: fill-box; transform-origin: center; animation: beat 2.2s ease-out infinite; }
@keyframes beat { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(3); opacity: 0; } }`;

  const body = `
  ${card(t, { w: W, h: H, r: 20, id: p.id })}
  ${tile(p.glyph, t, { x: P, y: P, size: 64, id: p.id })}
  ${status}
  ${text(p.title, { font: 'semibold', size: 25, x: P, y: titleY, fill: t.text, tracking: -0.015 })}
  ${lines.map((l, i) => text(l, { ...descOpts, x: P, y: descY + i * 24, fill: t.muted })).join('\n')}
  ${chips}`;

  return doc({ width: W, height: H, title: `${p.title}: ${p.text} (${p.status.toLowerCase()})`, css, body });
}

// ---------------------------------------------------------------- stack

const stack = [
  { label: 'Frontend', items: [['Next.js', si.siNextdotjs], ['React', si.siReact], ['TypeScript', si.siTypescript], ['Tailwind CSS', si.siTailwindcss]] },
  { label: 'Data + API', items: [['Supabase', si.siSupabase], ['PostgreSQL', si.siPostgresql], ['Node.js', si.siNodedotjs], ['Hono', si.siHono], ['n8n', si.siN8n]] },
  { label: 'Commerce', items: [['Shopify', si.siShopify], ['Stripe', si.siStripe], ['Resend', si.siResend]] },
  { label: 'Apps + hosting', items: [['Electron', si.siElectron], ['Expo', si.siExpo], ['Vercel', si.siVercel], ['Railway', si.siRailway]] },
  { label: 'Tooling + AI', items: [['Turborepo', si.siTurborepo], ['pnpm', si.siPnpm], ['GitHub Actions', si.siGithubactions], ['Claude Code', si.siClaude]] },
];

function luminance(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function stackCard(t) {
  const W = 900;
  const P = 32;
  const labelW = 150;
  const pillH = 38;
  const gap = 10;
  const o = { font: 'medium', size: 14.5 };
  let y = P;
  let delay = 0;
  const rows = stack
    .map((row) => {
      let x = P + labelW;
      let rowY = y;
      const pills = row.items
        .map(([name, icon]) => {
          const w = 12 + 18 + 9 + measure(name, o) + 14;
          if (x + w > W - P) {
            x = P + labelW;
            rowY += pillH + gap;
          }
          // Brand colour, unless it would vanish on this background.
          const lum = luminance(icon.hex);
          const fill = t.name === 'dark' ? (lum < 0.08 ? t.text : `#${icon.hex}`) : lum > 0.6 ? t.text : `#${icon.hex}`;
          const s = `<g class="pill" style="animation-delay:${round(delay)}s">
            <rect x="${round(x)}" y="${rowY}" width="${round(w)}" height="${pillH}" rx="10" fill="${t.chip}" stroke="${t.chipLine}"/>
            <g transform="translate(${round(x + 12)} ${rowY + 10}) scale(0.75)"><path d="${icon.path}" fill="${fill}"/></g>
            ${text(name, { ...o, x: x + 39, y: rowY + 24, fill: t.text })}
          </g>`;
          delay += 0.035;
          x += w + gap;
          return s;
        })
        .join('');
      const label = text(row.label.toUpperCase(), { font: 'monoMedium', size: 12, x: P, y: y + 23.5, fill: t.faint, tracking: 0.12 });
      const block = `${label}${pills}`;
      y = rowY + pillH + 18;
      return block;
    })
    .join('\n');
  const H = y - 18 + P;
  const dividers = [];

  const css = `
.pill { animation: pill .6s cubic-bezier(.2,.7,.2,1) both; }
@keyframes pill { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`;

  const names = stack.flatMap((r) => r.items.map(([n]) => n)).join(', ');
  return doc({ width: W, height: H, title: `Tech stack: ${names}`, css, body: `${card(t, { w: W, h: H, r: 20, id: 'stack' })}${dividers.join('')}${rows}` });
}

// ---------------------------------------------------------------- buttons + footer

function button(label, glyphName, t, id) {
  const o = { font: 'medium', size: 15 };
  const W = Math.ceil(measure(label, o) + 20 + 18 + 12 + 22);
  const H = 44;
  const body = `
  ${card(t, { w: W, h: H, r: 12, id })}
  ${glyph(glyphName, { x: 18, y: 13, size: 18, stroke: t.accent, width: 2 })}
  ${text(label, { ...o, x: 46, y: 27.5, fill: t.text })}`;
  return doc({ width: W, height: H, title: label, body });
}

function footer(t) {
  const W = 900;
  const H = 70;
  const css = `
.sheen { animation: sheen 6s ease-in-out infinite; }
@keyframes sheen { 0% { transform: translateX(-320px); } 100% { transform: translateX(${W}px); } }`;
  const body = `
  <defs>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="rule"><rect x="0" y="16" width="${W}" height="1"/></clipPath>
  </defs>
  <rect x="0" y="16" width="${W}" height="1" fill="${t.line}"/>
  <g clip-path="url(#rule)"><rect class="sheen rm-hide" x="0" y="16" width="320" height="1" fill="url(#sheen)"/></g>
  ${text('Every graphic on this page is generated from code in this repository.', { font: 'regular', size: 14, x: W / 2, y: 52, fill: t.faint, anchor: 'middle' })}`;
  return doc({ width: W, height: H, title: 'Every graphic on this page is generated from code in this repository.', css, body });
}

// ---------------------------------------------------------------- write

for (const t of Object.values(themes)) {
  write(out('header', t), header(t));
  write(out('about', t), about(t));
  for (const p of projects) write(out(`project-${p.id}`, t), project(p, t));
  write(out('stack', t), stackCard(t));
  write(out('button-website', t), button('rhsagency.nl', 'arrow', t, 'website'));
  write(out('button-rhs-ui', t), button('rhsui.com', 'arrow', t, 'rhsui'));
  write(out('footer', t), footer(t));
}
console.log('built assets for', Object.keys(themes).join(' + '));
