// Draws the activity card from the public contribution calendar.
// Runs daily in .github/workflows/profile.yml and publishes to the `output` branch.
// Env: GITHUB_TOKEN (required), GH_LOGIN (default: rickvandehaar), OUT_DIR (default: dist).
import { join } from 'node:path';
import { themes } from './lib/theme.mjs';
import { text, measure, round } from './lib/type.mjs';
import { doc, write, card } from './lib/svg.mjs';

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required');
const login = process.env.GH_LOGIN || 'rickvandehaar';
const outDir = process.env.OUT_DIR || 'dist';

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': login },
  body: JSON.stringify({ query, variables: { login } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(`GraphQL failed: ${res.status} ${JSON.stringify(json.errors ?? json.message)}`);

const calendar = json.data.user.contributionsCollection.contributionCalendar;
const weeks = calendar.weeks.map((w) => w.contributionDays);
const days = weeks.flat();
const total = calendar.totalContributions;

// Streaks. Today may still be empty, so the current streak may end yesterday.
let longest = 0;
let run = 0;
for (const d of days) {
  run = d.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
let current = 0;
let i = days.length - 1;
if (days[i]?.contributionCount === 0) i--;
for (; i >= 0 && days[i].contributionCount > 0; i--) current++;
const active = days.filter((d) => d.contributionCount > 0).length;
const best = days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a), days[0]);
const weekly = weeks.map((w) => w.reduce((s, d) => s + d.contributionCount, 0));

const fmt = (n) => n.toLocaleString('en-US');
const month = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
const plural = (n, word) => `${fmt(n)} ${word}${n === 1 ? '' : 's'}`;

function activity(t) {
  const W = 900;
  const H = 318;
  const P = 32;

  const stats = [
    ['CURRENT STREAK', plural(current, 'day')],
    ['LONGEST STREAK', plural(longest, 'day')],
    ['ACTIVE DAYS', fmt(active)],
    ['BEST DAY', `${fmt(best.contributionCount)}`],
  ];
  const statW = 132;
  const statX0 = W - P - stats.length * statW + 12;
  const statSvg = stats
    .map(([label, value], k) => {
      const x = statX0 + k * statW;
      return `${k > 0 ? `<rect x="${x - 14}" y="${P + 6}" width="1" height="50" fill="${t.lineSoft}"/>` : ''}
      ${text(label, { font: 'monoMedium', size: 10.5, x, y: P + 17, fill: t.faint, tracking: 0.1 })}
      ${text(value, { font: 'semibold', size: 21, x, y: P + 50, fill: t.text, tracking: -0.01 })}`;
    })
    .join('');

  // One bar per week, tallest week = full height.
  const chartTop = 138;
  const chartH = 112;
  const chartW = W - 2 * P;
  const step = chartW / weekly.length;
  const barW = Math.max(4, step - 4);
  const max = Math.max(1, ...weekly);
  const bars = weekly
    .map((v, k) => {
      const h = v === 0 ? 3 : Math.max(5, (v / max) * chartH);
      const x = P + k * step + (step - barW) / 2;
      const y = chartTop + chartH - h;
      return `<rect class="bar" style="animation-delay:${round(k * 0.012)}s" x="${round(x)}" y="${round(y)}" width="${round(barW)}" height="${round(h)}" rx="${round(Math.min(3, barW / 2))}" fill="${v === 0 ? t.lineSoft : 'url(#bar)'}"/>`;
    })
    .join('');

  // Month labels under the first week that starts a new month.
  let lastMonth = '';
  const labels = weeks
    .map((w, k) => {
      const m = month(w[0].date);
      if (m === lastMonth) return '';
      lastMonth = m;
      if (k === 0 || k > weeks.length - 3) return '';
      return text(m, { font: 'mono', size: 11, x: P + k * step, y: chartTop + chartH + 24, fill: t.faint });
    })
    .join('');

  const totalStr = fmt(total);
  const css = `
.bar { transform-box: fill-box; transform-origin: 50% 100%; animation: grow .9s cubic-bezier(.2,.7,.2,1) both; }
@keyframes grow { from { transform: scaleY(0); } to { transform: none; } }`;

  const body = `
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.brand}" stop-opacity="${t.name === 'dark' ? 0.55 : 0.75}"/>
    </linearGradient>
  </defs>
  ${card(t, { w: W, h: H, r: 20, id: 'activity' })}
  ${text('LAST 12 MONTHS', { font: 'monoMedium', size: 11, x: P, y: P + 17, fill: t.accent, tracking: 0.14 })}
  ${text(totalStr, { font: 'bold', size: 46, x: P - 2, y: P + 66, fill: t.text, tracking: -0.03 })}
  ${text('contributions', { font: 'regular', size: 17, x: P + measure(totalStr, { font: 'bold', size: 46, tracking: -0.03 }) + 10, y: P + 66, fill: t.muted })}
  ${statSvg}
  <rect x="${P}" y="${chartTop + chartH + 0.5}" width="${chartW}" height="1" fill="${t.lineSoft}"/>
  ${bars}
  ${labels}`;

  return doc({
    width: W,
    height: H,
    title: `${totalStr} contributions in the last 12 months. Current streak ${plural(current, 'day')}, longest streak ${plural(longest, 'day')}, active on ${active} of ${days.length} days, best day ${best.contributionCount}.`,
    css,
    body,
  });
}

for (const t of Object.values(themes)) write(join(outDir, `activity-${t.name}.svg`), activity(t));
console.log(`activity: ${total} contributions, streak ${current}/${longest}, ${active} active days, best ${best.contributionCount} on ${best.date}`);
