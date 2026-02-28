const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType
} = require('@discordjs/voice');
const playdl = require('play-dl');

class GuildQueue {
    constructor() {
        this.songs = [];      // [{ title, url, duration, requesterId }]
        this.current = null;
        this.player = createAudioPlayer();
        this.connection = null;
        this.volume = 100;
        this.loop = 'off';   // 'off' | 'song' | 'queue'
        this.filter = 'normal';
        this.djRoleId = null;
        this.is247 = false;
        this.textChannel = null;
    }
}

class MusicManager {
    constructor() {
        this.queues = new Map(); // guildId → GuildQueue
    }

    getQueue(guildId) {
        return this.queues.get(guildId) || null;
    }

    _createQueue(guildId) {
        const q = new GuildQueue();
        this.queues.set(guildId, q);
        return q;
    }

    _destroy(guildId) {
        const q = this.queues.get(guildId);
        if (!q) return;
        q.songs = [];
        q.current = null;
        try { q.player.stop(true); } catch { }
        try { q.connection?.destroy(); } catch { }
        this.queues.delete(guildId);
    }

    async play(guild, voiceChannel, textChannel, query) {
        let q = this.getQueue(guild.id);
        if (!q) q = this._createQueue(guild.id);
        q.textChannel = textChannel;

        // Bağlan
        if (!q.connection || q.connection.state.status === VoiceConnectionStatus.Destroyed) {
            q.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true
            });
            q.connection.subscribe(q.player);
        }

        // Arama / URL çözümle
        let songs = [];
        try {
            // Spotify link → YouTube dönüşümü
            if (query.includes('spotify.com')) {
                const spType = await playdl.spotify(query);
                if (spType && spType.fetched_tracks) {
                    const tracks = spType.fetched_tracks.get();
                    for (const t of tracks.slice(0, 25)) { // max 25
                        songs.push({ title: `${t.name} ${t.artists[0]?.name || ''}`, url: null, spotifySearch: true });
                    }
                } else {
                    songs.push({ title: spType?.name + ' ' + (spType?.artists?.[0]?.name || ''), url: null, spotifySearch: true });
                }
            } else {
                const results = query.startsWith('http')
                    ? await playdl.search(query, { source: { youtube: 'video' }, limit: 1 })
                    : await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
                if (results.length === 0) throw new Error('Sonuç bulunamadı');
                songs.push({ title: results[0].title, url: results[0].url, durationSec: results[0].durationInSec, requesterId: null });
            }
        } catch (e) {
            throw new Error(`Arama hatası: ${e.message}`);
        }

        q.songs.push(...songs);

        if (q.player.state.status === AudioPlayerStatus.Idle) {
            await this._playNext(guild.id);
            return { queued: false, song: q.current };
        }
        return { queued: true, song: songs[0] };
    }

    async _playNext(guildId) {
        const q = this.getQueue(guildId);
        if (!q) return;

        if (q.songs.length === 0) {
            q.current = null;
            if (!q.is247) {
                setTimeout(() => {
                    const qq = this.getQueue(guildId);
                    if (qq && !qq.current && !qq.is247) this._destroy(guildId);
                }, 30000);
            }
            return;
        }

        q.current = q.songs.shift();

        // Spotify search → YouTube URL bul
        if (q.current.spotifySearch) {
            try {
                const res = await playdl.search(q.current.title, { source: { youtube: 'video' }, limit: 1 });
                if (res.length > 0) {
                    q.current.url = res[0].url;
                    q.current.title = res[0].title;
                    q.current.durationSec = res[0].durationInSec;
                }
            } catch { }
        }

        try {
            const stream = await playdl.stream(q.current.url, { quality: 2 });
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type,
                inlineVolume: true
            });
            resource.volume?.setVolumeLogarithmic(q.volume / 100);

            q.player.play(resource);
            q.resource = resource;

            // Player event listener (once per song)
            q.player.once(AudioPlayerStatus.Idle, () => {
                const qq = this.getQueue(guildId);
                if (!qq) return;
                if (qq.loop === 'song' && qq.current) {
                    qq.songs.unshift(qq.current);
                } else if (qq.loop === 'queue' && qq.current) {
                    qq.songs.push(qq.current);
                }
                this._playNext(guildId);
            });
        } catch (e) {
            console.error(`[MusicManager] Oynatma hatası: ${e.message}`);
            q.textChannel?.send(`❌ \`${q.current?.title || '?'}\` oynatılamadı, atlanıyor...`).catch(() => { });
            this._playNext(guildId);
        }
    }

    skip(guildId) {
        const q = this.getQueue(guildId);
        if (!q) return false;
        q.player.stop();
        return true;
    }

    pause(guildId) {
        const q = this.getQueue(guildId);
        if (!q) return false;
        q.player.pause();
        return true;
    }

    resume(guildId) {
        const q = this.getQueue(guildId);
        if (!q) return false;
        q.player.unpause();
        return true;
    }

    stop(guildId) {
        this._destroy(guildId);
    }

    setVolume(guildId, vol) {
        const q = this.getQueue(guildId);
        if (!q) return false;
        q.volume = Math.max(0, Math.min(200, vol));
        q.resource?.volume?.setVolumeLogarithmic(q.volume / 100);
        return true;
    }

    setLoop(guildId, mode) {
        const q = this.getQueue(guildId);
        if (!q) return false;
        q.loop = mode; // 'off' | 'song' | 'queue'
        return true;
    }

    shuffle(guildId) {
        const q = this.getQueue(guildId);
        if (!q || q.songs.length < 2) return false;
        for (let i = q.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.songs[i], q.songs[j]] = [q.songs[j], q.songs[i]];
        }
        return true;
    }

    setDJ(guildId, roleId) {
        const q = this.getQueue(guildId);
        if (!q) return;
        q.djRoleId = roleId;
    }

    toggle247(guildId) {
        const q = this.getQueue(guildId);
        if (!q) return false;
        q.is247 = !q.is247;
        return q.is247;
    }

    formatDuration(sec) {
        if (!sec) return '?:??';
        const m = Math.floor(sec / 60);
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    }
}

const musicManager = new MusicManager();
module.exports = { musicManager };
