const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const COMMAND_DURATION = 10 * 60 * 1000;
const startTime = Date.now();
const claimedUsers = new Set();

module.exports = {
  name: 'fatih',
  aliases: [],
  description: 'Özel etkinlik komutu - 1.000.000 para kazan!',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const elapsed = Date.now() - startTime;
    if (elapsed > COMMAND_DURATION) {
      return message.reply('❌ Bu etkinlik sona erdi!');
    }

    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }

    const userId = message.author.id;
    
    if (claimedUsers.has(userId)) {
      return message.reply('❌ Bu ödülü zaten aldın!');
    }

    claimedUsers.add(userId);
    await letheStorage.addCoins(userId, 1000000);

    const remainingMs = COMMAND_DURATION - elapsed;
    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎉 FATİH ETKİNLİĞİ! 🎉')
      .setDescription(`**${message.author.username}** etkinlik ödülünü aldı!`)
      .addFields(
        { name: '💰 Kazanılan', value: '**1,000,000** para!', inline: true },
        { name: '⏰ Kalan Süre', value: `${remainingMin}dk ${remainingSec}sn`, inline: true }
      )
      .setFooter({ text: 'Bu etkinlik sadece 10 dakika sürecek!' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
