const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const { userEconomy, economyConfig } = require('../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
  name: 'günlük',
  aliases: ['gunluk', 'daily'],
  description: 'Her 24 saatte bir günlük hediye paranızı alırsınız.',

  async execute(message, args, client) {
    // Check config
    const [configRow] = await db.select().from(economyConfig).where(eq(economyConfig.guildId, message.guild.id));
    if (configRow && !configRow.enabled) {
      return message.reply('❌ Bu sunucuda ekonomi sistemi kapalı.');
    }

    const currencySymbol = configRow?.currencySymbol || '💰';
    const rewardAmount = configRow?.dailyAmount || 100;

    let [userRow] = await db.select().from(userEconomy)
      .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, message.author.id)))
      .limit(1);

    const now = new Date();

    if (!userRow) {
      // Init row
      const [inserted] = await db.insert(userEconomy).values({
        guildId: message.guild.id,
        userId: message.author.id,
        balance: 0,
        bank: 0,
        lastDaily: null,
        lastWork: null
      }).returning();
      userRow = inserted;
    }

    if (userRow.lastDaily) {
      const lastClaim = new Date(userRow.lastDaily);
      const diffMs = now.getTime() - lastClaim.getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (diffMs < twentyFourHours) {
        const remainingMs = twentyFourHours - diffMs;
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        return message.reply(`⏰ Günlük ödülünüzü zaten aldınız! Tekrar alabilmek için **${hours} saat ${minutes} dakika** beklemelisiniz.`);
      }
    }

    const newBalance = (userRow.balance || 0) + rewardAmount;

    await db.update(userEconomy)
      .set({ balance: newBalance, lastDaily: now })
      .where(eq(userEconomy.id, userRow.id));

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('🎁 Günlük Ödül')
      .setDescription(`Tebrikler <@${message.author.id}>, günlük **${rewardAmount} ${currencySymbol}** ödülünüzü başarıyla tahsil ettiniz!\n\nYeni Bakiye: **${newBalance.toLocaleString()} ${currencySymbol}**`)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
