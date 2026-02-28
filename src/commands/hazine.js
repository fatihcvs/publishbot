const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
    name: 'hazine',
    aliases: ['treasury', 'hazinelik', 'para-havuzu'],
    description: 'Sunucu hazinesini görüntüle ve yönet.',
    usage: '!hazine [ver @user <miktar>]',

    async execute(message, args, client) {
        const sub = args[0]?.toLowerCase();

        if ((sub === 'ver' || sub === 'give') && message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return this.give(message, args.slice(1));
        }
        return this.show(message);
    },

    async show(message) {
        const treasury = await storage.getTreasury(message.guild.id);
        const guildData = await storage.getGuild(message.guild.id);
        const taxRate = guildData?.modConfig?.transferTax ?? 5;

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#f59e0b')
                .setTitle('🏛️ Sunucu Hazinesi')
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '💰 Hazine', value: `**${treasury.toLocaleString()}** coin`, inline: true },
                    { name: '🏦 Vergi Oranı', value: `%${taxRate}`, inline: true },
                    { name: '📊 Kaynaklar', value: `Transfer vergisi + Kumar kaybı`, inline: false }
                )
                .setFooter({ text: 'Moderatörler için: !hazine ver @user <miktar>' })
                .setTimestamp()]
        }).catch(() => { });
    },

    async give(message, args) {
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!target || !amount || amount < 1) {
            return message.reply('❌ Kullanım: `!hazine ver @kullanıcı <miktar>`').catch(() => { });
        }

        const treasury = await storage.getTreasury(message.guild.id);
        if (treasury < amount) {
            return message.reply(`❌ Hazinede yeterli coin yok! Hazine: **${treasury}** coin.`).catch(() => { });
        }

        await storage.takeFromTreasury(message.guild.id, amount);
        await storage.addToBalance(target.id, message.guild.id, amount);

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🏛️ Hazineden Ödeme')
                .addFields(
                    { name: 'Alıcı', value: target.toString(), inline: true },
                    { name: 'Miktar', value: `${amount} coin`, inline: true },
                    { name: 'Kalan', value: `${treasury - amount} coin`, inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    }
};
