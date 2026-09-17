import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(resolve(root, path), 'utf8');
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = 'https://minicourse.dev/';
const events = JSON.parse(read('data/events.json'));
const now = process.env.EVENTS_NOW ? Date.parse(process.env.EVENTS_NOW) : Date.now();
if (!Number.isFinite(now)) throw Error('Invalid EVENTS_NOW');
const isUpcoming = event => event.endsAt ? Date.parse(event.endsAt) > now : event.status === 'upcoming';
const seen = new Set();
for (const event of events) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || Number.isNaN(Date.parse(event.date)) || new Date(event.date).toISOString().slice(0, 10) !== event.date) throw Error('Invalid event date');
  if (event.endsAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(event.endsAt) || !Number.isFinite(Date.parse(event.endsAt)))) throw Error('Invalid endsAt');
  if (!event.endsAt && !['past', 'upcoming'].includes(event.status)) throw Error(`Invalid status: ${event.title}`);
  if (!event.title?.trim() || !event.summary?.trim() || !Array.isArray(event.topics)) throw Error('Missing event content');
  if (seen.has(event.date)) throw Error(`Duplicate event date: ${event.date}`);
  seen.add(event.date);
  if (event.slides && (!/^[\w-]+\/$/.test(event.slides) || !existsSync(resolve(root, event.slides, 'index.html')))) throw Error(`Missing or invalid slides: ${event.slides}`);
  if (event.registration && new URL(event.registration).protocol !== 'https:') throw Error('Registration URL must use HTTPS');
}

function card(event) {
  const upcoming = isUpcoming(event);
  const text = value => escape(value).replaceAll('\n', '<br>');
  const detail = upcoming && event.paragraphs;
  const weekday = '日一二三四五六'[new Date(event.date + 'T12:00:00+08:00').getUTCDay()];
  const [year, month, day] = event.date.split('-').map(Number);
  const info = detail ? `<p><strong>時間｜</strong>${year} 年 ${month} 月 ${day} 日（${weekday}）${escape(event.startTime)}–${escape(event.endTime)}<br><strong>地點｜</strong>${text(event.location)}<br><strong>參加方式｜</strong>${text(event.participation)}</p>` : '';
  const eventId = `event-${event.date}`;
  return `<article class="event-card" id="${eventId}">
    <div class="event-date"><time datetime="${event.date}">${event.date.replaceAll('-', '.')}</time><span class="event-status">${upcoming ? '近期活動' : '歷次分享'}</span></div>
    <div class="event-body${detail ? ' upcoming-body' : ''}"><h3>${escape(event.title)}</h3><p>${detail ? `<strong>${text(event.summary)}</strong>` : text(event.summary)}</p>${detail ? event.paragraphs.map(p => `<p>${text(p)}</p>`).join('') + info : ''}
      <ul class="tags" aria-label="分享主題">${event.topics.map(topic => `<li>${escape(topic)}</li>`).join('')}</ul>
      <div class="event-actions">${event.slides ? `<a class="button" href="${escape(event.slides)}" aria-label="閱讀 ${escape(event.title)} 簡報">閱讀簡報 <span aria-hidden="true">↗</span></a>` : ''}${event.registration ? `<a class="${upcoming ? 'button' : 'text-link'}" href="${escape(event.registration)}">${upcoming ? escape(event.registrationLabel || '活動詳情與報名') : '當場活動資訊（KKTIX）'} <span aria-hidden="true">↗</span></a>` : ''}<a class="text-link event-permalink" href="#${eventId}" aria-label="${escape(event.title)}的固定網址">活動網址 <span aria-hidden="true">#</span></a></div>
    </div>
  </article>`;
}

// Classify at build time using the event end time; legacy records retain explicit status.
const upcoming = events.filter(isUpcoming).sort((a,b) => a.date.localeCompare(b.date));
const past = events.filter(event => !isUpcoming(event)).sort((a,b) => b.date.localeCompare(a.date));
const html = read('src/index.html')
  .replace('<!-- HERO_EVENT_LINK -->', upcoming.length ? '<a class="button" href="#upcoming">接受下一個任務 <span aria-hidden="true">↓</span></a>' : '<a class="button" href="#archive">查看任務紀錄 <span aria-hidden="true">↗</span></a>')
  .replace('<!-- UPCOMING_NAV -->', upcoming.length ? '<a href="#upcoming">近期活動</a>' : '')
  .replace('<!-- UPCOMING -->', upcoming.length ? `<section class="upcoming-section wrap" id="upcoming" aria-labelledby="upcoming-title"><p class="eyebrow">NEXT GATHERINGS</p><h2 id="upcoming-title">${escape(upcoming.length === 1 ? upcoming[0].heading || '下一場，一起聊。' : '下一場，一起聊。')}</h2>${upcoming.map(card).join('\n')}</section>` : '')
  .replace('<!-- EVENTS -->', past.length ? past.map(card).join('\n') : '<p>歷次分享將收錄在這裡。</p>');
const urls = [base, base + 'friends.html', ...new Set(events.filter(event => event.slides).map(event => base + event.slides))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
for (const [path, content] of [['index.html', html], ['sitemap.xml', sitemap]]) {
  if (process.argv.includes('--check')) {
    if (!existsSync(resolve(root, path)) || read(path) !== content) throw Error(`${path} is stale; run npm run build`);
  } else writeFileSync(resolve(root, path), content);
}
console.log(`${process.argv.includes('--check') ? 'Checked' : 'Built'} homepage and sitemap: ${past.length} past, ${upcoming.length} upcoming.`);
