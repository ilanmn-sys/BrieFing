const test = require('node:test');
const assert = require('node:assert');
const { firstEntry, youtubeChannelId, latestFor, isSkipped } = require('../scripts/latest-posts');

test('firstEntry reads RSS items and Atom entries', () => {
  const rss = '<rss><channel><title>Blog</title><item><title><![CDATA[Hello &amp; bye]]></title><link>https://b.example/p/1</link><pubDate>Sun, 11 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
  assert.deepEqual(firstEntry(rss), { title: 'Hello & bye', date: 'Sun, 11 Oct 2026 10:00:00 GMT', link: 'https://b.example/p/1' });
  const atom = '<feed><title>Chan</title><entry><title>Video A</title><link rel="alternate" href="https://youtube.com/watch?v=a"/><published>2026-10-06T15:21:36+00:00</published></entry></feed>';
  assert.deepEqual(firstEntry(atom), { title: 'Video A', date: '2026-10-06T15:21:36+00:00', link: 'https://youtube.com/watch?v=a' });
  assert.equal(firstEntry('<html>nope</html>'), null);
});

test('youtube channel id comes from the URL or the page', () => {
  assert.equal(youtubeChannelId('https://www.youtube.com/channel/UCabc_1', ''), 'UCabc_1');
  assert.equal(youtubeChannelId('https://www.youtube.com/@x', '...feeds/videos.xml?channel_id=UCzz9...'), 'UCzz9');
  assert.equal(youtubeChannelId('https://www.youtube.com/@x', ''), null);
});

test('latestFor uses the YouTube feed, discovers newsletter feeds, and skips walled platforms', () => {
  const pages = {
    'https://www.youtube.com/@x': 'channel_id=UCq1',
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCq1': '<feed><title>X</title><entry><title>New video</title><link href="https://yt/v"/><published>2026-10-10</published></entry></feed>',
    'https://news.example': '<link rel="alternate" type="application/rss+xml" href="/rss/">',
    'https://news.example/rss/': '<rss><item><title>Issue 9</title><link>https://news.example/9</link><pubDate>Fri</pubDate></item></rss>',
  };
  const f = (u) => pages[u] || '';
  assert.equal(latestFor(['https://www.youtube.com/@x'], f).title, 'New video');
  assert.equal(latestFor(['news.example'], f).title, 'Issue 9');
  const none = latestFor(['https://www.linkedin.com/in/a', 'https://instagram.com/b'], f);
  assert.deepEqual(none, { found: false, tried: [] });
  assert.ok(isSkipped('https://x.com/a') && isSkipped('https://twitter.com/a') && !isSkipped('https://box.com/a'));
});
