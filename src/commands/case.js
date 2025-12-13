const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'vaka',
  aliases: ['case', 'modlog'],
  description: 'Moderasyon vakalarını gösterir',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const caseNumber = parseInt(args[0]);
    
    if (caseNumber) {
      const modCase = await storage.getModCase(message.guild.id, caseNumber);
      
      if (!modCase) {
        return message.reply('Vaka bulunamadı!');
      }
      
      const user = await client.users.fetch(modCase.userId).catch(() => null);
      const moderator = await client.users.fetch(modCase.moderatorId).catch(() => null);
      
      const typeNames = {
        warn: 'Uyarı',
        mute: 'Susturma',
        kick: 'Atma',
        ban: 'Yasaklama',
        unban: 'Yasak Kaldırma'
      };
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Vaka #${modCase.caseNumber}`)
        .addFields(
          { name: 'Tür', value: typeNames[modCase.type] || modCase.type, inline: true },
          { name: 'Kullanıcı', value: user?.tag || modCase.userId, inline: true },
          { name: 'Moderatör', value: moderator?.tag || modCase.moderatorId, inline: true },
          { name: 'Sebep', value: modCase.reason || 'Belirtilmedi' },
          { name: 'Tarih', value: `<t:${Math.floor(new Date(modCase.createdAt).getTime() / 1000)}:F>` }
        )
        .setTimestamp();
      
      if (modCase.duration) {
        embed.addFields({ name: 'Süre', value: `${modCase.duration} saniye`, inline: true });
      }
      
      await message.reply({ embeds: [embed] });
    } else {
      const cases = await storage.getModCases(message.guild.id, 10);
      
      if (cases.length === 0) {
        return message.reply('Bu sunucuda henüz moderasyon vakası yok.');
      }
      
      const typeNames = {
        warn: '⚠️',
        mute: '🔇',
        kick: '👢',
        ban: '🔨',
        unban: '✅'
      };
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Son Moderasyon Vakaları')
        .setDescription(
          cases.map(c => {
            const emoji = typeNames[c.type] || '📋';
            return `${emoji} **#${c.caseNumber}** | <@${c.userId}> | ${c.reason?.slice(0, 30) || 'Sebep yok'}...`;
          }).join('\n')
        )
        .setFooter({ text: 'Detay için: !vaka <numara>' })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    }
  }
};
