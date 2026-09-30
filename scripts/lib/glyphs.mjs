// Own glyph set on a 24-unit grid, drawn as round-capped strokes.
// Pattern glyphs (library, command, agency, store) are meant for 34px and up;
// below 22px only the universal shapes (pin, arrow, check, bolt) are used.
export const glyphs = {
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z M12 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  bolt: 'M13 3 5 13.5h6L10.5 21 19 10.5h-6L13 3Z',
  // A 2x2 block grid where one block is lifted: a component library.
  library: 'M4 4h6.5v6.5H4Z M13.5 4H20v6.5h-6.5Z M4 13.5h6.5V20H4Z M15.5 13.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5Z',
  // A window with a prompt: the control plane.
  command: 'M3.5 6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z M7.5 10l3 2.5-3 2.5 M12.5 15.5h4',
  // A browser frame with a rising line: sites that convert.
  agency: 'M3.5 6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z M3.5 8.5h17 M7 16.5l3-3 2.5 2 4.5-4.5',
  // A shop awning over a counter: commerce.
  store: 'M4.5 9.5 6 4.5h12l1.5 5 M4.5 9.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5 M6 12v7.5h12V12 M10 19.5v-4h4v4',
};

/** Glyph as a stroked path, scaled from the 24 grid to `size` px at (x, y). */
export function glyph(name, { x = 0, y = 0, size = 24, stroke = 'currentColor', width = 1.75 } = {}) {
  const s = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${glyphs[name]}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

/** Glyph in its chrome: a rounded tile with a brand gradient and a lit top edge. */
export function tile(name, t, { x = 0, y = 0, size = 56, id = name } = {}) {
  const r = size * 0.28;
  // At a 64 tile the glyph draws at 38px: pattern glyphs stay legible from 34px up.
  const g = size * 0.6;
  return `
  <defs>
    <linearGradient id="tile-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.tileFrom}"/><stop offset="1" stop-color="${t.tileTo}"/>
    </linearGradient>
    <linearGradient id="tile-edge-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.tileEdge}"/><stop offset="1" stop-color="${t.tileEdge}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <g transform="translate(${x} ${y})">
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#tile-${id})"/>
    <rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" rx="${r - 0.5}" fill="none" stroke="url(#tile-edge-${id})"/>
    ${glyph(name, { x: (size - g) / 2, y: (size - g) / 2, size: g, stroke: t.accent, width: 1.75 })}
  </g>`;
}
