const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'twitch',
    aliases: ['twitch-bildirim', 'canlı', 'canli'],
    description: 'Twitch yayın bildirimleri — yayın başlayınca Discord kanalına bildir.',
    usage: '!twitch [ekle|sil|liste|mesaj]',
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
            case 'mesaj': case 'message':
                return this.setMsg(message, args.slice(1), db);
            default:
                return this.sendHelp(message);
        }
    },

    async add(message, args, db) {
        const twitchUser = args[0]?.toLowerCase();
        const channel = message.mentions.channels.first();

        if (!twitchUser || !channel) {
            return message.reply('❌ Kullanım: `!twitch ekle <twitch_kanal_adı> #discord-kanal`').catch(() => { });
        }

        try {
            const { twitchNotifications } = require('../../shared/schema');
            const { and, eq } = require('drizzle-orm');

            // Duplicate check
            const [existing] = await db.select().from(twitchNotifications)
                .where(and(eq(twitchNotifications.guildId, message.guild.id), eq(twitchNotifications.twitchUser, twitchUser)));
            if (existing) return message.reply(`❌ \`${twitchUser}\` zaten takip ediliyor.`).catch(() => { });

            await db.insert(twitchNotifications).values({
                guildId: message.guild.id,
                channelId: channel.id,
                twitchUser,
                enabled: true,
                isLive: false
            });

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#9147FF')
                    .setTitle('✅ Twitch Takibi Eklendi')
                    .addFields(
                        { name: '📺 Kanal', value: `[${twitchUser}](https://twitch.tv/${twitchUser})`, inline: true },
                        { name: '📢 Bildirim', value: channel.toString(), inline: true }
                    )
                    .setFooter({ text: 'Yayın başladığında bildirim gönderilecek.' })
                    .setTimestamp()]
            }).catch(() => { });
        } catch (err) {
            console.error('[twitch.add]', err);
            return message.reply('❌ Eklenemedi. DB migration çalıştırıldı mı?').catch(() => { });
        }
    },

    async del(message, args, db) {
        const twitchUser = args[0]?.toLowerCase();
        if (!twitchUser) return message.reply('❌ Kullanım: `!twitch sil <twitch_kanal_adı>`').catch(() => { });
        try {
            const { twitchNotifications } = require('../../shared/schema');
            const { and, eq } = require('drizzle-orm');
            await db.delete(twitchNotifications).where(
                and(eq(twitchNotifications.guildId, message.guild.id), eq(twitchNotifications.twitchUser, twitchUser))
            );
            return message.reply(`✅ \`${twitchUser}\` takip listesinden kaldırıldı.`).catch(() => { });
        } catch { return message.reply('❌ Silinemedi.').catch(() => { }); }
    },

    async list(message, db) {
        try {
            const { twitchNotifications } = require('../../shared/schema');
            const { eq } = require('drizzle-orm');
            const rows = await db.select().from(twitchNotifications).where(eq(twitchNotifications.guildId, message.guild.id));
            if (!rows.length) return message.reply('Takip edilen Twitch kanalı yok.').catch(() => { });
            const lines = rows.map(r =>
                `${r.enabled ? '🟢' : '🔴'} [${r.twitchUser}](https://twitch.tv/${r.twitchUser}) → <#${r.channelId}> ${r.isLive ? '🔴 CANLI' : ''}`
            );
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#9147FF')
                    .setTitle('📺 Twitch Takip Listesi')
                    .setDescription(lines.join('\n'))
                    .setTimestamp()]
            }).catch(() => { });
        } catch { return message.reply('❌ Liste yüklenemedi.').catch(() => { }); }
    },

    async setMsg(message, args, db) {
        const twitchUser = args[0]?.toLowerCase();
        const text = args.slice(1).join(' ');
        if (!twitchUser || !text) return message.reply('❌ Kullanım: `!twitch mesaj <kanal> <metin>` (değişkenler: {user} {game} {url})').catch(() => { });
        try {
            const { twitchNotifications } = require('../../shared/schema');
            const { and, eq } = require('drizzle-orm');
            await db.update(twitchNotifications).set({ customMessage: text })
                .where(and(eq(twitchNotifications.guildId, message.guild.id), eq(twitchNotifications.twitchUser, twitchUser)));
            return message.reply(`✅ Özel mesaj güncellendi.`).catch(() => { });
        } catch { return message.reply('❌ Güncellenemedi.').catch(() => { }); }
    },

    sendHelp(message) {
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#9147FF')
                .setTitle('📺 Twitch Bildirimleri')
                .addFields(
                    { name: 'Ekle', value: '`!twitch ekle <kanal> #discord-kanal`' },
                    { name: 'Sil', value: '`!twitch sil <kanal>`' },
                    { name: 'Listele', value: '`!twitch liste`' },
                    { name: 'Mesaj', value: '`!twitch mesaj <kanal> <metin>` (değişkenler: {user} {game} {url} {viewers})' }
                )]
        }).catch(() => { });
    }
};
