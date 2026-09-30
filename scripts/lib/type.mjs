// Text is rendered to outlined paths so the artwork looks identical everywhere:
// GitHub serves these SVGs as <img>, where web fonts and local fonts are unreliable.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

// geist does not export its package.json, so resolve the fonts from node_modules directly.
const geistRoot = fileURLToPath(new URL('../../node_modules/geist/dist/fonts', import.meta.url));

function load(file) {
  const buf = readFileSync(join(geistRoot, file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

export const fonts = {
  regular: load('geist-sans/Geist-Regular.ttf'),
  medium: load('geist-sans/Geist-Medium.ttf'),
  semibold: load('geist-sans/Geist-SemiBold.ttf'),
  bold: load('geist-sans/Geist-Bold.ttf'),
  mono: load('geist-mono/GeistMono-Regular.ttf'),
  monoMedium: load('geist-mono/GeistMono-Medium.ttf'),
};

const round = (n) => Math.round(n * 100) / 100;

/** Width of a string in px, including letter spacing (in em). */
export function measure(str, { font = 'regular', size = 16, tracking = 0 } = {}) {
  const f = fonts[font];
  const chars = [...str];
  let w = 0;
  chars.forEach((ch, i) => {
    w += (f.charToGlyph(ch).advanceWidth / f.unitsPerEm) * size;
    if (i < chars.length - 1) w += tracking * size;
  });
  return w;
}

/**
 * One line of text as a single <path>.
 * anchor: 'start' | 'middle' | 'end'; y is the baseline.
 */
export function text(str, { x = 0, y = 0, font = 'regular', size = 16, fill = 'currentColor', anchor = 'start', tracking = 0, attrs = '' } = {}) {
  const f = fonts[font];
  const width = measure(str, { font, size, tracking });
  let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  let d = '';
  for (const ch of str) {
    const g = f.charToGlyph(ch);
    d += g.getPath(cx, y, size).toPathData(1);
    cx += (g.advanceWidth / f.unitsPerEm) * size + tracking * size;
  }
  return `<path fill="${fill}" d="${d}"${attrs ? ' ' + attrs : ''}/>`;
}

/** Greedy word wrap on measured width. */
export function wrap(str, maxWidth, opts) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, opts) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export { round };
