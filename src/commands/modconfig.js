const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { guilds } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

const DEFAULT_CONFIG = {
    mutePts: 3,
    kickPts: 5,
    banPts: 7,
    expireDays: 30
};

module.exports = {
    name: 'modconfig',
    aliases: ['modayar', 'modcfg'],
    description: 'Moderasyon eşiklerini ve uyarı sona erme süresini ayarlar.',
    usage: '!modconfig [eşik mute/kick/ban <puan>] [süre <gün>] [göster]',
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(message, args, client, storage) {
        if (!args[0]) return this.showConfig(message, storage);

        const sub = args[0].toLowerCase();

        switch (sub) {
            case 'eşik':
            case 'esik':
            case 'threshold':
                return this.setThreshold(message, args.slice(1), storage);
            case 'süre':
            case 'sure':
            case 'expire':
                return this.setExpiry(message, args.slice(1), storage);
            case 'göster':
            case 'goster':
            case 'show':
                return this.showConfig(message, storage);
            case 'sıfırla':
            case 'sifirla':
            case 'reset':
                return this.resetConfig(message, storage);
            default:
                return this.showHelp(message);
        }
    },

    async setThreshold(message, args, storage) {
        const type = args[0]?.toLowerCase();
        const pts = parseInt(args[1]);

        const typeMap = {
            mute: 'mutePts', susturma: 'mutePts',
            kick: 'kickPts', at: 'kickPts',
            ban: 'banPts', yasakla: 'banPts'
        };
        const key = typeMap[type];

        if (!key) return message.reply('❌ Geçersiz eşik türü. Kullanım: `!modconfig eşik mute/kick/ban <puan>`');
        if (!pts || pts < 1 || pts > 50) return message.reply('❌ Puan 1 ile 50 arasında olmalı.');

        const guildData = await storage.getGuild(message.guild.id);
        const cfg = { ...DEFAULT_CONFIG, ...(guildData?.modConfig || {}) };
        cfg[key] = pts;

        // mute ≤ kick ≤ ban kontrolü
        if (cfg.mutePts >= cfg.kickPts) return message.reply('❌ Mute eşiği kick eşiğinden küçük olmalı.');
        if (cfg.kickPts >= cfg.banPts) return message.reply('❌ Kick eşiği ban eşiğinden küçük olmalı.');

        await db.update(guilds).set({ modConfig: cfg }).where(eq(guilds.id, message.guild.id));
        return message.reply(`✅ **${type.toUpperCase()}** eşiği **${pts} puan** olarak ayarlandı.`);
    },

    async setExpiry(message, args, storage) {
        const days = parseInt(args[0]);
        if (isNaN(days) || days < 0 || days > 365)
            return message.reply('❌ Gün değeri 0 (sonsuz) ile 365 arasında olmalı.');

        const guildData = await storage.getGuild(message.guild.id);
        const cfg = { ...DEFAULT_CONFIG, ...(guildData?.modConfig || {}) };
        cfg.expireDays = days;

        await db.update(guilds).set({ modConfig: cfg }).where(eq(guilds.id, message.guild.id));
        const msg = days === 0 ? '✅ Uyarılar artık **sonsuz** süreyle aktif kalacak.' : `✅ Uyarılar **${days} gün** sonra otomatik sona erecek.`;
        return message.reply(msg);
    },

    async showConfig(message, storage) {
        const guildData = await storage.getGuild(message.guild.id);
        const cfg = { ...DEFAULT_CONFIG, ...(guildData?.modConfig || {}) };

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('⚙️ Moderasyon Konfigürasyonu')
            .addFields(
                { name: '🔇 Mute Eşiği', value: `${cfg.mutePts} puan`, inline: true },
                { name: '🦵 Kick Eşiği', value: `${cfg.kickPts} puan`, inline: true },
                { name: '🔨 Ban Eşiği', value: `${cfg.banPts} puan`, inline: true },
                { name: '⏳ Uyarı Sona Erme', value: cfg.expireDays === 0 ? 'Sonsuz' : `${cfg.expireDays} gün`, inline: true }
            )
            .setFooter({ text: 'Değiştirmek için: !modconfig eşik mute/kick/ban <puan> | !modconfig süre <gün>' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async resetConfig(message, storage) {
        await db.update(guilds).set({ modConfig: DEFAULT_CONFIG }).where(eq(guilds.id, message.guild.id));
        return message.reply('✅ Moderasyon konfigürasyonu **varsayılana** sıfırlandı (Mute:3 / Kick:5 / Ban:7 / Süre:30 gün).');
    },

    showHelp(message) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚙️ Modconfig Kullanımı')
            .addFields(
                { name: 'Eşik Ayarlama', value: '`!modconfig eşik mute <puan>`\n`!modconfig eşik kick <puan>`\n`!modconfig eşik ban <puan>`' },
                { name: 'Sona Erme Süresi', value: '`!modconfig süre <gün>` (0 = sonsuz)' },
                { name: 'Konfigürasyonu Gör', value: '`!modconfig göster`' },
                { name: 'Sıfırla', value: '`!modconfig sıfırla`' }
            );
        return message.reply({ embeds: [embed] });
    }
};
