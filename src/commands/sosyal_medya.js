const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { socialNotifications } = require('../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
    name: 'sosyal',
    aliases: ['social', 'youtube', 'reddit'],
    description: 'Youtube kanalı veya Subreddit takibi ayarlar.',
    permissions: [PermissionFlagsBits.ManageGuild],
    usage: '!sosyal [reddit/youtube] [ekle/sil/liste] [kullanıcı/sayfa] [#kanal]',

    async execute(message, args, client) {
        if (!args[0] || !args[1]) {
            return this.sendHelp(message);
        }

        const platform = args[0].toLowerCase(); // youtube / reddit
        const action = args[1].toLowerCase();   // ekle / sil / liste

        if (!['youtube', 'reddit'].includes(platform)) {
            return message.reply('❌ Sadece `youtube` veya `reddit` platformları desteklenmektedir.');
        }

        if (action === 'liste' || action === 'list') {
            const rows = await db.select().from(socialNotifications)
                .where(and(eq(socialNotifications.guildId, message.guild.id), eq(socialNotifications.platform, platform)));

            if (rows.length === 0) {
                return message.reply(`Bu sunucuda aktif bir **${platform.toUpperCase()}** bildirimi bulunmuyor.`);
            }

            const embed = new EmbedBuilder()
                .setColor(platform === 'youtube' ? '#FF0000' : '#FF4500')
                .setTitle(`📡 ${platform.toUpperCase()} Bildirimleri`)
                .setDescription(rows.map(r => `• **${r.username}** -> <#${r.channelId}>`).join('\n'));

            return message.reply({ embeds: [embed] });
        }

        const targetName = args[2];
        const channel = message.mentions.channels.first();

        if (action === 'ekle' || action === 'add') {
            if (!targetName || !channel) {
                return message.reply(`❌ Kullanım: \`!sosyal ${platform} ekle [KanalID/Subreddit] [#kanal]\``);
            }

            // Check if already exists
            const existing = await db.select().from(socialNotifications)
                .where(and(
                    eq(socialNotifications.guildId, message.guild.id),
                    eq(socialNotifications.platform, platform),
                    eq(socialNotifications.username, targetName)
                )).limit(1);

            if (existing.length > 0) {
                return message.reply(`❌ **${targetName}** için bu sunucuda zaten bir takip bulunuyor.`);
            }

            await db.insert(socialNotifications).values({
                guildId: message.guild.id,
                platform: platform,
                username: targetName,
                channelId: channel.id,
                customMessage: `Hey millet! **{author}** yeni bir içerik paylaştı!\n{url}`
            });

            return message.reply(`✅ **${targetName}** isimli ${platform} hesabı/sayfası başarıyla <#${channel.id}> kanalına bağlandı! Yeni paylaşımlar otomatik olarak atılacaktır.`);
        }
        else if (action === 'sil' || action === 'remove') {
            if (!targetName) return message.reply(`❌ Lütfen silmek istediğiniz takip adını girin.`);

            const existing = await db.select().from(socialNotifications)
                .where(and(
                    eq(socialNotifications.guildId, message.guild.id),
                    eq(socialNotifications.platform, platform),
                    eq(socialNotifications.username, targetName)
                )).limit(1);

            if (existing.length === 0) {
                return message.reply(`❌ **${targetName}** adında bir takip bulunamadı.`);
            }

            await db.delete(socialNotifications).where(eq(socialNotifications.id, existing[0].id));
            return message.reply(`✅ **${targetName}** isimli ${platform} takibi kaldırıldı.`);
        }
        else {
            return this.sendHelp(message);
        }
    },

    sendHelp(message) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('📡 Sosyal Medya Bildirimleri')
            .addFields(
                { name: 'Reddit Takibi', value: '`!sosyal reddit ekle <Subreddit> <#kanal>`\n`!sosyal reddit sil <Subreddit>`\n`!sosyal reddit liste`' },
                { name: 'YouTube Takibi', value: '`!sosyal youtube ekle <Kanal_ID> <#kanal>`\n`!sosyal youtube sil <Kanal_ID>`\n`!sosyal youtube liste`' }
            );
        return message.reply({ embeds: [embed] });
    }
};
