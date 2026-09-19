// Regenerates terminal.svg with live GitHub numbers.
// Run: GITHUB_TOKEN=$(gh auth token) node scripts/gen-terminal.mjs
import { writeFileSync } from "node:fs";

const USER = "BhumishDayal";

// Deep Field tokens, converted from the portfolio's oklch() values in assets/css/styles.css.
const C = {
  body: "#000a09",      // --surface-solid
  bar: "#001916",       // --shallow
  edge: "#789b92",      // --edge
  kelp: "#589c81",      // --kelp
  kelp2: "#3e7d66",     // --kelp-2
  foam: "#a5c6be",      // --foam
  amber: "#d5ad6f",     // --amber
  text: "#dce3e1",      // --text
  text2: "#a2aeab",     // --text-2
  text3: "#6b7776",     // --text-3
};

const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace";

async function stats() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required. Locally: GITHUB_TOKEN=$(gh auth token) node scripts/gen-terminal.mjs");

  // ponytail: first:100 caps the language tally at 100 public repos. Paginate if he ever passes that.
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query {
        user(login:"${USER}") {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks { contributionDays { contributionCount date weekday } }
            }
          }
          repositories(first:100, ownerAffiliations:OWNER, privacy:PUBLIC) {
            totalCount
            nodes { primaryLanguage { name } }
          }
        }
      }`,
    }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GitHub API: ${JSON.stringify(json.errors)}`);

  const u = json.data.user;
  const counts = new Map();
  for (const n of u.repositories.nodes) {
    const name = n.primaryLanguage?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return {
    contributions: u.contributionsCollection.contributionCalendar.totalContributions,
    repos: u.repositories.totalCount,
    topLang: [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0],
    weeks: u.contributionsCollection.contributionCalendar.weeks,
  };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// One <tspan> per coloured run, so a line can mix palette colours on a single baseline.
const runs = (parts) =>
  parts.map(([t, fill]) => `<tspan fill="${fill}">${esc(t)}</tspan>`).join("");

function build(s) {
  const W = 840, BAR = 40, PAD = 26, LH = 30, FS = 15;
  const top = BAR + 34;

  const lines = [
    { parts: [["~ ", C.kelp2], ["% ", C.kelp], ["whoami", C.text]] },
    { parts: [["Bhumish Dayal · CS @ UT Dallas '27", C.text2]] },
    { gap: true },
    { parts: [["~ ", C.kelp2], ["% ", C.kelp], ["now", C.text]] },
    { parts: [["Open to SWE and ML roles · building Cursorly and Tryeka", C.text2]] },
    { gap: true },
    { parts: [["~ ", C.kelp2], ["% ", C.kelp], ["stats", C.text]] },
    {
      parts: [
        [String(s.contributions), C.amber],
        [" contributions · ", C.text3],
        [String(s.repos), C.amber],
        [" public repos · mostly ", C.text3],
        [s.topLang, C.foam],
      ],
    },
    { gap: true },
    { parts: [["~ ", C.kelp2], ["% ", C.kelp], ["links", C.text]] },
    { parts: [["bhumishdayal.com   cursorly.app   tryeka.com", C.kelp]] },
  ];

  // One shared timeline: every line owns a slice of CYCLE, so the loop restarts cleanly.
  const CYCLE = 24;
  const TYPE = 0.55;
  const HOLD = 10;
  const real = lines.filter((l) => !l.gap);
  const step = (CYCLE - HOLD) / real.length;

  let y = top, i = 0, body = "", css = "";
  for (const l of lines) {
    if (l.gap) { y += LH * 0.55; continue; }
    const start = i * step;
    const chars = l.parts.reduce((n, [t]) => n + t.length, 0);
    // Percentages of the shared CYCLE: hidden -> typed -> held through the wrap.
    const p0 = (start / CYCLE) * 100;
    const p1 = ((start + TYPE) / CYCLE) * 100;
    css += `.l${i}{clip-path:inset(0 100% 0 0);animation:t${i} ${CYCLE}s steps(${chars}) infinite}` +
           `@keyframes t${i}{0%,${p0.toFixed(2)}%{clip-path:inset(0 100% 0 0)}` +
           `${p1.toFixed(2)}%,100%{clip-path:inset(0 -6px 0 0)}}`;
    body += `<text class="l${i}" x="${PAD}" y="${y}" font-family="${MONO}" font-size="${FS}">${runs(l.parts)}</text>`;
    y += LH; i++;
  }

  const H = y + PAD - 6;
  const curY = y - LH + 6;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Terminal introduction for Bhumish Dayal">
<defs>
<linearGradient id="ray" x1="0" y1="0" x2="0.35" y2="1">
<stop offset="0" stop-color="${C.foam}" stop-opacity="0.10"/>
<stop offset="0.55" stop-color="${C.kelp}" stop-opacity="0.03"/>
<stop offset="1" stop-color="${C.kelp}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="warm" x1="0.2" y1="0" x2="0.5" y2="1">
<stop offset="0" stop-color="${C.amber}" stop-opacity="0.07"/>
<stop offset="1" stop-color="${C.amber}" stop-opacity="0"/>
</linearGradient>
<clipPath id="win"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="13"/></clipPath>
<style>
${css}
.cur{animation:b 1.06s steps(1) infinite}
@keyframes b{0%,50%{opacity:1}50.01%,100%{opacity:0}}
</style>
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="13" fill="${C.body}" stroke="${C.edge}" stroke-opacity="0.22"/>
<g clip-path="url(#win)">
<path d="M120 0 L300 0 L170 ${H} L20 ${H} Z" fill="url(#ray)"/>
<path d="M470 0 L560 0 L430 ${H} L360 ${H} Z" fill="url(#warm)"/>
<rect x="0" y="0" width="${W}" height="${BAR}" fill="${C.bar}"/>
<rect x="0" y="${BAR - 0.5}" width="${W}" height="1" fill="${C.edge}" fill-opacity="0.18"/>
<circle cx="22" cy="${BAR / 2}" r="5" fill="${C.amber}" fill-opacity="0.85"/>
<circle cx="42" cy="${BAR / 2}" r="5" fill="${C.kelp}" fill-opacity="0.8"/>
<circle cx="62" cy="${BAR / 2}" r="5" fill="${C.text3}" fill-opacity="0.6"/>
<text x="${W / 2}" y="${BAR / 2 + 4}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${C.text3}">bhumish@utd · zsh</text>
${body}
<rect class="cur" x="${PAD}" y="${curY}" width="9" height="17" fill="${C.kelp}"/>
</g>
</svg>
`;
}

// Contribution heatmap, drawn from the same API call. Self-hosted so it cannot 503
// the way the shared github-readme-stats instance did.
function buildGraph(s) {
  const CELL = 11, GAP = 3, PITCH = CELL + GAP;
  const LEFT = 30, TOP = 58, PAD = 18;
  const W = LEFT + s.weeks.length * PITCH + PAD;
  const H = TOP + 7 * PITCH + 34;

  // Quartile buckets, not linear-to-peak: one busy day would otherwise wash every
  // ordinary day down into the darkest step and the graph would read as empty.
  const active = s.weeks
    .flatMap((w) => w.contributionDays.map((d) => d.contributionCount))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const q = (p) => active[Math.min(active.length - 1, Math.floor(active.length * p))] ?? 1;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  // Four kelp steps from the empty-cell tint up to full accent.
  const ramp = ["#04120f", "#1e4739", "#356b57", C.kelp2, C.kelp];
  const level = (n) => (n === 0 ? 0 : n <= cuts[0] ? 1 : n <= cuts[1] ? 2 : n <= cuts[2] ? 3 : 4);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let cells = "", months = "", seen = -1;

  s.weeks.forEach((w, x) => {
    const first = w.contributionDays[0];
    if (first) {
      const m = new Date(first.date + "T00:00:00Z").getUTCMonth();
      if (m !== seen && x < s.weeks.length - 1) {
        months += `<text x="${LEFT + x * PITCH}" y="${TOP - 10}" font-family="${MONO}" font-size="10" fill="${C.text3}">${MONTHS[m]}</text>`;
        seen = m;
      }
    }
    for (const d of w.contributionDays) {
      const fill = ramp[level(d.contributionCount)];
      cells += `<rect x="${LEFT + x * PITCH}" y="${TOP + d.weekday * PITCH}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}"><title>${d.contributionCount} on ${esc(d.date)}</title></rect>`;
    }
  });

  let days = "";
  for (const [wd, label] of [[1, "Mon"], [3, "Wed"], [5, "Fri"]]) {
    days += `<text x="0" y="${TOP + wd * PITCH + CELL - 2}" font-family="${MONO}" font-size="9" fill="${C.text3}">${label}</text>`;
  }

  const legX = W - PAD - 5 * PITCH - 66;
  let legend = `<text x="${legX}" y="${H - 14}" font-family="${MONO}" font-size="10" fill="${C.text3}">less</text>`;
  ramp.forEach((c, k) => {
    legend += `<rect x="${legX + 32 + k * PITCH}" y="${H - 24}" width="${CELL}" height="${CELL}" rx="2.5" fill="${c}"/>`;
  });
  legend += `<text x="${legX + 32 + 5 * PITCH + 4}" y="${H - 14}" font-family="${MONO}" font-size="10" fill="${C.text3}">more</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${s.contributions} contributions in the last year">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="13" fill="${C.body}" stroke="${C.edge}" stroke-opacity="0.22"/>
<text x="${LEFT}" y="26" font-family="${MONO}" font-size="12" fill="${C.text2}"><tspan fill="${C.amber}">${s.contributions}</tspan> contributions in the last year</text>
${months}${days}${cells}${legend}
</svg>
`;
}

const s = await stats();
writeFileSync(new URL("../terminal.svg", import.meta.url), build(s));
writeFileSync(new URL("../contributions.svg", import.meta.url), buildGraph(s));

// The day counts must survive the render, or the graph is quietly lying.
const drawn = [...buildGraph(s).matchAll(/<title>(\d+) on/g)].map((m) => +m[1]);
const sum = drawn.reduce((a, b) => a + b, 0);
if (sum !== s.contributions) {
  throw new Error(`graph renders ${sum} contributions but the API reports ${s.contributions}`);
}

console.log(`terminal.svg + contributions.svg written:`, {
  contributions: s.contributions, repos: s.repos, topLang: s.topLang, days: drawn.length,
});
