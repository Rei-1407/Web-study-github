// Build script: converts the source Markdown guide into structured lesson data
// consumed by the study site. Run with:  npm run build   (inside tools/)
//
// Output: ../assets/js/content-data.js  ->  window.LESSON_CONTENT = [...]
//
// It splits the guide by level-2 headings that look like a numbered section
// ("## 1. ...") or an appendix ("## Phụ lục A. ..."), renders each section's
// Markdown to HTML, and converts GitHub alert blockquotes ("> [!NOTE]") into
// styled callout <div>s.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'Huong-dan-GitHub-cho-du-an-Unreal-Engine-v3.md');
const OUT = resolve(__dirname, '..', 'assets', 'js', 'content-data.js');

const ALERT_LABELS = {
  NOTE: 'Ghi chú',
  TIP: 'Mẹo',
  IMPORTANT: 'Quan trọng',
  WARNING: 'Cảnh báo',
  CAUTION: 'Nguy hiểm',
};

// --- Marked instance -------------------------------------------------------
const marked = new Marked({
  gfm: true,
  breaks: false,
});

// Give every heading a slug id so in-page anchors keep working.
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// --- GitHub alert extraction ----------------------------------------------
// Pull "> [!TYPE]" blockquotes out of the raw markdown, replace them with a
// placeholder, and remember their inner markdown so we can render callouts.
function extractAlerts(md) {
  const lines = md.split('\n');
  const out = [];
  const alerts = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^>\s?/.test(line) || line.trim() === '>') {
      // collect the whole blockquote run
      const run = [];
      while (i < lines.length && (/^>\s?/.test(lines[i]) || lines[i].trim() === '>')) {
        run.push(lines[i].replace(/^>\s?/, '').replace(/^>$/, ''));
        i++;
      }
      const inner = run.join('\n');
      const m = inner.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/is);
      if (m) {
        const type = m[1].toUpperCase();
        const rest = m[2] ?? '';
        alerts.push({ type, md: rest.replace(/^\n+/, '') });
        out.push(`%%ALERT_${alerts.length - 1}%%`);
      } else {
        // ordinary blockquote — keep as-is
        for (const r of run) out.push('> ' + r);
      }
      continue;
    }
    out.push(line);
    i++;
  }
  return { md: out.join('\n'), alerts };
}

function renderMarkdown(md) {
  const { md: cleaned, alerts } = extractAlerts(md);
  let html = marked.parse(cleaned);

  // inject heading ids
  html = html.replace(/<(h[2-4])>([\s\S]*?)<\/\1>/g, (full, tag, inner) => {
    const text = inner.replace(/<[^>]+>/g, '');
    return `<${tag} id="${slugify(text)}">${inner}</${tag}>`;
  });

  // swap alert placeholders for callout blocks
  alerts.forEach((a, idx) => {
    const innerHtml = marked.parse(a.md || '');
    const label = ALERT_LABELS[a.type] || a.type;
    const block =
      `<div class="callout callout-${a.type.toLowerCase()}">` +
      `<div class="callout-title"><span class="callout-icon" aria-hidden="true"></span>${label}</div>` +
      `<div class="callout-body">${innerHtml}</div>` +
      `</div>`;
    html = html
      .replace(new RegExp(`<p>%%ALERT_${idx}%%</p>`, 'g'), block)
      .replace(new RegExp(`%%ALERT_${idx}%%`, 'g'), block);
  });

  return html;
}

// --- Section splitting -----------------------------------------------------
function splitSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      const heading = h[1].trim();
      const numMatch = heading.match(/^(\d+)\.\s*(.+)$/);
      const appMatch = heading.match(/^Phụ lục\s+([A-Z])\.\s*(.+)$/i);
      if (numMatch) {
        current = { num: numMatch[1], kind: 'section', title: numMatch[2].trim(), body: [] };
        sections.push(current);
        continue;
      }
      if (appMatch) {
        current = { num: appMatch[1].toUpperCase(), kind: 'appendix', title: appMatch[2].trim(), body: [] };
        sections.push(current);
        continue;
      }
      // other level-2 heading (e.g. "Mục lục") -> stop collecting into a lesson
      current = null;
      continue;
    }
    if (current) current.body.push(line);
  }
  return sections;
}

async function main() {
  const raw = await readFile(SRC, 'utf8');
  const sections = splitSections(raw);

  const lessons = sections.map((s) => {
    const id = s.kind === 'appendix' ? `phu-luc-${s.num.toLowerCase()}` : `muc-${s.num}`;
    return {
      id,
      kind: s.kind,
      num: s.num,
      title: s.title,
      html: renderMarkdown(s.body.join('\n').trim()),
    };
  });

  await mkdir(dirname(OUT), { recursive: true });
  const banner = '// AUTO-GENERATED from Huong-dan-GitHub-cho-du-an-Unreal-Engine-v3.md — do not edit by hand.\n';
  await writeFile(OUT, banner + 'window.LESSON_CONTENT = ' + JSON.stringify(lessons, null, 0) + ';\n', 'utf8');

  console.log(`Wrote ${lessons.length} lessons to ${OUT}`);
  for (const l of lessons) console.log(`  ${l.num.padStart(2, ' ')}  ${l.title}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
