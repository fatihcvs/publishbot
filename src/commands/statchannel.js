const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  name: 'istatistik',
  aliases: ['stats', 'statchannel', 'sayac'],
  description: 'İstatistik kanalları oluşturur',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'üye' || subCommand === 'members') {
      try {
        const channel = await message.guild.channels.create({
          name: `👥 Üyeler: ${message.guild.memberCount}`,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: message.guild.id,
              deny: [PermissionFlagsBits.Connect]
            }
          ]
        });

        return message.reply(`Üye sayacı kanalı oluşturuldu: ${channel}`);
      } catch (error) {
        console.error('Kanal oluşturulurken hata:', error);
        return message.reply('Kanal oluşturulurken bir hata oluştu!');
      }
    }

    if (subCommand === 'bot' || subCommand === 'bots') {
      const botCount = message.guild.members.cache.filter(m => m.user.bot).size;
      
      try {
        const channel = await message.guild.channels.create({
          name: `🤖 Botlar: ${botCount}`,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: message.guild.id,
              deny: [PermissionFlagsBits.Connect]
            }
          ]
        });

        return message.reply(`Bot sayacı kanalı oluşturuldu: ${channel}`);
      } catch (error) {
        console.error('Kanal oluşturulurken hata:', error);
        return message.reply('Kanal oluşturulurken bir hata oluştu!');
      }
    }

    if (subCommand === 'kanal' || subCommand === 'channels') {
      const channelCount = message.guild.channels.cache.size;
      
      try {
        const channel = await message.guild.channels.create({
          name: `📊 Kanallar: ${channelCount}`,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: message.guild.id,
              deny: [PermissionFlagsBits.Connect]
            }
          ]
        });

        return message.reply(`Kanal sayacı oluşturuldu: ${channel}`);
      } catch (error) {
        console.error('Kanal oluşturulurken hata:', error);
        return message.reply('Kanal oluşturulurken bir hata oluştu!');
      }
    }

    if (subCommand === 'rol' || subCommand === 'roles') {
      const roleCount = message.guild.roles.cache.size;
      
      try {
        const channel = await message.guild.channels.create({
          name: `🎭 Roller: ${roleCount}`,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: message.guild.id,
              deny: [PermissionFlagsBits.Connect]
            }
          ]
        });

        return message.reply(`Rol sayacı oluşturuldu: ${channel}`);
      } catch (error) {
        console.error('Kanal oluşturulurken hata:', error);
        return message.reply('Kanal oluşturulurken bir hata oluştu!');
      }
    }

    if (subCommand === 'çevrimiçi' || subCommand === 'online') {
      const onlineCount = message.guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
      
      try {
        const channel = await message.guild.channels.create({
          name: `🟢 Çevrimiçi: ${onlineCount}`,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: message.guild.id,
              deny: [PermissionFlagsBits.Connect]
            }
          ]
        });

        return message.reply(`Çevrimiçi sayacı oluşturuldu: ${channel}`);
      } catch (error) {
        console.error('Kanal oluşturulurken hata:', error);
        return message.reply('Kanal oluşturulurken bir hata oluştu!');
      }
    }

    // Yardım
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📊 İstatistik Kanalları')
      .setDescription('Sunucu istatistiklerini gösteren ses kanalları oluşturun!')
      .addFields(
        { name: '!istatistik üye', value: 'Üye sayacı oluşturur', inline: true },
        { name: '!istatistik bot', value: 'Bot sayacı oluşturur', inline: true },
        { name: '!istatistik kanal', value: 'Kanal sayacı oluşturur', inline: true },
        { name: '!istatistik rol', value: 'Rol sayacı oluşturur', inline: true },
        { name: '!istatistik çevrimiçi', value: 'Çevrimiçi sayacı', inline: true }
      )
      .setFooter({ text: 'Sayaçlar otomatik güncellenir' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
