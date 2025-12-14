const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'davetler',
  aliases: ['invites', 'davet'],
  description: 'Davet istatistiklerini gösterir',
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;

    try {
      const invites = await message.guild.invites.fetch();
      const userInvites = invites.filter(i => i.inviter?.id === target.id);

      let totalUses = 0;
      userInvites.forEach(invite => {
        totalUses += invite.uses || 0;
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📨 Davet İstatistikleri')
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Kullanıcı', value: target.tag, inline: true },
          { name: 'Toplam Davet', value: `${totalUses}`, inline: true },
          { name: 'Aktif Davet Linkleri', value: `${userInvites.size}`, inline: true }
        )
        .setTimestamp();

      if (userInvites.size > 0) {
        const topInvites = userInvites
          .sort((a, b) => (b.uses || 0) - (a.uses || 0))
          .first(5);

        let inviteList = '';
        topInvites.forEach(inv => {
          inviteList += `\`${inv.code}\` - ${inv.uses || 0} kullanım\n`;
        });

        embed.addFields({ name: 'En Popüler Davetler', value: inviteList || 'Yok' });
      }

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Davet bilgisi alınırken hata:', error);
      message.reply('Davet bilgileri alınırken bir hata oluştu!');
    }
  }
};
