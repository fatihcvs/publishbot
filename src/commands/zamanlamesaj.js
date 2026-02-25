const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { scheduledMessages } = require('../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
    name: 'zamanlamesaj',
    aliases: ['sürelimesaj', 'zamanlımesaj', 'otomesaj'],
    description: 'Belirli aralıklarla (ör. 60 dakikada bir) kanala otomatik gönderilecek mesajlar ayarlar.',
    permissions: [PermissionFlagsBits.ManageGuild],
    usage: '!zamanlamesaj [ekle/sil/liste] [kanal] [dakika] [mesaj]',

    async execute(message, args, client, storage) {
        if (!args[0]) return this.sendHelp(message);

        const subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case 'ekle':
            case 'add':
            case 'kur':
                return this.addScheduledMessage(message, args.slice(1));
            case 'sil':
            case 'kaldır':
            case 'remove':
                return this.removeScheduledMessage(message, args.slice(1));
            case 'liste':
            case 'list':
                return this.listScheduledMessages(message);
            default:
                return this.sendHelp(message);
        }
    },

    async addScheduledMessage(message, args) {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!channel) return message.reply('❌ Kullanım: `!zamanlamesaj ekle #kanal <dakika> <mesaj...>`\nLütfen geçerli bir kanal etiketleyin.');

        const intervalMinutes = parseInt(args[1]);
        if (isNaN(intervalMinutes) || intervalMinutes < 5 || intervalMinutes > 10080) { // Max 1 hafta
            return message.reply('❌ Lütfen geçerli bir dakika aralığı girin (En az 5, en fazla 10080).');
        }

        const content = args.slice(2).join(' ');
        if (!content || content.length < 2) {
            return message.reply('❌ Lütfen gönderilecek bir mesaj yazın.');
        }

        const nextRun = new Date(Date.now() + intervalMinutes * 60000);

        await db.insert(scheduledMessages).values({
            guildId: message.guild.id,
            channelId: channel.id,
            message: content,
            intervalMinutes: intervalMinutes,
            nextRun: nextRun,
            createdBy: message.author.id
        });

        return message.reply(`✅ Ayarlandı! Bu mesaja 1 ID'si atanacak ve her **${intervalMinutes} dakikada bir** ${channel} kanalına gönderilecek.\nİlk mesaj saati: <t:${Math.floor(nextRun.getTime() / 1000)}:f>`);
    },

    async removeScheduledMessage(message, args) {
        if (!args[0]) return message.reply('❌ Kullanım: `!zamanlamesaj sil <id>`\nID\'leri görebilmek için: `!zamanlamesaj liste`');

        const idToRemove = parseInt(args[0]);
        if (isNaN(idToRemove)) return message.reply('❌ Geçerli bir sayısal ID giriniz.');

        // Check if it exists for this guild
        const allMsgs = await db.select().from(scheduledMessages).where(eq(scheduledMessages.guildId, message.guild.id));
        const target = allMsgs.find(m => m.id === idToRemove);

        if (!target) {
            return message.reply(`❌ Bu sunucuda **${idToRemove}** ID numarasına sahip bir zamanlanmış mesaj bulunamadı.`);
        }

        await db.delete(scheduledMessages).where(eq(scheduledMessages.id, target.id));
        return message.reply(`✅ Zamanlanmış mesaj (ID: ${idToRemove}) başarıyla silindi ve sistemi durduruldu.`);
    },

    async listScheduledMessages(message) {
        const msgs = await db.select().from(scheduledMessages).where(eq(scheduledMessages.guildId, message.guild.id));

        if (msgs.length === 0) {
            return message.reply('Bu sunucuda ayarlanmış hiçbir zamanlanmış mesaj bulunmuyor.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('⏰ Zamanlanmış Mesajlar')
            .setDescription('Bu sunucuda aktif olan periyodik mesajlar aşağıda listelenmiştir:')
            .setFooter({ text: 'Kaldırmak için: !zamanlamesaj sil <id>' });

        for (const msg of msgs) {
            let contentPreview = msg.message;
            if (contentPreview.length > 50) contentPreview = contentPreview.substring(0, 50) + '...';

            embed.addFields({
                name: `ID: ${msg.id} | ${msg.intervalMinutes} Dakikada Bir`,
                value: `**Kanal:** <#${msg.channelId}>\n**Gelecek Mesaj:** <t:${Math.floor(msg.nextRun.getTime() / 1000)}:R>\n**İçerik:** *${contentPreview}*`
            });
        }

        return message.reply({ embeds: [embed] });
    },

    sendHelp(message) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⏰ Zamanlanmış Otomatik Mesajlar')
            .setDescription('Belirli bir kanala, belirttiğiniz dakika aralığıyla durmadan mesaj gönderilmesini sağlar.')
            .addFields(
                { name: 'Ekle / Kur', value: '`!zamanlamesaj ekle <#kanal> <dakika> <mesaj>`\n*Örnek: `!zamanlamesaj ekle #genel 60 Merhaba!`*' },
                { name: 'Sil / Kaldır', value: '`!zamanlamesaj sil <id>`\nSilmek istediğiniz mesajın ID numarasını listeleyerek bulun.' },
                { name: 'Aktif Mesajları Listele', value: '`!zamanlamesaj liste`' }
            )
            .setFooter({ text: 'Minimum bekleme süresi: 5 dakikadır' });

        return message.reply({ embeds: [embed] });
    }
};
