const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'davetsıralama',
  aliases: ['invitetop', 'inviteleaderboard', 'topdavet'],
  description: 'Davet sıralamasını gösterir',
  async execute(message, args, client) {
    try {
      const invites = await message.guild.invites.fetch();
      
      const inviterStats = new Map();
      
      invites.forEach(invite => {
        if (invite.inviter) {
          const current = inviterStats.get(invite.inviter.id) || { user: invite.inviter, uses: 0 };
          current.uses += invite.uses || 0;
          inviterStats.set(invite.inviter.id, current);
        }
      });

      const sorted = [...inviterStats.values()]
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 10);

      if (sorted.length === 0) {
        return message.reply('Henüz davet verisi yok!');
      }

      let description = '';
      sorted.forEach((data, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
        description += `${medal} ${data.user.tag} - **${data.uses}** davet\n`;
      });

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('📊 Davet Sıralaması')
        .setDescription(description)
        .setFooter({ text: `${message.guild.name}` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Davet sıralaması alınırken hata:', error);
      message.reply('Davet sıralaması alınırken bir hata oluştu!');
    }
  }
};
