const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'bakiye',
  aliases: ['p', 'para', 'coins', 'money', 'cüzdan', 'cuzdan', 'balance'],
  description: 'Lethe Game bakiyeni görüntüle',
  usage: '!bakiye [@kullanıcı]',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('Lethe Game bu sunucuda devre dışı.');
    }

    const targetUser = message.mentions.users.first() || message.author;
    const profile = await letheStorage.getOrCreateProfile(targetUser.id);
    const gems = await letheStorage.getUserGems(targetUser.id);
    
    const gemEmojis = {
      common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟨', mythic: '🟧', hidden: '❓'
    };
    
    let gemText = '';
    const gemTypes = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'hidden'];
    for (const type of gemTypes) {
      if (gems[type] > 0) {
        gemText += `${gemEmojis[type]} ${gems[type]} `;
      }
    }
    if (!gemText) gemText = 'Henüz taş yok';

    const embed = new EmbedBuilder()
      .setColor('#f59e0b')
      .setTitle(`💰 ${targetUser.username}'in Cüzdanı`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💰 Para', value: `**${profile.coins.toLocaleString()}** coin`, inline: true },
        { name: '⭐ Seviye', value: `${profile.level}`, inline: true },
        { name: '✨ XP', value: `${profile.xp}`, inline: true },
        { name: '💎 Evrim Taşları', value: gemText, inline: false }
      )
      .setFooter({ text: 'Para kazanmak için: !günlük, !çalış, !avla' })
      .setTimestamp();

    if (targetUser.id === message.author.id) {
      embed.setDescription('Kazanmak için avlan, günlük ödülünü al veya çalış!');
    }

    await message.reply({ embeds: [embed] });
  }
};
