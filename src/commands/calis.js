const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const { userEconomy, economyConfig } = require('../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
  name: 'çalış',
  aliases: ['calis', 'work', 'is', 'iş'],
  description: 'Çalışarak sunucu parası kazanırsınız. (1 saatte bir)',

  async execute(message, args, client) {
    // Check config
    const [configRow] = await db.select().from(economyConfig).where(eq(economyConfig.guildId, message.guild.id));
    if (configRow && !configRow.enabled) {
      return message.reply('❌ Bu sunucuda ekonomi sistemi kapalı.');
    }

    const currencySymbol = configRow?.currencySymbol || '💰';
    const minEarn = configRow?.workMinAmount || 50;
    const maxEarn = configRow?.workMaxAmount || 200;

    let [userRow] = await db.select().from(userEconomy)
      .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, message.author.id)))
      .limit(1);

    const now = new Date();

    if (!userRow) {
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

    // 1 Hour work cooldown
    if (userRow.lastWork) {
      const lastClaim = new Date(userRow.lastWork);
      const diffMs = now.getTime() - lastClaim.getTime();
      const oneHour = 60 * 60 * 1000;

      if (diffMs < oneHour) {
        const remainingMs = oneHour - diffMs;
        const minutes = Math.floor(remainingMs / (1000 * 60));
        return message.reply(`⏰ Henüz yorgunsunuz! Tekrar çalışabilmek için **${minutes} dakika** dinlenmelisiniz.`);
      }
    }

    const earned = Math.floor(Math.random() * (maxEarn - minEarn + 1)) + minEarn;
    const newBalance = (userRow.balance || 0) + earned;

    await db.update(userEconomy)
      .set({ balance: newBalance, lastWork: now })
      .where(eq(userEconomy.id, userRow.id));

    const jobs = [
      "yazılımcı olarak bug çözdün",
      "pizzacıda kuryelik yaptın",
      "kafe işlettin",
      "Discord moderatörlüğü yaptın",
      "madencilik yaptın",
      "şoförlük yaptın",
      "fabrika vardiyasına kaldın",
      "fotoğrafçılık yaptın",
      "garsonluk yaptın",
      "çevirmenlik yaptın",
      "özel ders verdin",
      "espor turnuvasında oynadın"
    ];

    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('💼 İş Bitti!')
      .setDescription(`Başarıyla ${randomJob} ve **${earned} ${currencySymbol}** kazandın!\n\nYeni Bakiye: **${newBalance.toLocaleString()} ${currencySymbol}**`)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
