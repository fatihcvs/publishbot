/**
 * Faz 9 — TTL-tabanlı in-memory cache (Redis olmadan)
 * Kullanım:
 *   cache.set('key', value, 30_000); // 30 sn TTL
 *   cache.get('key');                // null döner süresi geçmişse
 *   cache.del('key');
 */

class TTLCache {
    constructor() {
        this._store = new Map(); // key → { value, expiresAt }
    }

    set(key, value, ttlMs = 30_000) {
        this._store.set(key, { value, expiresAt: Date.now() + ttlMs });
    }

    get(key) {
        const entry = this._store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this._store.delete(key);
            return null;
        }
        return entry.value;
    }

    del(key) {
        this._store.delete(key);
    }

    /** Belirli prefix'e sahip tüm key'leri temizle */
    delPrefix(prefix) {
        for (const key of this._store.keys()) {
            if (key.startsWith(prefix)) this._store.delete(key);
        }
    }

    /** Süresi dolmuş tüm girişleri temizle (arka planda çalışır) */
    prune() {
        const now = Date.now();
        for (const [key, entry] of this._store.entries()) {
            if (now > entry.expiresAt) this._store.delete(key);
        }
    }

    get size() { return this._store.size; }
}

const cache = new TTLCache();

// Her 5 dakikada bir eski girişleri temizle
setInterval(() => cache.prune(), 5 * 60_000).unref();

module.exports = { cache, TTLCache };
