const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { userEconomy, economyConfig } = require('../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
    name: 'paraekle',
    aliases: ['addmoney', 'givemoney'],
    description: 'Belirtilen kullanıcıya sunucu parası ekler.',
    permissions: [PermissionFlagsBits.ManageGuild], // Admin only
    usage: '!paraekle [@kullanıcı] [miktar]',

    async execute(message, args, client) {
        const target = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
        if (!target) return message.reply('❌ Lütfen para eklenecek kullanıcıyı etiketleyin.');

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
            const [inserted] = await db.insert(userEconomy).values({
                guildId: message.guild.id,
                userId: target.id,
                balance: amount,
                bank: 0
            }).returning();
            userRow = inserted;
        } else {
            await db.update(userEconomy)
                .set({ balance: (userRow.balance || 0) + amount })
                .where(eq(userEconomy.id, userRow.id));
        }

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('💰 Bakiye Eklendi')
            .setDescription(`<@${target.id}> adlı kullanıcıya **${amount.toLocaleString()} ${currencySymbol}** eklendi!`)
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
