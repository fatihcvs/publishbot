const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'jackpotinfo',
  aliases: ['jp', 'jackpotbilgi', 'havuz'],
  description: 'Jackpot havuzunu gösterir',
  usage: '!jackpotinfo',
  
  async execute(message, args, client) {
    const jackpot = await storage.getJackpot(message.guild.id);

    const amount = jackpot?.amount || 0;
    const lastWinner = jackpot?.lastWinner;
    const lastWinAmount = jackpot?.lastWinAmount || 0;
    const lastWinDate = jackpot?.lastWinDate;

    let lastWinnerName = 'Henüz kimse kazanmadı';
    if (lastWinner) {
      try {
        const member = await message.guild.members.fetch(lastWinner);
        lastWinnerName = member.user.username;
      } catch (e) {
        lastWinnerName = 'Bilinmeyen Kullanıcı';
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🎰 Jackpot Havuzu')
      .setColor('#ffd700')
      .setDescription(`
# 💰 ${amount.toLocaleString()} coin

Jackpot havuzu her oyundan kesilen komisyonlarla büyüyor!
Slots'ta 🎰🎰🎰 çıkarsan jackpot'u kazanırsın!
      `)
      .addFields(
        { name: '📊 Nasıl Katkı Sağlanır?', value: 
          '• Coinflip: %2\n• Slots: %5\n• Roulette: %3\n• Düellolar: %5', inline: true }
      );

    if (lastWinner) {
      embed.addFields({
        name: '🏆 Son Kazanan',
        value: `**${lastWinnerName}**\n💵 ${lastWinAmount.toLocaleString()} coin\n📅 ${lastWinDate ? new Date(lastWinDate).toLocaleDateString('tr-TR') : '-'}`,
        inline: true
      });
    }

    embed.setFooter({ text: 'Slots oynayarak jackpot\'u kazanma şansını yakala!' });

    message.reply({ embeds: [embed] });
  }
};
