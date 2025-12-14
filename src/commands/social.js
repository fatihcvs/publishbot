const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const platforms = {
  twitch: { name: 'Twitch', emoji: '🟣', color: '#9146FF' },
  youtube: { name: 'YouTube', emoji: '🔴', color: '#FF0000' },
  tiktok: { name: 'TikTok', emoji: '🎵', color: '#00F7EF' },
  twitter: { name: 'X (Twitter)', emoji: '🐦', color: '#1DA1F2' },
  instagram: { name: 'Instagram', emoji: '📸', color: '#E4405F' },
  rss: { name: 'RSS', emoji: '📰', color: '#FFA500' }
};

module.exports = {
  name: 'sosyal',
  aliases: ['social', 'bildirim', 'notification'],
  description: 'Sosyal medya bildirimlerini yönetin',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand) {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📢 Sosyal Medya Bildirimleri')
        .setDescription('Sosyal medya hesaplarınız için bildirim ayarlayın!')
        .addFields(
          { name: '➕ Bildirim Ekle', value: '`!sosyal ekle <platform> <kullanıcı_adı> #kanal [mesaj]`\nÖrnek: `!sosyal ekle twitch ninja #yayınlar Yayın başladı!`', inline: false },
          { name: '➖ Bildirim Sil', value: '`!sosyal sil <bildirim_id>`', inline: false },
          { name: '📋 Bildirimleri Listele', value: '`!sosyal liste [platform]`', inline: false },
          { name: '📊 Desteklenen Platformlar', value: Object.entries(platforms).map(([key, val]) => `${val.emoji} ${val.name} (\`${key}\`)`).join('\n'), inline: false }
        )
        .setFooter({ text: 'Dashboard üzerinden de ayarlayabilirsiniz: /dashboard' })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'ekle' || subCommand === 'add') {
      const platform = args[1]?.toLowerCase();
      const username = args[2];
      const channel = message.mentions.channels.first();
      const customMessage = args.slice(channel ? 4 : 3).join(' ') || null;
      
      if (!platform || !username || !channel) {
        return message.reply('Kullanım: `!sosyal ekle <platform> <kullanıcı_adı> #kanal [özel_mesaj]`\nÖrnek: `!sosyal ekle twitch ninja #yayınlar`');
      }
      
      if (!platforms[platform]) {
        return message.reply(`Geçersiz platform! Desteklenen platformlar: ${Object.keys(platforms).join(', ')}`);
      }
      
      await storage.addSocialNotification(message.guild.id, platform, username, channel.id, customMessage);
      
      const platformInfo = platforms[platform];
      const embed = new EmbedBuilder()
        .setColor(platformInfo.color)
        .setTitle(`${platformInfo.emoji} Bildirim Eklendi!`)
        .addFields(
          { name: 'Platform', value: platformInfo.name, inline: true },
          { name: 'Kullanıcı', value: username, inline: true },
          { name: 'Kanal', value: channel.toString(), inline: true }
        )
        .setTimestamp();
      
      if (customMessage) {
        embed.addFields({ name: 'Özel Mesaj', value: customMessage, inline: false });
      }
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'sil' || subCommand === 'remove' || subCommand === 'delete') {
      const notificationId = parseInt(args[1]);
      
      if (!notificationId) {
        return message.reply('Kullanım: `!sosyal sil <bildirim_id>`\nID\'leri görmek için: `!sosyal liste`');
      }
      
      await storage.deleteSocialNotification(notificationId);
      return message.reply('✅ Bildirim silindi!');
    }
    
    if (subCommand === 'liste' || subCommand === 'list') {
      const platform = args[1]?.toLowerCase();
      const notifications = await storage.getSocialNotifications(message.guild.id, platform || null);
      
      if (notifications.length === 0) {
        return message.reply(platform 
          ? `${platforms[platform]?.name || platform} için bildirim bulunamadı.`
          : 'Henüz sosyal medya bildirimi ayarlanmamış.');
      }
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📢 Sosyal Medya Bildirimleri')
        .setDescription(notifications.map(n => {
          const platformInfo = platforms[n.platform] || { emoji: '📢', name: n.platform };
          return `**ID: ${n.id}** ${platformInfo.emoji} ${platformInfo.name}\n` +
                 `👤 ${n.username}\n` +
                 `📢 <#${n.channelId}>\n` +
                 `${n.customMessage ? `💬 ${n.customMessage}\n` : ''}` +
                 `${n.enabled ? '✅ Aktif' : '❌ Devre dışı'}`;
        }).join('\n\n'))
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'toggle' || subCommand === 'aç' || subCommand === 'kapat') {
      const notificationId = parseInt(args[1]);
      
      if (!notificationId) {
        return message.reply('Kullanım: `!sosyal toggle <bildirim_id>`');
      }
      
      const notifications = await storage.getSocialNotifications(message.guild.id);
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return message.reply('Bildirim bulunamadı!');
      }
      
      await storage.updateSocialNotification(notificationId, { enabled: !notification.enabled });
      return message.reply(`Bildirim ${!notification.enabled ? '✅ aktif' : '❌ devre dışı'} edildi!`);
    }
    
    return message.reply('Geçersiz komut. `!sosyal` yazarak kullanılabilir komutları görün.');
  }
};
