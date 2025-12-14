const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'levelrol',
  aliases: ['levelrole', 'seviyerol'],
  description: 'Seviye rol ödüllerini yönetir',
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(message, args, client) {
    const storage = client.storage;
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === 'liste' || subcommand === 'list') {
      return await listRewards(message, storage);
    }

    if (subcommand === 'ekle' || subcommand === 'add') {
      const level = parseInt(args[1]);
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

      if (!level || isNaN(level) || level < 1) {
        return message.reply('Geçerli bir seviye belirtin! Örnek: `!levelrol ekle 5 @Rol`');
      }

      if (!role) {
        return message.reply('Bir rol etiketleyin veya rol ID\'si girin!');
      }

      try {
        await storage.addLevelReward(message.guild.id, level, role.id);
        
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Seviye Ödülü Eklendi')
          .setDescription(`Seviye **${level}**'e ulaşan üyeler artık ${role} rolünü alacak!`)
          .setTimestamp();

        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Add level reward error:', error);
        message.reply('Ödül eklenirken bir hata oluştu!');
      }
      return;
    }

    if (subcommand === 'sil' || subcommand === 'remove') {
      const level = parseInt(args[1]);

      if (!level || isNaN(level)) {
        return message.reply('Silmek istediğiniz seviyeyi belirtin! Örnek: `!levelrol sil 5`');
      }

      try {
        await storage.removeLevelReward(message.guild.id, level);
        
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🗑️ Seviye Ödülü Silindi')
          .setDescription(`Seviye **${level}** için olan ödül silindi.`)
          .setTimestamp();

        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Remove level reward error:', error);
        message.reply('Ödül silinirken bir hata oluştu!');
      }
      return;
    }

    message.reply('Kullanım:\n`!levelrol liste` - Tüm ödülleri listele\n`!levelrol ekle <seviye> @rol` - Ödül ekle\n`!levelrol sil <seviye>` - Ödül sil');
  }
};

async function listRewards(message, storage) {
  try {
    const rewards = await storage.getLevelRewards(message.guild.id);

    if (!rewards || rewards.length === 0) {
      return message.reply('Henüz seviye ödülü ayarlanmamış!\n`!levelrol ekle <seviye> @rol` ile ödül ekleyebilirsiniz.');
    }

    let description = '';
    for (const reward of rewards) {
      const role = message.guild.roles.cache.get(reward.roleId);
      const roleName = role ? role.toString() : 'Silinmiş Rol';
      description += `⭐ **Seviye ${reward.level}** → ${roleName}\n`;
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎁 Seviye Ödülleri')
      .setDescription(description)
      .setFooter({ text: `Toplam ${rewards.length} ödül` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('List rewards error:', error);
    message.reply('Ödüller listelenirken bir hata oluştu!');
  }
}
