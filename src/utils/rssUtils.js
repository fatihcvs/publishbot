const axios = require('axios');
const xml2js = require('xml2js');

/**
 * RSS/Atom feed utilities
 */

async function fetchFeedTitle(url) {
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Publisher-Bot/1.0' } });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.data);

    if (result.feed) {
        return result.feed.title?.[0] || url;
    } else if (result.rss) {
        return result.rss.channel?.[0]?.title?.[0] || url;
    }
    return url;
}

async function fetchLatestEntry(url) {
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Publisher-Bot/1.0' } });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.data);

    // Atom feed
    if (result.feed) {
        const entry = result.feed.entry?.[0];
        if (!entry) return null;
        return {
            id: entry.id?.[0] || entry.link?.[0]?.$.href,
            title: entry.title?.[0] || 'Başlıksız',
            link: entry.link?.[0]?.$.href || '',
            summary: entry.summary?.[0] || entry.content?.[0] || ''
        };
    }

    // RSS 2.0
    if (result.rss) {
        const item = result.rss.channel?.[0]?.item?.[0];
        if (!item) return null;
        return {
            id: item.guid?.[0] || item.link?.[0],
            title: item.title?.[0] || 'Başlıksız',
            link: item.link?.[0] || '',
            summary: item.description?.[0] || ''
        };
    }

    return null;
}

module.exports = { fetchFeedTitle, fetchLatestEntry };
