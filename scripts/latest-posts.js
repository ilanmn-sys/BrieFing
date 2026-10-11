#!/usr/bin/env node
// Latest public post per influencer, from feeds rather than page scraping (YouTube channel RSS, newsletter/blog RSS/Atom).
//   node scripts/latest-posts.js '<json>'   where json = [{ "name": "...", "urls": ["https://youtube.com/@x", "https://x.substack.com"] }, ...]
// Prints one JSON line per influencer: { name, found, title, date, link, source } or { name, found:false, tried:[...] }.
// Uses curl so the environment's HTTPS proxy applies. LinkedIn, Instagram, X and TikTok have no public feed: they are skipped here.
const { execFileSync } = require('child_process');

const get = (url) => {
  try { return execFileSync('curl', ['-sSL', '--max-time', '15', '-A', 'Mozilla/5.0', url], { encoding: 'utf8', maxBuffer: 20e6, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (_) { return ''; }
};
const decode = (s) => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const tag = (block, name) => { const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ''; };

// First entry of an RSS (<item>) or Atom (<entry>) feed, or null.
function firstEntry(xml) {
  const m = xml.match(/<item[\s>][\s\S]*?<\/item>/) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/);
  if (!m) return null;
  const b = m[0];
  const atomLink = b.match(/<link[^>]*href="([^"]+)"/);
  const title = tag(b, 'title');
  if (!title) return null;
  return { title, date: tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated'), link: tag(b, 'link') || (atomLink && atomLink[1]) || '' };
}

const isYouTube = (u) => /(^|\.)youtube\.com|youtu\.be/.test(u);
const isSkipped = (u) => /linkedin\.com|instagram\.com|(^|\/\/)(www\.)?(x|twitter)\.com|tiktok\.com/.test(u);
function youtubeChannelId(url, html) {
  const direct = url.match(/\/channel\/(UC[\w-]+)/);
  if (direct) return direct[1];
  const m = (html || '').match(/channel_id=(UC[\w-]+)/) || (html || '').match(/"channelId":"(UC[\w-]+)"/);
  return m ? m[1] : null;
}
const feedCandidates = (u) => { const base = u.replace(/\/+$/, ''); return [base + '/feed', base + '/rss', base + '/feed.xml', base + '/rss.xml', base]; };

function latestFor(urls, fetcher = get) {
  const tried = [];
  for (const raw of urls || []) {
    if (!raw || isSkipped(raw)) continue;
    const url = /^https?:\/\//.test(raw) ? raw : 'https://' + raw;
    if (isYouTube(url)) {
      const id = youtubeChannelId(url, url.includes('/channel/') ? '' : fetcher(url));
      tried.push(url);
      if (!id) continue;
      const e = firstEntry(fetcher(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`));
      if (e) return { found: true, ...e, source: 'youtube' };
      continue;
    }
    const page = fetcher(url);
    const discovered = [...page.matchAll(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/g)]
      .map((m) => (m[0].match(/href="([^"]+)"/) || [])[1]).filter(Boolean)
      .map((h) => (/^https?:/.test(h) ? h : new URL(h, url).href));
    for (const f of [...discovered, ...feedCandidates(url)]) {
      tried.push(f);
      const body = fetcher(f);
      if (!/<(rss|feed)[\s>]/.test(body)) continue;
      const e = firstEntry(body);
      if (e) return { found: true, ...e, source: 'feed' };
    }
  }
  return { found: false, tried };
}

module.exports = { firstEntry, youtubeChannelId, latestFor, isSkipped };

if (require.main === module) {
  let list;
  try { list = JSON.parse(process.argv[2] || '[]'); } catch (e) { console.error('latest-posts: argument must be JSON'); process.exit(2); }
  for (const p of list) process.stdout.write(JSON.stringify({ name: p.name, ...latestFor(p.urls) }) + '\n');
}
