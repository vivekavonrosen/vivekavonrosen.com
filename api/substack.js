// Serverless function: fetch Viveka's Substack RSS and return the latest posts as JSON.
// Cached at the edge for an hour, so new posts appear automatically without a redeploy.

const FEED = 'https://vivekavonrosen.substack.com/feed';

function pick(block, tag) {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1] : '';
}
function clean(s) {
  return (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')   // unwrap CDATA
    .replace(/<[^>]+>/g, ' ')                        // strip tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#38;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#8220;|&ldquo;/g, '“').replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8230;|&hellip;/g, '…').replace(/&#8212;|&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

export default async function handler(req, res) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(FEED, { signal: ctrl.signal, headers: { 'User-Agent': 'vvr-site' } });
    clearTimeout(t);
    if (!r.ok) throw new Error('feed ' + r.status);
    const xml = await r.text();

    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const posts = items.slice(0, 9).map(function (it) {
      const title = clean(pick(it, 'title'));
      const link = clean(pick(it, 'link'));
      const dateRaw = clean(pick(it, 'pubDate'));
      let date = dateRaw;
      const d = new Date(dateRaw);
      if (!isNaN(d)) date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      // cover image from <enclosure url="...">
      const enc = it.match(/<enclosure[^>]*url="([^"]+)"/);
      const image = enc ? enc[1] : '';
      // excerpt: prefer the post body, fall back to the subtitle/description
      const body = clean(pick(it, 'content:encoded'));
      const desc = clean(pick(it, 'description'));
      const excerpt = truncate(body.length > 60 ? body : desc, 150);
      return { title, link, date, image, excerpt };
    });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ ok: true, posts });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json({ ok: false, posts: [], error: String(e && e.message || e) });
  }
}
