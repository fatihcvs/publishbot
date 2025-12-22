const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'arkadas',
  aliases: ['arkadaş', 'friend', 'friends', 'ark'],
  description: 'Arkadaş listeni yönet ve istatistiklerini gör',
  usage: '!arkadas [ekle/sil/liste/istekler]',
  category: 'lethe',
  
  async execute(message, args, client, storage) {
    const userId = message.author.id;
    
    if (!args[0]) {
      return this.showFriendList(message, userId, client);
    }
    
    const subcommand = args[0].toLowerCase();
    
    switch(subcommand) {
      case 'ekle':
      case 'add':
        return this.addFriend(message, userId);
      
      case 'sil':
      case 'remove':
      case 'kaldır':
        return this.removeFriend(message, userId);
      
      case 'liste':
      case 'list':
        return this.showFriendList(message, userId, client);
      
      case 'istekler':
      case 'requests':
        return this.showRequests(message, userId, client);
      
      case 'kabul':
      case 'accept':
        return this.acceptRequest(message, args[1], userId, client);
      
      case 'reddet':
      case 'reject':
        return this.rejectRequest(message, args[1], userId);
      
      default:
        return this.showHelp(message);
    }
  },
  
  showHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('👥 Arkadaş Sistemi')
      .setDescription('Oyun arkadaşlarını ekle ve istatistiklerini takip et!')
      .addFields(
        { name: '➕ Arkadaş Ekle', value: '`!arkadas ekle @kullanıcı`', inline: true },
        { name: '➖ Arkadaş Sil', value: '`!arkadas sil @kullanıcı`', inline: true },
        { name: '📋 Liste', value: '`!arkadas liste`', inline: true },
        { name: '📩 Gelen İstekler', value: '`!arkadas istekler`', inline: true },
        { name: '✅ Kabul Et', value: '`!arkadas kabul <id>`', inline: true },
        { name: '❌ Reddet', value: '`!arkadas reddet <id>`', inline: true }
      )
      .addFields(
        { name: '🎁 Arkadaş Bonusları', value: '• Arkadaşlarına hediye gönderebilirsin\n• Arkadaşlarınla raid yapabilirsin\n• Arkadaş profillerini detaylı görebilirsin', inline: false }
      );
    
    return message.reply({ embeds: [embed] });
  },
  
  async addFriend(message, userId) {
    const targetUser = message.mentions.users.first();
    
    if (!targetUser) {
      return message.reply('❌ Bir kullanıcı etiketlemelisiniz: `!arkadas ekle @kullanıcı`');
    }
    
    if (targetUser.id === userId) {
      return message.reply('❌ Kendinizi arkadaş olarak ekleyemezsiniz!');
    }
    
    if (targetUser.bot) {
      return message.reply('❌ Botları arkadaş olarak ekleyemezsiniz!');
    }
    
    const result = await letheStorage.sendFriendRequest(userId, targetUser.id);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📤 Arkadaşlık İsteği Gönderildi!')
      .setDescription(`${targetUser} kullanıcısına arkadaşlık isteği gönderildi.`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: 'Kabul edildiğinde bildirim alacaksınız' });
    
    await message.reply({ embeds: [embed] });
    
    try {
      const notifyEmbed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📩 Yeni Arkadaşlık İsteği!')
        .setDescription(`${message.author} sana arkadaşlık isteği gönderdi!`)
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: 'Kabul etmek için: !arkadas istekler' });
      
      await targetUser.send({ embeds: [notifyEmbed] }).catch(() => {});
    } catch (e) {}
  },
  
  async removeFriend(message, userId) {
    const targetUser = message.mentions.users.first();
    
    if (!targetUser) {
      return message.reply('❌ Bir kullanıcı etiketlemelisiniz: `!arkadas sil @kullanıcı`');
    }
    
    const areFriends = await letheStorage.areFriends(userId, targetUser.id);
    
    if (!areFriends) {
      return message.reply('❌ Bu kullanıcı arkadaş listenizde değil!');
    }
    
    await letheStorage.removeFriend(userId, targetUser.id);
    
    return message.reply(`✅ ${targetUser.username} arkadaş listenizden çıkarıldı.`);
  },
  
  async showFriendList(message, userId, client) {
    const friendIds = await letheStorage.getFriends(userId);
    
    if (friendIds.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('👥 Arkadaş Listesi')
        .setDescription('Henüz arkadaşınız yok!\n\nArkadaş eklemek için: `!arkadas ekle @kullanıcı`');
      
      return message.reply({ embeds: [embed] });
    }
    
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`👥 Arkadaş Listesi (${friendIds.length})`)
      .setDescription('Lethe Game arkadaşlarınız:');
    
    const friendList = [];
    
    for (const friendId of friendIds.slice(0, 15)) {
      try {
        const user = await client.users.fetch(friendId).catch(() => null);
        const profile = await letheStorage.getProfile(friendId);
        
        const username = user ? user.username : `Kullanıcı ${friendId.slice(-4)}`;
        const level = profile?.level || 1;
        const animals = await letheStorage.getUserAnimals(friendId);
        
        friendList.push(`**${username}** - Lv.${level} | 🐾 ${animals.length} hayvan`);
      } catch (e) {
        friendList.push(`<@${friendId}> - Profil yüklenemedi`);
      }
    }
    
    embed.addFields({ name: 'Arkadaşlar', value: friendList.join('\n') || 'Liste boş' });
    
    if (friendIds.length > 15) {
      embed.setFooter({ text: `ve ${friendIds.length - 15} arkadaş daha...` });
    }
    
    return message.reply({ embeds: [embed] });
  },
  
  async showRequests(message, userId, client) {
    const requests = await letheStorage.getPendingFriendRequests(userId);
    
    if (requests.length === 0) {
      return message.reply('📭 Bekleyen arkadaşlık isteğiniz yok.');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📩 Gelen Arkadaşlık İstekleri')
      .setDescription('Aşağıdaki kullanıcılar size arkadaşlık isteği gönderdi:');
    
    for (const request of requests.slice(0, 10)) {
      try {
        const user = await client.users.fetch(request.userId).catch(() => null);
        const username = user ? user.username : `Kullanıcı ${request.userId.slice(-4)}`;
        
        embed.addFields({
          name: `#${request.id} - ${username}`,
          value: `Kabul: \`!arkadas kabul ${request.id}\` | Reddet: \`!arkadas reddet ${request.id}\``,
          inline: false
        });
      } catch (e) {
        embed.addFields({
          name: `#${request.id} - Bilinmeyen`,
          value: `Kabul: \`!arkadas kabul ${request.id}\``,
          inline: false
        });
      }
    }
    
    return message.reply({ embeds: [embed] });
  },
  
  async acceptRequest(message, requestIdStr, userId, client) {
    if (!requestIdStr) {
      return message.reply('❌ İstek ID belirtmelisiniz: `!arkadas kabul <id>`');
    }
    
    const requestId = parseInt(requestIdStr);
    const result = await letheStorage.acceptFriendRequest(userId, requestId);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const friend = await client.users.fetch(result.friendId).catch(() => null);
    const friendName = friend ? friend.username : 'Kullanıcı';
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Arkadaşlık Kabul Edildi!')
      .setDescription(`**${friendName}** artık arkadaşınız!`)
      .setFooter({ text: 'Arkadaş listesi: !arkadas liste' });
    
    if (friend) {
      embed.setThumbnail(friend.displayAvatarURL());
    }
    
    await message.reply({ embeds: [embed] });
    
    if (friend) {
      try {
        const notifyEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('🎉 Arkadaşlık Kabul Edildi!')
          .setDescription(`${message.author} arkadaşlık isteğinizi kabul etti!`)
          .setThumbnail(message.author.displayAvatarURL());
        
        await friend.send({ embeds: [notifyEmbed] }).catch(() => {});
      } catch (e) {}
    }
  },
  
  async rejectRequest(message, requestIdStr, userId) {
    if (!requestIdStr) {
      return message.reply('❌ İstek ID belirtmelisiniz: `!arkadas reddet <id>`');
    }
    
    const requestId = parseInt(requestIdStr);
    await letheStorage.rejectFriendRequest(userId, requestId);
    
    return message.reply('❌ Arkadaşlık isteği reddedildi.');
  }
};
