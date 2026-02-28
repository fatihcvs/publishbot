const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    name: 'webhook',
    aliases: ['wh', 'webhooks'],
    description: 'Gelen webhook\'ları Discord kanallarına yönlendirir (GitHub, özel).',
    usage: '!webhook [ekle|liste|sil|şablon]',
    permissions: [PermissionFlagsBits.ManageWebhooks],

    async execute(message, args, client) {
        const { db } = require('../database/db');
        const sub = args[0]?.toLowerCase();

        switch (sub) {
            case 'ekle': case 'add':
                return this.add(message, args.slice(1), db);
            case 'liste': case 'list':
                return this.list(message, db);
            case 'sil': case 'delete': case 'remove':
                return this.del(message, args.slice(1), db);
            case 'şablon': case 'sablon': case 'template':
                return this.setTemplate(message, args.slice(1), db);
            default:
                return this.sendHelp(message);
        }
    },

    async add(message, args, db) {
        const name = args[0];
        const channel = message.mentions.channels.first();

        if (!name || !channel) {
            return message.reply('❌ Kullanım: `!webhook ekle <ad> #kanal`\nÖrnek: `!webhook ekle github #dev-log`').catch(() => { });
        }

        const key = crypto.randomBytes(12).toString('hex');
        const url = `https://bot.thepublishers.info/webhooks/${message.guild.id}/${key}`;

        try {
            const { webhookReceivers } = require('../../shared/schema');
            await db.insert(webhookReceivers).values({
                guildId: message.guild.id,
                name,
                channelId: channel.id,
                key,
                template: null,
                enabled: true
            });

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('✅ Webhook Alıcısı Oluşturuldu')
                    .addFields(
                        { name: 'Ad', value: name, inline: true },
                        { name: 'Kanal', value: channel.toString(), inline: true },
                        { name: '🔗 Webhook URL (gizli tut!)', value: `\`\`\`${url}\`\`\`` }
                    )
                    .setFooter({ text: 'Bu URL\'ye POST isteği gönderildiğinde kanala mesaj gönderilir.' })
                    .setTimestamp()]
            }).catch(() => { });
        } catch (err) {
            console.error('[webhook.add]', err);
            return message.reply('❌ Webhook oluşturulamadı. DB migration çalıştırıldı mı?').catch(() => { });
        }
    },

    async list(message, db) {
        try {
            const { webhookReceivers } = require('../../shared/schema');
            const { eq } = require('drizzle-orm');
            const rows = await db.select().from(webhookReceivers).where(eq(webhookReceivers.guildId, message.guild.id));

            if (!rows.length) return message.reply('Bu sunucuda kayıtlı webhook alıcısı yok.').catch(() => { });

            const lines = rows.map(r =>
                `${r.enabled ? '🟢' : '🔴'} **${r.name}** → <#${r.channelId}> \`/webhooks/${r.guildId}/${r.key.slice(0, 8)}…\``
            );

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`🔗 Webhook Alıcıları (${rows.length})`)
                    .setDescription(lines.join('\n'))
                    .setTimestamp()]
            }).catch(() => { });
        } catch {
            return message.reply('❌ Liste yüklenemedi.').catch(() => { });
        }
    },

    async del(message, args, db) {
        const name = args[0];
        if (!name) return message.reply('❌ Kullanım: `!webhook sil <ad>`').catch(() => { });
        try {
            const { webhookReceivers } = require('../../shared/schema');
            const { eq, and } = require('drizzle-orm');
            await db.delete(webhookReceivers).where(and(eq(webhookReceivers.name, name), eq(webhookReceivers.guildId, message.guild.id)));
            return message.reply(`✅ \`${name}\` webhook alıcısı silindi.`).catch(() => { });
        } catch {
            return message.reply('❌ Silinemedi.').catch(() => { });
        }
    },

    async setTemplate(message, args, db) {
        const name = args[0];
        const template = args.slice(1).join(' ');
        if (!name || !template) {
            return message.reply([
                '❌ Kullanım: `!webhook şablon <ad> <metin>`',
                'Değişkenler: `{title}` `{body}` `{url}` `{author}` `{repo}`',
                'Örnek: `!webhook şablon github 🔔 {repo}: {title} → {url}`'
            ].join('\n')).catch(() => { });
        }
        try {
            const { webhookReceivers } = require('../../shared/schema');
            const { eq, and } = require('drizzle-orm');
            await db.update(webhookReceivers).set({ template }).where(and(eq(webhookReceivers.name, name), eq(webhookReceivers.guildId, message.guild.id)));
            return message.reply(`✅ \`${name}\` için şablon güncellendi.`).catch(() => { });
        } catch {
            return message.reply('❌ Güncelleme başarısız.').catch(() => { });
        }
    },

    sendHelp(message) {
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔗 Webhook Yönetimi')
                .addFields(
                    { name: 'Ekle', value: '`!webhook ekle <ad> #kanal`' },
                    { name: 'Listele', value: '`!webhook liste`' },
                    { name: 'Sil', value: '`!webhook sil <ad>`' },
                    { name: 'Şablon', value: '`!webhook şablon <ad> <metin>` (değişkenler: {title} {body} {url} {author} {repo})' }
                )
                .setFooter({ text: 'Webhook URL\'nizi !webhook liste ile görüntüleyin.' })]
        }).catch(() => { });
    }
};
