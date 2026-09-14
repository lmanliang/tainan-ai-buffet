import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(resolve(root, path), 'utf8');
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = 'https://lmanliang.github.io/tainan-ai-buffet/';
const events = JSON.parse(read('data/events.json'));
const seen = new Set();
for (const event of events) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || Number.isNaN(Date.parse(event.date)) || new Date(event.date).toISOString().slice(0, 10) !== event.date) throw Error('Invalid event date');
  if (!['past', 'upcoming'].includes(event.status)) throw Error(`Invalid status: ${event.title}`);
  if (!event.title?.trim() || !event.summary?.trim() || !Array.isArray(event.topics)) throw Error('Missing event content');
  if (seen.has(event.date)) throw Error(`Duplicate event date: ${event.date}`);
  seen.add(event.date);
  if (event.slides && (!/^[\w-]+\/$/.test(event.slides) || !existsSync(resolve(root, event.slides, 'index.html')))) throw Error(`Missing or invalid slides: ${event.slides}`);
  if (event.registration && new URL(event.registration).protocol !== 'https:') throw Error('Registration URL must use HTTPS');
}

function card(event) {
  const upcoming = event.status === 'upcoming';
  return `<article class="event-card">
    <div class="event-date"><time datetime="${event.date}">${event.date.replaceAll('-', '.')}</time><span class="event-status">${upcoming ? '近期活動' : '歷次分享'}</span></div>
    <div class="event-body"><h3>${escape(event.title)}</h3><p>${escape(event.summary)}</p>
      <ul class="tags" aria-label="分享主題">${event.topics.map(topic => `<li>${escape(topic)}</li>`).join('')}</ul>
      <div class="event-actions">${event.slides ? `<a class="button" href="${escape(event.slides)}" aria-label="閱讀 ${escape(event.title)} 簡報">閱讀簡報 <span aria-hidden="true">↗</span></a>` : ''}${event.registration ? `<a class="${upcoming ? 'button' : 'text-link'}" href="${escape(event.registration)}">${upcoming ? '活動詳情與報名' : '當場活動資訊（KKTIX）'} <span aria-hidden="true">↗</span></a>` : ''}</div>
    </div>
  </article>`;
}

// Status is explicit: a build must not guess whether an event is open for registration.
const upcoming = events.filter(event => event.status === 'upcoming').sort((a,b) => a.date.localeCompare(b.date));
const past = events.filter(event => event.status === 'past').sort((a,b) => b.date.localeCompare(a.date));
const html = read('src/index.html')
  .replace('<!-- UPCOMING_NAV -->', upcoming.length ? '<a href="#upcoming">近期活動</a>' : '')
  .replace('<!-- UPCOMING -->', upcoming.length ? `<section class="upcoming-section wrap" id="upcoming" aria-labelledby="upcoming-title"><p class="eyebrow">NEXT GATHERINGS</p><h2 id="upcoming-title">下一場，一起聊。</h2>${upcoming.map(card).join('\n')}</section>` : '')
  .replace('<!-- EVENTS -->', past.length ? past.map(card).join('\n') : '<p>歷次分享將收錄在這裡。</p>');
const urls = [base, ...new Set(events.filter(event => event.slides).map(event => base + event.slides))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
for (const [path, content] of [['index.html', html], ['sitemap.xml', sitemap]]) {
  if (process.argv.includes('--check')) {
    if (!existsSync(resolve(root, path)) || read(path) !== content) throw Error(`${path} is stale; run npm run build`);
  } else writeFileSync(resolve(root, path), content);
}
console.log(`${process.argv.includes('--check') ? 'Checked' : 'Built'} homepage and sitemap: ${past.length} past, ${upcoming.length} upcoming.`);
