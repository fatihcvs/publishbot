const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'davet',
  aliases: ['invite', 'invites', 'davetler'],
  description: 'Davet istatistiklerini görüntüle',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'sıralama' || subCommand === 'top' || subCommand === 'leaderboard') {
      const leaderboard = await storage.getInviteLeaderboard(message.guild.id, 10);
      
      if (!leaderboard || leaderboard.length === 0) {
        return message.reply('Henüz davet verisi bulunmuyor!');
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🏆 Davet Sıralaması')
        .setDescription('En çok üye davet eden kullanıcılar')
        .setTimestamp();

      let description = '';
      for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        description += `${medal} <@${entry.inviter_id}> - **${entry.invite_count}** davet\n`;
      }
      
      embed.setDescription(description || 'Veri bulunamadı');
      return message.reply({ embeds: [embed] });
    }

    const targetUser = message.mentions.users.first() || message.author;
    const inviteCount = await storage.getInviteCount(message.guild.id, targetUser.id);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📨 Davet İstatistikleri')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Kullanıcı', value: targetUser.toString(), inline: true },
        { name: 'Toplam Davet', value: `**${inviteCount}** kişi`, inline: true }
      )
      .setFooter({ text: 'Sıralama için: !davet sıralama' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
