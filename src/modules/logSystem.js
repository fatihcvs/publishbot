const { EmbedBuilder } = require('discord.js');

class LogSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
  }

  async getLogChannel(guildId, logType) {
    const guildData = await this.storage.getGuild(guildId);
    const logConfig = guildData?.logConfig || {};
    const logChannel = guildData?.logChannel;
    
    // Check if this log type is enabled
    const isEnabled = logConfig[logType] === true;
    
    if (!isEnabled || !logChannel) return null;
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return null;
    
    return guild.channels.cache.get(logChannel);
  }

  async log(guildId, logType, embed) {
    try {
      const channel = await this.getLogChannel(guildId, logType);
      if (channel) {
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Log error (${logType}):`, error.message);
    }
  }

  async channelCreate(channel) {
    if (!channel.guild) return;
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Kanal Oluşturuldu')
      .addFields(
        { name: 'Kanal', value: `${channel.name} (${channel.id})`, inline: true },
        { name: 'Tür', value: this.getChannelType(channel.type), inline: true }
      )
      .setTimestamp();

    await this.log(channel.guild.id, 'channelCreate', embed);
  }

  async channelDelete(channel) {
    if (!channel.guild) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Kanal Silindi')
      .addFields(
        { name: 'Kanal', value: `${channel.name} (${channel.id})`, inline: true },
        { name: 'Tür', value: this.getChannelType(channel.type), inline: true }
      )
      .setTimestamp();

    await this.log(channel.guild.id, 'channelDelete', embed);
  }

  async channelUpdate(oldChannel, newChannel) {
    if (!newChannel.guild) return;
    
    const changes = [];
    if (oldChannel.name !== newChannel.name) {
      changes.push(`İsim: ${oldChannel.name} → ${newChannel.name}`);
    }
    if (oldChannel.topic !== newChannel.topic) {
      changes.push(`Konu: ${oldChannel.topic || 'Yok'} → ${newChannel.topic || 'Yok'}`);
    }
    
    if (changes.length === 0) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('Kanal Güncellendi')
      .addFields(
        { name: 'Kanal', value: `${newChannel.name} (${newChannel.id})`, inline: true },
        { name: 'Değişiklikler', value: changes.join('\n') }
      )
      .setTimestamp();

    await this.log(newChannel.guild.id, 'channelUpdate', embed);
  }

  async roleCreate(role) {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Rol Oluşturuldu')
      .addFields(
        { name: 'Rol', value: `${role.name} (${role.id})`, inline: true },
        { name: 'Renk', value: role.hexColor, inline: true }
      )
      .setTimestamp();

    await this.log(role.guild.id, 'roleCreate', embed);
  }

  async roleDelete(role) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Rol Silindi')
      .addFields(
        { name: 'Rol', value: `${role.name} (${role.id})`, inline: true },
        { name: 'Renk', value: role.hexColor, inline: true }
      )
      .setTimestamp();

    await this.log(role.guild.id, 'roleDelete', embed);
  }

  async roleUpdate(oldRole, newRole) {
    const changes = [];
    if (oldRole.name !== newRole.name) {
      changes.push(`İsim: ${oldRole.name} → ${newRole.name}`);
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`Renk: ${oldRole.hexColor} → ${newRole.hexColor}`);
    }
    
    if (changes.length === 0) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('Rol Güncellendi')
      .addFields(
        { name: 'Rol', value: `${newRole.name} (${newRole.id})`, inline: true },
        { name: 'Değişiklikler', value: changes.join('\n') }
      )
      .setTimestamp();

    await this.log(newRole.guild.id, 'roleUpdate', embed);
  }

  async messageDelete(message) {
    if (!message.guild || message.author?.bot) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('Mesaj Silindi')
      .addFields(
        { name: 'Kanal', value: message.channel.toString(), inline: true },
        { name: 'Yazar', value: message.author?.tag || 'Bilinmiyor', inline: true },
        { name: 'İçerik', value: message.content?.slice(0, 1000) || 'İçerik yok' }
      )
      .setTimestamp();

    await this.log(message.guild.id, 'messageDelete', embed);
  }

  async messageUpdate(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('Mesaj Düzenlendi')
      .setURL(newMessage.url)
      .addFields(
        { name: 'Kanal', value: newMessage.channel.toString(), inline: true },
        { name: 'Yazar', value: newMessage.author?.tag || 'Bilinmiyor', inline: true },
        { name: 'Eski İçerik', value: oldMessage.content?.slice(0, 500) || 'İçerik yok' },
        { name: 'Yeni İçerik', value: newMessage.content?.slice(0, 500) || 'İçerik yok' }
      )
      .setTimestamp();

    await this.log(newMessage.guild.id, 'messageUpdate', embed);
  }

  async guildMemberAdd(member) {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Üye Katıldı')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Hesap Oluşturulma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
      )
      .setTimestamp();

    await this.log(member.guild.id, 'memberJoin', embed);
  }

  async guildMemberRemove(member) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Üye Ayrıldı')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
      )
      .setTimestamp();

    await this.log(member.guild.id, 'memberLeave', embed);
  }

  async guildMemberUpdate(oldMember, newMember) {
    const changes = [];
    
    if (oldMember.nickname !== newMember.nickname) {
      changes.push(`Takma Ad: ${oldMember.nickname || 'Yok'} → ${newMember.nickname || 'Yok'}`);
    }
    
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    
    if (addedRoles.size > 0) {
      changes.push(`Eklenen Roller: ${addedRoles.map(r => r.name).join(', ')}`);
    }
    if (removedRoles.size > 0) {
      changes.push(`Kaldırılan Roller: ${removedRoles.map(r => r.name).join(', ')}`);
    }
    
    if (changes.length === 0) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('Üye Güncellendi')
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Kullanıcı', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
        { name: 'Değişiklikler', value: changes.join('\n') }
      )
      .setTimestamp();

    await this.log(newMember.guild.id, 'memberUpdate', embed);
  }

  async guildBanAdd(ban) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Kullanıcı Yasaklandı')
      .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Kullanıcı', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
        { name: 'Sebep', value: ban.reason || 'Belirtilmedi', inline: true }
      )
      .setTimestamp();

    await this.log(ban.guild.id, 'banAdd', embed);
  }

  async guildBanRemove(ban) {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Yasak Kaldırıldı')
      .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Kullanıcı', value: `${ban.user.tag} (${ban.user.id})`, inline: true }
      )
      .setTimestamp();

    await this.log(ban.guild.id, 'banRemove', embed);
  }

  async voiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member) return;
    
    let title, color, description;
    
    if (!oldState.channel && newState.channel) {
      title = 'Ses Kanalına Katıldı';
      color = '#00ff00';
      description = `${member.user.tag} **${newState.channel.name}** kanalına katıldı.`;
    } else if (oldState.channel && !newState.channel) {
      title = 'Ses Kanalından Ayrıldı';
      color = '#ff0000';
      description = `${member.user.tag} **${oldState.channel.name}** kanalından ayrıldı.`;
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      title = 'Ses Kanalı Değiştirildi';
      color = '#ffaa00';
      description = `${member.user.tag} **${oldState.channel.name}** → **${newState.channel.name}**`;
    } else {
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await this.log(member.guild.id, 'voiceActivity', embed);
  }

  async guildUpdate(oldGuild, newGuild) {
    const changes = [];
    
    if (oldGuild.name !== newGuild.name) {
      changes.push(`Sunucu Adı: ${oldGuild.name} → ${newGuild.name}`);
    }
    if (oldGuild.iconURL() !== newGuild.iconURL()) {
      changes.push('Sunucu ikonu değiştirildi');
    }
    
    if (changes.length === 0) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('Sunucu Ayarları Güncellendi')
      .addFields(
        { name: 'Değişiklikler', value: changes.join('\n') }
      )
      .setTimestamp();

    await this.log(newGuild.id, 'guildUpdate', embed);
  }

  async inviteCreate(invite) {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Davet Oluşturuldu')
      .addFields(
        { name: 'Kod', value: invite.code, inline: true },
        { name: 'Kanal', value: invite.channel?.name || 'Bilinmiyor', inline: true },
        { name: 'Oluşturan', value: invite.inviter?.tag || 'Bilinmiyor', inline: true },
        { name: 'Max Kullanım', value: invite.maxUses ? `${invite.maxUses}` : 'Sınırsız', inline: true }
      )
      .setTimestamp();

    await this.log(invite.guild.id, 'inviteCreate', embed);
  }

  async inviteDelete(invite) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Davet Silindi')
      .addFields(
        { name: 'Kod', value: invite.code, inline: true },
        { name: 'Kanal', value: invite.channel?.name || 'Bilinmiyor', inline: true }
      )
      .setTimestamp();

    await this.log(invite.guild.id, 'inviteDelete', embed);
  }

  getChannelType(type) {
    const types = {
      0: 'Metin Kanalı',
      2: 'Ses Kanalı',
      4: 'Kategori',
      5: 'Duyuru Kanalı',
      13: 'Sahne Kanalı',
      15: 'Forum Kanalı'
    };
    return types[type] || 'Bilinmeyen';
  }
}

module.exports = { LogSystem };
