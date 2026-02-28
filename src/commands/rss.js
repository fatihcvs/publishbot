const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'rss',
    aliases: ['rss-feed', 'feed'],
    description: 'RSS/Atom feed\'lerini Discord kanallarına bağla.',
    usage: '!rss [ekle|sil|liste|test]',
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(message, args, client) {
        const { db } = require('../database/db');
        const sub = args[0]?.toLowerCase();

        switch (sub) {
            case 'ekle': case 'add':
                return this.add(message, args.slice(1), db);
            case 'sil': case 'delete': case 'remove':
                return this.del(message, args.slice(1), db);
            case 'liste': case 'list':
                return this.list(message, db);
            case 'test':
                return this.test(message, args.slice(1), db, client);
            default:
                return this.sendHelp(message);
        }
    },

    async add(message, args, db) {
        const url = args[0];
        const channel = message.mentions.channels.first();

        // --sıklık <dakika>
        const freqIdx = args.indexOf('--sıklık');
        const interval = freqIdx >= 0 ? Math.min(60, Math.max(5, parseInt(args[freqIdx + 1]) || 15)) : 15;

        if (!url || !url.startsWith('http') || !channel) {
            return message.reply('❌ Kullanım: `!rss ekle <feed_url> #kanal [--sıklık 15]`').catch(() => { });
        }

        try {
            // Feed'i doğrula (bir kez çek)
            const { fetchFeedTitle } = require('../utils/rssUtils');
            const title = await fetchFeedTitle(url);

            const { rssFeeds } = require('../../shared/schema');
            await db.insert(rssFeeds).values({
                guildId: message.guild.id,
                channelId: channel.id,
                url,
                lastEntryId: null,
                intervalMinutes: interval,
                enabled: true
            });

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#FF6600')
                    .setTitle('✅ RSS Feed Eklendi')
                    .addFields(
                        { name: 'Feed', value: title || url, inline: false },
                        { name: 'Kanal', value: channel.toString(), inline: true },
                        { name: 'Sıklık', value: `${interval} dakika`, inline: true }
                    )
                    .setTimestamp()]
            }).catch(() => { });
        } catch (err) {
            console.error('[rss.add]', err);
            return message.reply(`❌ RSS eklenemedi: ${err.message}`).catch(() => { });
        }
    },

    async del(message, args, db) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ Kullanım: `!rss sil <id>`').catch(() => { });
        try {
            const { rssFeeds } = require('../../shared/schema');
            const { and, eq } = require('drizzle-orm');
            await db.delete(rssFeeds).where(and(eq(rssFeeds.id, id), eq(rssFeeds.guildId, message.guild.id)));
            return message.reply(`✅ RSS feed #${id} kaldırıldı.`).catch(() => { });
        } catch { return message.reply('❌ Silinemedi.').catch(() => { }); }
    },

    async list(message, db) {
        try {
            const { rssFeeds } = require('../../shared/schema');
            const { eq } = require('drizzle-orm');
            const rows = await db.select().from(rssFeeds).where(eq(rssFeeds.guildId, message.guild.id));
            if (!rows.length) return message.reply('Bu sunucuda RSS feed yok.').catch(() => { });
            const lines = rows.map(r =>
                `${r.enabled ? '🟢' : '🔴'} **#${r.id}** <#${r.channelId}> — ${r.intervalMinutes}dk\n${r.url.slice(0, 60)}…`
            );
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#FF6600')
                    .setTitle(`📡 RSS Feed Listesi (${rows.length})`)
                    .setDescription(lines.join('\n\n'))
                    .setTimestamp()]
            }).catch(() => { });
        } catch { return message.reply('❌ Liste yüklenemedi.').catch(() => { }); }
    },

    async test(message, args, db, client) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ Kullanım: `!rss test <id>`').catch(() => { });
        try {
            const { rssFeeds } = require('../../shared/schema');
            const { and, eq } = require('drizzle-orm');
            const [feed] = await db.select().from(rssFeeds).where(and(eq(rssFeeds.id, id), eq(rssFeeds.guildId, message.guild.id)));
            if (!feed) return message.reply('❌ Feed bulunamadı.').catch(() => { });

            const { fetchLatestEntry } = require('../utils/rssUtils');
            const entry = await fetchLatestEntry(feed.url);
            if (!entry) return message.reply('❌ Feed boş veya geçersiz.').catch(() => { });

            const channel = message.guild.channels.cache.get(feed.channelId);
            if (!channel) return message.reply('❌ Hedef kanal bulunamadı.').catch(() => { });

            await channel.send({
                embeds: [new EmbedBuilder()
                    .setColor('#FF6600')
                    .setTitle(`📰 ${entry.title}`)
                    .setURL(entry.link)
                    .setDescription(entry.summary?.slice(0, 300) || '')
                    .setTimestamp()]
            }).catch(() => { });
            return message.reply('✅ Test mesajı gönderildi.').catch(() => { });
        } catch (err) {
            return message.reply(`❌ Test hatası: ${err.message}`).catch(() => { });
        }
    },

    sendHelp(message) {
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FF6600')
                .setTitle('📡 RSS Feed Sistemi')
                .addFields(
                    { name: 'Ekle', value: '`!rss ekle <url> #kanal [--sıklık 15]`' },
                    { name: 'Sil', value: '`!rss sil <id>`' },
                    { name: 'Listele', value: '`!rss liste`' },
                    { name: 'Test', value: '`!rss test <id>`' }
                )]
        }).catch(() => { });
    }
};
