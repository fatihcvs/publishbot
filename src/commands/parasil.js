const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { userEconomy, economyConfig } = require('../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
    name: 'parasil',
    aliases: ['removemoney', 'takemoney'],
    description: 'Belirtilen kullanıcının sunucu parasını siler.',
    permissions: [PermissionFlagsBits.ManageGuild], // Admin only
    usage: '!parasil [@kullanıcı] [miktar]',

    async execute(message, args, client) {
        const target = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
        if (!target) return message.reply('❌ Lütfen parası silinecek kullanıcıyı etiketleyin.');

        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            return message.reply('❌ Lütfen sıfırdan büyük, geçerli bir miktar girin.');
        }

        const [configRow] = await db.select().from(economyConfig).where(eq(economyConfig.guildId, message.guild.id));
        const currencySymbol = configRow?.currencySymbol || '💰';

        let [userRow] = await db.select().from(userEconomy)
            .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, target.id)))
            .limit(1);

        if (!userRow) {
            return message.reply(`❌ <@${target.id}> adlı kullanıcının zaten hiç parası yok.`);
        }

        let newBalance = (userRow.balance || 0) - amount;
        if (newBalance < 0) newBalance = 0; // Prevent negative balance

        await db.update(userEconomy)
            .set({ balance: newBalance })
            .where(eq(userEconomy.id, userRow.id));

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('💸 Bakiye Silindi')
            .setDescription(`<@${target.id}> adlı kullanıcıdan **${amount.toLocaleString()} ${currencySymbol}** silindi!\n\nYeni Bakiye: **${newBalance.toLocaleString()} ${currencySymbol}**`)
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
