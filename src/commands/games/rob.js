const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'rob',
  aliases: ['soy', 'soygun', 'steal', 'çal'],
  description: 'Başka bir kullanıcıyı soymaya çalış! (Riskli)',
  usage: '!rob @kullanici',
  
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    
    if (!target) {
      return message.reply('Soymak istediğin kişiyi etiketle! `!rob @kullanici`');
    }

    if (target.id === message.author.id) {
      return message.reply('Kendini soyamazsın!');
    }

    if (target.bot) {
      return message.reply('Botları soyamazsın!');
    }

    let robberEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!robberEco) robberEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    let targetEco = await storage.getUserEconomy(message.guild.id, target.id);
    if (!targetEco) targetEco = await storage.createUserEconomy(message.guild.id, target.id);

    if (robberEco.balance < 100) {
      return message.reply('Soygun yapmak için en az **100** coin bakiyen olmalı (yakalanma riski için)!');
    }

    if (targetEco.balance < 50) {
      return message.reply(`${target.username}'in soyacak parası yok!`);
    }

    await storage.incrementUserStats(message.guild.id, message.author.id, 'robberyAttempts');

    const successChance = Math.random();
    const robberStats = await storage.getUserStats(message.guild.id, message.author.id);
    const successRate = 0.35 + Math.min((robberStats?.robberySuccess || 0) * 0.01, 0.15);

    if (successChance > successRate) {
      const fine = Math.floor(robberEco.balance * (0.2 + Math.random() * 0.2));
      await storage.updateUserBalance(message.guild.id, message.author.id, -fine);
      await storage.updateUserBalance(message.guild.id, target.id, Math.floor(fine * 0.5));

      const failEmbed = new EmbedBuilder()
        .setTitle('🚔 Soygun Başarısız!')
        .setColor('#ff0000')
        .setDescription(`
Yakalandın! Polis seni tutukladı.

**Ceza:** ${fine} coin
**${target.username}** tazminat olarak **${Math.floor(fine * 0.5)}** coin aldı.
        `)
        .setFooter({ text: `${message.author.username} • Suç işlemek her zaman risklidir!` });

      return message.reply({ embeds: [failEmbed] });
    }

    const stealPercentage = 0.1 + Math.random() * 0.25;
    const stolenAmount = Math.floor(targetEco.balance * stealPercentage);
    const actualStolen = Math.min(stolenAmount, 5000);

    await storage.updateUserBalance(message.guild.id, message.author.id, actualStolen);
    await storage.updateUserBalance(message.guild.id, target.id, -actualStolen);
    await storage.incrementUserStats(message.guild.id, message.author.id, 'robberySuccess');
    await storage.incrementUserStats(message.guild.id, target.id, 'timesRobbed');

    const successEmbed = new EmbedBuilder()
      .setTitle('💰 Soygun Başarılı!')
      .setColor('#00ff00')
      .setDescription(`
**${target.username}**'in cüzdanından para çaldın!

**Çalınan:** ${actualStolen} coin
      `)
      .addFields(
        { name: '🎯 Hedef', value: target.username, inline: true },
        { name: '💵 Kazanç', value: `+${actualStolen} coin`, inline: true }
      )
      .setFooter({ text: `${message.author.username} • Şanslıydın bu sefer!` });

    try {
      await target.send(`🚨 **${message.author.username}** seni soydu ve **${actualStolen}** coin çaldı! (${message.guild.name})`);
    } catch (e) {}

    message.reply({ embeds: [successEmbed] });
  }
};
