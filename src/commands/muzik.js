const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { musicManager } = require('../modules/MusicManager');

module.exports = {
    name: 'çal',
    aliases: ['cal', 'play', 'dur', 'pause', 'devam', 'resume', 'atla', 'skip',
        'sıra', 'sira', 'queue', 'ses', 'volume', 'loop', 'karıştır',
        'karistir', 'shuffle', 'durdur', 'stop', 'şarkı', 'sarki',
        'nowplaying', 'np', '247', 'dj', 'filtre', 'filter'],
    description: 'Tam özellikli müzik sistemi.',
    usage: '!çal <şarkı/URL>',

    async execute(message, args, client) {
        const cmdName = message.content.trim().split(/\s+/)[0].slice(1).toLowerCase();

        // DJ rol kontrolü
        const q = musicManager.getQueue(message.guild.id);
        if (q?.djRoleId && !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            if (!message.member.roles.cache.has(q.djRoleId)) {
                return message.reply(`❌ Bu komutu kullanmak için <@&${q.djRoleId}> rolü gerekli.`).catch(() => { });
            }
        }

        if (['çal', 'cal', 'play'].includes(cmdName)) return this.play(message, args);
        if (['dur', 'pause'].includes(cmdName)) return this.pause(message);
        if (['devam', 'resume'].includes(cmdName)) return this.resume(message);
        if (['atla', 'skip'].includes(cmdName)) return this.skip(message);
        if (['sıra', 'sira', 'queue'].includes(cmdName)) return this.queue(message);
        if (['ses', 'volume'].includes(cmdName)) return this.volume(message, args);
        if (cmdName === 'loop') return this.loop(message, args);
        if (['karıştır', 'karistir', 'shuffle'].includes(cmdName)) return this.shuffle(message);
        if (['durdur', 'stop'].includes(cmdName)) return this.stop(message);
        if (['şarkı', 'sarki', 'nowplaying', 'np'].includes(cmdName)) return this.nowPlaying(message);
        if (cmdName === '247') return this.toggle247(message);
        if (cmdName === 'dj') return this.dj(message, args);
        if (['filtre', 'filter'].includes(cmdName)) return this.filter(message, args);

        return this.play(message, args);
    },

    // ── Çal ────────────────────────────────────────────────────────────────────
    async play(message, args) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Bir ses kanalında olmalısınız!').catch(() => { });

        const query = args.join(' ');
        if (!query) return message.reply('❌ Kullanım: `!çal <şarkı adı veya URL>`').catch(() => { });

        const loadingMsg = await message.reply('🔍 Aranıyor...').catch(() => null);

        try {
            const result = await musicManager.play(message.guild, voiceChannel, message.channel, query);
            const song = result.song;
            const q = musicManager.getQueue(message.guild.id);

            const embed = new EmbedBuilder()
                .setColor(result.queued ? '#5865F2' : '#57F287')
                .setTitle(result.queued ? '📋 Kuyruğa Eklendi' : '🎵 Şimdi Çalıyor')
                .setDescription(`**[${song.title}](${song.url || '#'})**`)
                .addFields(
                    { name: 'Süre', value: musicManager.formatDuration(song.durationSec), inline: true },
                    { name: 'Sırada', value: `${q?.songs.length ?? 0} şarkı`, inline: true }
                )
                .setTimestamp();

            await loadingMsg?.edit({ content: '', embeds: [embed] }).catch(() => { });
        } catch (err) {
            await loadingMsg?.edit(`❌ ${err.message}`).catch(() => { });
        }
    },

    // ── Dur ─────────────────────────────────────────────────────────────────────
    async pause(message) {
        const ok = musicManager.pause(message.guild.id);
        return message.reply(ok ? '⏸️ Müzik duraklatıldı.' : '❌ Çalan müzik yok.').catch(() => { });
    },

    // ── Devam ────────────────────────────────────────────────────────────────────
    async resume(message) {
        const ok = musicManager.resume(message.guild.id);
        return message.reply(ok ? '▶️ Müzik devam ediyor.' : '❌ Duraklatılmış müzik yok.').catch(() => { });
    },

    // ── Atla ─────────────────────────────────────────────────────────────────────
    async skip(message) {
        const q = musicManager.getQueue(message.guild.id);
        if (!q?.current) return message.reply('❌ Çalan müzik yok.').catch(() => { });
        const skipped = q.current.title;
        musicManager.skip(message.guild.id);
        return message.reply(`⏭️ **${skipped}** atlandı.`).catch(() => { });
    },

    // ── Sıra ─────────────────────────────────────────────────────────────────────
    async queue(message) {
        const q = musicManager.getQueue(message.guild.id);
        if (!q) return message.reply('❌ Kuyruk boş.').catch(() => { });

        const lines = q.songs.slice(0, 10).map((s, i) =>
            `${i + 1}. **${s.title}** (${musicManager.formatDuration(s.durationSec)})`
        );
        if (q.songs.length > 10) lines.push(`…ve ${q.songs.length - 10} şarkı daha`);

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 Müzik Kuyruğu')
                .addFields(
                    { name: '🎵 Şimdi', value: q.current ? `**${q.current.title}**` : 'Yok' },
                    { name: `Sıradaki (${q.songs.length})`, value: lines.join('\n') || 'Kuyruk boş.' }
                )
                .setFooter({ text: `Loop: ${q.loop} • Ses: %${q.volume}` })
                .setTimestamp()]
        }).catch(() => { });
    },

    // ── Ses ──────────────────────────────────────────────────────────────────────
    async volume(message, args) {
        const vol = parseInt(args[0]);
        if (isNaN(vol) || vol < 0 || vol > 200) return message.reply('❌ Geçerli ses seviyesi: 0-200').catch(() => { });
        const ok = musicManager.setVolume(message.guild.id, vol);
        return message.reply(ok ? `🔊 Ses seviyesi: **%${vol}**` : '❌ Kuyruk boş.').catch(() => { });
    },

    // ── Loop ─────────────────────────────────────────────────────────────────────
    async loop(message, args) {
        const modes = { 'şarkı': 'song', 'sarki': 'song', 'song': 'song', 'liste': 'queue', 'queue': 'queue', 'off': 'off', 'kapat': 'off' };
        const mode = modes[args[0]?.toLowerCase()] ?? 'off';
        const ok = musicManager.setLoop(message.guild.id, mode);
        const labels = { off: '⏹️ Kapalı', song: '🔂 Şarkı', queue: '🔁 Liste' };
        return message.reply(ok ? `Loop modu: **${labels[mode]}**` : '❌ Kuyruk boş.').catch(() => { });
    },

    // ── Karıştır ─────────────────────────────────────────────────────────────────
    async shuffle(message) {
        const ok = musicManager.shuffle(message.guild.id);
        return message.reply(ok ? '🔀 Kuyruk karıştırıldı!' : '❌ Karıştırmak için en az 2 şarkı gerekli.').catch(() => { });
    },

    // ── Durdur ───────────────────────────────────────────────────────────────────
    async stop(message) {
        musicManager.stop(message.guild.id);
        return message.reply('⏹️ Müzik durduruldu, kuyruk temizlendi.').catch(() => { });
    },

    // ── Şimdi Çalıyor ────────────────────────────────────────────────────────────
    async nowPlaying(message) {
        const q = musicManager.getQueue(message.guild.id);
        if (!q?.current) return message.reply('❌ Şu an çalan bir şarkı yok.').catch(() => { });
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🎵 Şu An Çalıyor')
                .setDescription(`**[${q.current.title}](${q.current.url || '#'})**`)
                .addFields(
                    { name: 'Loop', value: q.loop, inline: true },
                    { name: 'Ses', value: `%${q.volume}`, inline: true },
                    { name: '24/7', value: q.is247 ? 'Açık' : 'Kapalı', inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    },

    // ── 24/7 ─────────────────────────────────────────────────────────────────────
    async toggle247(message) {
        const q = musicManager.getQueue(message.guild.id);
        if (!q) return message.reply('❌ Bot şu an ses kanalında değil.').catch(() => { });
        const state = musicManager.toggle247(message.guild.id);
        return message.reply(`🔁 24/7 mod: **${state ? 'Açık' : 'Kapalı'}**`).catch(() => { });
    },

    // ── DJ Rol ───────────────────────────────────────────────────────────────────
    async dj(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ Bu komutu kullanmak için Sunucu Yönet izni gerekli.').catch(() => { });
        }
        const role = message.mentions.roles.first();
        const q = musicManager.getQueue(message.guild.id);
        if (!q) return message.reply('❌ Bot şu an ses kanalında değil.').catch(() => { });

        if (args[0]?.toLowerCase() === 'kapat' || args[0]?.toLowerCase() === 'off') {
            musicManager.setDJ(message.guild.id, null);
            return message.reply('✅ DJ modu kapatıldı.').catch(() => { });
        }
        if (!role) return message.reply('❌ Bir rol etiketleyin: `!dj @DJ-Rolü`').catch(() => { });
        musicManager.setDJ(message.guild.id, role.id);
        return message.reply(`✅ DJ modu açık: <@&${role.id}>`).catch(() => { });
    },

    // ── Filtre ───────────────────────────────────────────────────────────────────
    async filter(message, args) {
        const validFilters = ['bass', 'nightcore', '8d', 'normal'];
        const f = args[0]?.toLowerCase();
        if (!validFilters.includes(f)) {
            return message.reply(`❌ Geçerli filtreler: \`${validFilters.join('`, `')}\``).catch(() => { });
        }
        // Filtre set edilir, şarkı yeniden başlatılır
        const q = musicManager.getQueue(message.guild.id);
        if (!q) return message.reply('❌ Kuyruk boş.').catch(() => { });
        q.filter = f;
        if (q.current) {
            q.songs.unshift(q.current);
            musicManager.skip(message.guild.id);
        }
        return message.reply(`🎛️ Filtre uygulandı: **${f}**\n_Şarkı yeniden başlatılıyor..._`).catch(() => { });
    }
};
