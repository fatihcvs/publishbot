const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/db');
const { userEconomy } = require('../../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
    name: 'para',
    aliases: ['cüzdan', 'bakiye', 'bal', 'balance', 'cash', 'money'],
    description: 'Mevcut paranızı (cüzdan ve banka) görüntüler.',
    usage: '!para [@kullanıcı]',

    async execute(message, args, client) {
        const target = message.mentions.users.first() || message.author;

        // Check economy config or fallback to defaults
        const [config] = await db.select().from(require('../../../shared/schema').economyConfig).where(eq(require('../../../shared/schema').economyConfig.guildId, message.guild.id));

        if (config && !config.enabled) {
            return message.reply('❌ Bu sunucuda ekonomi sistemi kapalı.');
        }

        const currencySymbol = config?.currencySymbol || '💰';

        // Get user wallet & bank
        let userRow = await db.select().from(userEconomy)
            .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, target.id)))
            .limit(1);

        if (userRow.length === 0) {
            // Init row
            const [inserted] = await db.insert(userEconomy).values({
                guildId: message.guild.id,
                userId: target.id,
                balance: 0,
                bank: 0
            }).returning();
            userRow = [inserted];
        }

        const data = userRow[0];

        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setAuthor({ name: `${target.username} Adlı Kullanıcının Cüzdanı`, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .addFields(
                { name: 'Cüzdan', value: `${currencySymbol} **${data.balance?.toLocaleString() || 0}**`, inline: true },
                { name: 'Banka', value: `${currencySymbol} **${data.bank?.toLocaleString() || 0}**`, inline: true },
                { name: 'Toplam', value: `${currencySymbol} **${((data.balance || 0) + (data.bank || 0)).toLocaleString()}**`, inline: true }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
