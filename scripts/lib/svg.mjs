// Shared SVG scaffolding: document wrapper, motion rules and small helpers.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/**
 * Motion is CSS-only (no SMIL), so a single reduced-motion rule can switch it all
 * off and every element falls back to its final, readable state.
 */
export function doc({ width, height, title, body, css = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
${css}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
  .rm-show { opacity: 1 !important; transform: none !important; }
  .rm-hide { opacity: 0 !important; }
}
</style>
${body}
</svg>
`;
}

export function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content.replace(/\n\s*\n/g, '\n'), 'utf8');
}

/** Card surface: gradient body, hairline border, lit top edge. */
export function card(t, { x = 0, y = 0, w, h, r = 20, id }) {
  return `
  <defs>
    <linearGradient id="card-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.cardTop}"/><stop offset="1" stop-color="${t.card}"/>
    </linearGradient>
    <linearGradient id="card-edge-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${t.accent}" stop-opacity="${t.name === 'dark' ? 0.55 : 0.4}"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="url(#card-${id})" stroke="${t.line}"/>
  <rect x="${x + r}" y="${y}" width="${w - 2 * r}" height="1" fill="url(#card-edge-${id})"/>`;
}
