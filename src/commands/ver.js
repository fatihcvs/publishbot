const { EmbedBuilder } = require('discord.js');
const { storage } = require('../database/storage');

const DEFAULT_TAX = 5; // %5

module.exports = {
    name: 'ver',
    aliases: ['transfer', 'gönder', 'gonder', 'pay'],
    description: 'Başka bir kullanıcıya sunucu parası gönder.',
    usage: '!ver @kullanıcı <miktar>',

    async execute(message, args, client) {
        const target = message.mentions.users.first();
        const amount = parseInt(args[1] || args[0]);

        // Doğrulama
        if (!target || !amount || amount < 1) {
            return message.reply('❌ Kullanım: `!ver @kullanıcı <miktar>`').catch(() => { });
        }
        if (target.id === message.author.id) {
            return message.reply('❌ Kendinize para gönderemezsiniz!').catch(() => { });
        }
        if (target.bot) {
            return message.reply('❌ Botlara para gönderilemez!').catch(() => { });
        }

        const balance = await storage.getUserBalance(message.author.id, message.guild.id);
        if (balance < amount) {
            return message.reply(`❌ Yetersiz bakiye! Bakiye: **${balance}** coin.`).catch(() => { });
        }

        // Vergi hesapla
        const guildData = await storage.getGuild(message.guild.id);
        const taxRate = guildData?.modConfig?.transferTax ?? DEFAULT_TAX;
        const tax = Math.floor(amount * taxRate / 100);
        const received = amount - tax;

        // Transfer
        await storage.addToBalance(message.author.id, message.guild.id, -amount);
        await storage.addToBalance(target.id, message.guild.id, received);
        if (tax > 0) await storage.addToTreasury(message.guild.id, tax);

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('💸 Para Transferi')
                .addFields(
                    { name: '👤 Gönderen', value: message.author.toString(), inline: true },
                    { name: '👤 Alan', value: target.toString(), inline: true },
                    { name: '💰 Gönderilen', value: `${amount} coin`, inline: true },
                    { name: `🏛️ Vergi (${taxRate}%)`, value: `${tax} coin`, inline: true },
                    { name: '✅ Alınan', value: `${received} coin`, inline: true }
                )
                .setFooter({ text: 'Vergi sunucu hazinesine eklendi.' })
                .setTimestamp()]
        }).catch(() => { });
    }
};
