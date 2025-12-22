const { EmbedBuilder, AuditLogEvent } = require('discord.js');

class LogSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
  }

  async getLogChannel(guildId, logType) {
    const guildData = await this.storage.getGuild(guildId);
    const logConfig = guildData?.logConfig || {};
    const logChannel = guildData?.logChannel;
    
    // Map internal log types to dashboard checkbox names
    const typeMapping = {
      'messageDelete': ['messageDelete'],
      'messageUpdate': ['messageEdit', 'messageUpdate'],
      'channelCreate': ['channelCreate'],
      'channelUpdate': ['channelUpdate'],
      'channelDelete': ['channelDelete'],
      'roleCreate': ['roleCreate'],
      'roleUpdate': ['roleUpdate'],
      'roleDelete': ['roleDelete'],
      'memberJoin': ['memberJoin'],
      'memberLeave': ['memberLeave'],
      'memberUpdate': ['memberRoleAdd', 'memberRoleRemove', 'nicknameChange', 'memberUpdate'],
      'banAdd': ['memberBan', 'banAdd'],
      'banRemove': ['memberUnban', 'banRemove'],
      'voiceActivity': ['voiceJoin', 'voiceLeave', 'voiceMove', 'voiceActivity'],
      'guildUpdate': ['guildUpdate'],
      'inviteCreate': ['invites', 'inviteCreate'],
      'inviteDelete': ['invites', 'inviteDelete']
    };
    
    // Check if any of the mapped types are enabled
    const possibleTypes = typeMapping[logType] || [logType];
    let isEnabled = false;
    let channelId = logChannel;
    
    for (const type of possibleTypes) {
      const setting = logConfig[type];
      // Support both formats: boolean (new) and object with enabled/channel (old)
      if (setting === true) {
        isEnabled = true;
        break;
      } else if (setting && typeof setting === 'object' && setting.enabled) {
        isEnabled = true;
        channelId = setting.channel || logChannel;
        break;
      }
    }
    
    if (!isEnabled || !channelId) return null;
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return null;
    
    return guild.channels.cache.get(channelId);
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
    
    let executor = null;
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelCreate,
        limit: 1
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target.id === channel.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }
    } catch (error) {}

    const channelInfo = this.getChannelDetails(channel);
    
    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('Kanal Oluşturuldu')
      .setDescription(`**#${channel.name}** oluşturuldu${executor ? ` <@${executor.id}> tarafından` : ''}`)
      .addFields(
        { name: 'Kanal Bilgileri', value: channelInfo.join('\n'), inline: true },
        { name: 'Kanal ID', value: `\`${channel.id}\``, inline: true }
      )
      .setFooter({ text: `${channel.guild.name} • ${channel.guild.id}` })
      .setTimestamp();

    await this.log(channel.guild.id, 'channelCreate', embed);
  }

  async channelDelete(channel) {
    if (!channel.guild) return;
    
    let executor = null;
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target.id === channel.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }
    } catch (error) {}

    const channelInfo = this.getChannelDetails(channel);
    
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('Kanal Silindi')
      .setDescription(`**#${channel.name}** silindi${executor ? ` <@${executor.id}> tarafından` : ''}`)
      .addFields(
        { name: 'Kanal Bilgileri', value: channelInfo.join('\n'), inline: true },
        { name: 'Kanal ID', value: `\`${channel.id}\``, inline: true }
      )
      .setFooter({ text: `${channel.guild.name} • ${channel.guild.id}` })
      .setTimestamp();

    await this.log(channel.guild.id, 'channelDelete', embed);
  }

  async channelUpdate(oldChannel, newChannel) {
    if (!newChannel.guild) return;
    
    const hasChanges = 
      oldChannel.name !== newChannel.name ||
      oldChannel.topic !== newChannel.topic ||
      oldChannel.nsfw !== newChannel.nsfw ||
      oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser ||
      oldChannel.bitrate !== newChannel.bitrate ||
      oldChannel.userLimit !== newChannel.userLimit ||
      oldChannel.rtcRegion !== newChannel.rtcRegion ||
      oldChannel.videoQualityMode !== newChannel.videoQualityMode;
    
    if (!hasChanges) return;
    
    let executor = null;
    try {
      const auditLogs = await newChannel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelUpdate,
        limit: 1
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target.id === newChannel.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }
    } catch (error) {}

    const oldInfo = this.getChannelDetailsForUpdate(oldChannel);
    const newInfo = this.getChannelDetailsForUpdate(newChannel, oldChannel);
    
    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('Kanal Güncellendi')
      .setDescription(`**#${newChannel.name}** güncellendi${executor ? ` <@${executor.id}> tarafından` : ''}`)
      .addFields(
        { name: 'Eski Kanal', value: oldInfo.join('\n'), inline: true },
        { name: 'Yeni Kanal', value: newInfo.join('\n'), inline: true }
      )
      .setFooter({ text: `${newChannel.guild.name} • ${newChannel.id}` })
      .setTimestamp();

    await this.log(newChannel.guild.id, 'channelUpdate', embed);
  }
  
  getChannelDetails(channel) {
    const info = [
      `Tür: ${this.getChannelType(channel.type)}`,
      `İsim: #${channel.name}`
    ];
    
    if (channel.topic) info.push(`Konu: ${channel.topic.slice(0, 50)}`);
    if (channel.nsfw !== undefined) info.push(`NSFW: ${channel.nsfw ? 'Evet' : 'Hayır'}`);
    if (channel.rateLimitPerUser) info.push(`Slow Mode: ${channel.rateLimitPerUser} saniye`);
    if (channel.bitrate) info.push(`Bit Rate: ${channel.bitrate / 1000}kbps`);
    if (channel.userLimit !== undefined && channel.userLimit !== null) info.push(`Kullanıcı Limiti: ${channel.userLimit || 'Sınırsız'}`);
    if (channel.rtcRegion !== undefined) info.push(`RTC Bölgesi: ${channel.rtcRegion || 'Otomatik'}`);
    if (channel.videoQualityMode) info.push(`Video Kalitesi: ${channel.videoQualityMode === 1 ? 'Otomatik' : 'Full'}`);
    
    return info;
  }
  
  getChannelDetailsForUpdate(channel, oldChannel = null) {
    const info = [];
    const check = (old, cur, label, value) => {
      const changed = oldChannel && old !== cur;
      return `${changed ? '✅' : ''} ${label}: ${value}`;
    };
    
    info.push(check(oldChannel?.name, channel.name, 'İsim', `#${channel.name}`));
    
    if (channel.topic !== undefined || oldChannel?.topic !== undefined) {
      const topicValue = channel.topic ? channel.topic.slice(0, 50) : 'Yok';
      info.push(check(oldChannel?.topic, channel.topic, 'Konu', topicValue));
    }
    if (channel.bitrate !== undefined) {
      info.push(check(oldChannel?.bitrate, channel.bitrate, 'Bit Rate', `${channel.bitrate / 1000}kbps`));
    }
    if (channel.rateLimitPerUser !== undefined) {
      info.push(check(oldChannel?.rateLimitPerUser, channel.rateLimitPerUser, 'Slow Mode', `${channel.rateLimitPerUser} saniye`));
    }
    if (channel.userLimit !== undefined) {
      info.push(check(oldChannel?.userLimit, channel.userLimit, 'Kullanıcı Limiti', channel.userLimit || 'Sınırsız'));
    }
    if (channel.videoQualityMode !== undefined) {
      info.push(check(oldChannel?.videoQualityMode, channel.videoQualityMode, 'Video Kalitesi', channel.videoQualityMode === 1 ? 'Otomatik' : 'Full'));
    }
    if (channel.rtcRegion !== undefined) {
      info.push(check(oldChannel?.rtcRegion, channel.rtcRegion, 'RTC Bölgesi', channel.rtcRegion || 'Otomatik'));
    }
    if (channel.nsfw !== undefined) {
      info.push(check(oldChannel?.nsfw, channel.nsfw, 'NSFW', channel.nsfw ? 'Evet' : 'Hayır'));
    }
    
    return info;
  }

  async roleCreate(role) {
    let executor = null;
    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleCreate,
        limit: 1
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target.id === role.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }
    } catch (error) {}

    const roleInfo = [
      `Name: ${role.name}`,
      `Color: ${role.hexColor}`,
      `Show in List: ${role.hoist ? 'On' : 'Off'}`,
      `Mentionable: ${role.mentionable ? 'On' : 'Off'}`
    ];

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('Role Created')
      .setDescription(`**${role.name}** was created${executor ? ` by <@${executor.id}>` : ''}`)
      .addFields(
        { name: 'Role Info', value: roleInfo.join('\n'), inline: true },
        { name: 'Role ID', value: `\`${role.id}\``, inline: true }
      )
      .setFooter({ text: `${role.guild.name} • ${role.guild.id}` })
      .setTimestamp();

    await this.log(role.guild.id, 'roleCreate', embed);
  }

  async roleDelete(role) {
    let executor = null;
    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 1
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target.id === role.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }
    } catch (error) {}

    const roleInfo = [
      `Name: ${role.name}`,
      `Color: ${role.hexColor}`,
      `Had ${role.members?.size || 0} members`
    ];

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('Role Deleted')
      .setDescription(`**${role.name}** was deleted${executor ? ` by <@${executor.id}>` : ''}`)
      .addFields(
        { name: 'Role Info', value: roleInfo.join('\n'), inline: true },
        { name: 'Role ID', value: `\`${role.id}\``, inline: true }
      )
      .setFooter({ text: `${role.guild.name} • ${role.guild.id}` })
      .setTimestamp();

    await this.log(role.guild.id, 'roleDelete', embed);
  }

  async roleUpdate(oldRole, newRole) {
    // Check if any tracked properties changed
    const hasChanges = 
      oldRole.name !== newRole.name ||
      oldRole.hexColor !== newRole.hexColor ||
      oldRole.hoist !== newRole.hoist ||
      oldRole.mentionable !== newRole.mentionable ||
      oldRole.icon !== newRole.icon ||
      oldRole.permissions.bitfield !== newRole.permissions.bitfield;
    
    if (!hasChanges) return;

    // Try to get who updated the role from audit logs
    let executor = null;
    try {
      const auditLogs = await newRole.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleUpdate,
        limit: 1
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && logEntry.target.id === newRole.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }
    } catch (error) {
      // Audit log access might be restricted
    }

    // Build old role info
    const oldRoleInfo = [
      `Name: ${oldRole.name}`,
      `icon: ${oldRole.icon ? 'Yes' : 'None'}`,
      `Color: ${oldRole.hexColor}`,
      `Show in List: ${oldRole.hoist ? 'On' : 'Off'}`,
      `Mentionable: ${oldRole.mentionable ? 'On' : 'Off'}`
    ];

    // Build new role info with checkmarks for changes
    const newRoleInfo = [
      `${oldRole.name !== newRole.name ? '✅' : ''} Name: ${newRole.name}`,
      `${oldRole.icon !== newRole.icon ? '✅' : ''} icon: ${newRole.icon ? 'Yes' : 'None'}`,
      `${oldRole.hexColor !== newRole.hexColor ? '🔄' : ''} Color: ${newRole.hexColor}`,
      `${oldRole.hoist !== newRole.hoist ? '✅' : ''} Show in List: ${newRole.hoist ? 'On' : 'Off'}`,
      `${oldRole.mentionable !== newRole.mentionable ? '✅' : ''} Mentionable: ${newRole.mentionable ? 'On' : 'Off'}`
    ];

    const embed = new EmbedBuilder()
      .setColor(newRole.hexColor || '#ffaa00')
      .setTitle('Role Updated')
      .setDescription(`**${newRole.name}** was updated${executor ? ` by <@${executor.id}>` : ''}`)
      .addFields(
        { name: 'Old Role', value: oldRoleInfo.join('\n'), inline: true },
        { name: 'New Role', value: newRoleInfo.join('\n'), inline: true }
      )
      .setFooter({ text: `${newRole.guild.name} • ${newRole.id}` })
      .setTimestamp();

    // Add permission changes if any
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      const addedPerms = newRole.permissions.toArray().filter(p => !oldRole.permissions.has(p));
      const removedPerms = oldRole.permissions.toArray().filter(p => oldRole.permissions.has(p) && !newRole.permissions.has(p));
      
      if (addedPerms.length > 0 || removedPerms.length > 0) {
        let permChanges = '';
        if (addedPerms.length > 0) permChanges += `➕ ${addedPerms.slice(0, 5).join(', ')}${addedPerms.length > 5 ? ` +${addedPerms.length - 5} more` : ''}\n`;
        if (removedPerms.length > 0) permChanges += `➖ ${removedPerms.slice(0, 5).join(', ')}${removedPerms.length > 5 ? ` +${removedPerms.length - 5} more` : ''}`;
        embed.addFields({ name: 'Permission Changes', value: permChanges || 'None' });
      }
    }

    await this.log(newRole.guild.id, 'roleUpdate', embed);
  }

  async messageDelete(message) {
    if (!message.guild || message.author?.bot) return;
    
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setAuthor({ 
        name: message.author?.tag || 'Bilinmiyor', 
        iconURL: message.author?.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle('🗑️ Mesaj Silindi')
      .setDescription(`<@${message.author?.id}> tarafından gönderilen mesaj **silindi**.`)
      .addFields(
        { name: '📍 Kanal', value: `${message.channel}`, inline: true },
        { name: '👤 Kullanıcı ID', value: `\`${message.author?.id || 'Bilinmiyor'}\``, inline: true },
        { name: '📝 İçerik', value: message.content?.slice(0, 1000) || '*İçerik yok veya embed/dosya*' }
      )
      .setFooter({ text: `${message.guild.name} • ${message.guild.id}` })
      .setTimestamp();

    // Check for attachments
    if (message.attachments?.size > 0) {
      const attachmentList = message.attachments.map(a => a.name).join(', ');
      embed.addFields({ name: '📎 Ekler', value: attachmentList });
    }

    await this.log(message.guild.id, 'messageDelete', embed);
  }

  async messageUpdate(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setAuthor({ 
        name: newMessage.author?.tag || 'Bilinmiyor', 
        iconURL: newMessage.author?.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle('✏️ Mesaj Düzenlendi')
      .setDescription(`<@${newMessage.author?.id}> mesajını **düzenledi**. [Mesaja Git](${newMessage.url})`)
      .addFields(
        { name: '📍 Kanal', value: `${newMessage.channel}`, inline: true },
        { name: '👤 Kullanıcı ID', value: `\`${newMessage.author?.id}\``, inline: true },
        { name: '📝 Eski İçerik', value: oldMessage.content?.slice(0, 500) || '*İçerik yok*' },
        { name: '📝 Yeni İçerik', value: newMessage.content?.slice(0, 500) || '*İçerik yok*' }
      )
      .setFooter({ text: `${newMessage.guild.name} • ${newMessage.guild.id}` })
      .setTimestamp();

    await this.log(newMessage.guild.id, 'messageUpdate', embed);
  }

  async guildMemberAdd(member) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    const isNewAccount = accountAge < 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setAuthor({ 
        name: member.user.tag, 
        iconURL: member.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle('📥 Sunucuya Katıldı')
      .setDescription(`<@${member.id}> sunucuya **katıldı**!${isNewAccount ? '\n⚠️ *Yeni hesap!*' : ''}`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${member.user.tag}`, inline: true },
        { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
        { name: '👥 Üye Sayısı', value: `${member.guild.memberCount}`, inline: true },
        { name: '📅 Hesap Oluşturulma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${member.guild.name} • ${member.guild.id}` })
      .setTimestamp();

    await this.log(member.guild.id, 'memberJoin', embed);
  }

  async guildMemberRemove(member) {
    const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.name);
    
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setAuthor({ 
        name: member.user.tag, 
        iconURL: member.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle('📤 Sunucudan Ayrıldı')
      .setDescription(`<@${member.id}> sunucudan **ayrıldı**.`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${member.user.tag}`, inline: true },
        { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
        { name: '👥 Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${member.guild.name} • ${member.guild.id}` })
      .setTimestamp();

    if (roles.length > 0) {
      embed.addFields({ name: '🎭 Sahip Olduğu Roller', value: roles.slice(0, 10).join(', ') + (roles.length > 10 ? ` +${roles.length - 10} daha` : '') });
    }

    await this.log(member.guild.id, 'memberLeave', embed);
  }

  async guildMemberUpdate(oldMember, newMember) {
    const hasNicknameChange = oldMember.nickname !== newMember.nickname;
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    
    if (!hasNicknameChange && addedRoles.size === 0 && removedRoles.size === 0) return;
    
    let executor = null;
    try {
      if (hasNicknameChange) {
        const auditLogs = await newMember.guild.fetchAuditLogs({
          type: AuditLogEvent.MemberUpdate,
          limit: 5
        });
        const logEntry = auditLogs.entries.find(e => 
          e.target.id === newMember.id && 
          Date.now() - e.createdTimestamp < 5000
        );
        if (logEntry) executor = logEntry.executor;
      } else if (addedRoles.size > 0 || removedRoles.size > 0) {
        const auditLogs = await newMember.guild.fetchAuditLogs({
          type: AuditLogEvent.MemberRoleUpdate,
          limit: 5
        });
        const logEntry = auditLogs.entries.find(e => 
          e.target.id === newMember.id && 
          Date.now() - e.createdTimestamp < 5000
        );
        if (logEntry) executor = logEntry.executor;
      }
    } catch (error) {}

    const oldInfo = [];
    const newInfo = [];
    
    oldInfo.push(`Takma Ad: ${oldMember.nickname || 'Yok'}`);
    newInfo.push(`${hasNicknameChange ? '✅' : ''} Takma Ad: ${newMember.nickname || 'Yok'}`);
    
    const oldRoleNames = oldMember.roles.cache.filter(r => r.id !== oldMember.guild.id).map(r => r.name).slice(0, 5);
    const newRoleNames = newMember.roles.cache.filter(r => r.id !== newMember.guild.id).map(r => r.name).slice(0, 5);
    
    if (oldRoleNames.length > 0) oldInfo.push(`Roller: ${oldRoleNames.join(', ')}`);
    if (newRoleNames.length > 0) newInfo.push(`${addedRoles.size > 0 || removedRoles.size > 0 ? '✅' : ''} Roller: ${newRoleNames.join(', ')}`);
    
    if (addedRoles.size > 0) {
      newInfo.push(`➕ Eklenen: ${addedRoles.map(r => r.name).join(', ')}`);
    }
    if (removedRoles.size > 0) {
      newInfo.push(`➖ Kaldırılan: ${removedRoles.map(r => r.name).join(', ')}`);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setAuthor({ 
        name: newMember.user.tag, 
        iconURL: newMember.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle('Üye Güncellendi')
      .setDescription(`<@${newMember.id}> güncellendi${executor ? ` <@${executor.id}> tarafından` : ''}`)
      .addFields(
        { name: 'Eski Bilgiler', value: oldInfo.join('\n') || 'Yok', inline: true },
        { name: 'Yeni Bilgiler', value: newInfo.join('\n') || 'Yok', inline: true }
      )
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${newMember.guild.name} • ${newMember.id}` })
      .setTimestamp();

    await this.log(newMember.guild.id, 'memberUpdate', embed);
  }

  async guildBanAdd(ban) {
    let executor = null;
    let reason = ban.reason;
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanAdd,
        limit: 5
      });
      const logEntry = auditLogs.entries.find(e => 
        e.target.id === ban.user.id && 
        Date.now() - e.createdTimestamp < 10000
      );
      if (logEntry) {
        executor = logEntry.executor;
        reason = logEntry.reason || reason;
      }
    } catch (error) {}

    const userInfo = [
      `Kullanıcı: ${ban.user.tag}`,
      `ID: \`${ban.user.id}\``,
      `Hesap Oluşturma: <t:${Math.floor(ban.user.createdTimestamp / 1000)}:R>`
    ];

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setAuthor({ 
        name: ban.user.tag, 
        iconURL: ban.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle('🔨 Kullanıcı Yasaklandı')
      .setDescription(`<@${ban.user.id}> sunucudan **yasaklandı**${executor ? ` <@${executor.id}> tarafından` : ''}`)
      .addFields(
        { name: 'Kullanıcı Bilgileri', value: userInfo.join('\n'), inline: true },
        { name: 'Yasaklayan', value: executor ? `<@${executor.id}>\n\`${executor.id}\`` : 'Bilinmiyor', inline: true },
        { name: '📝 Sebep', value: reason || 'Belirtilmedi' }
      )
      .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${ban.guild.name} • ${ban.guild.id}` })
      .setTimestamp();

    await this.log(ban.guild.id, 'banAdd', embed);
  }

  async guildBanRemove(ban) {
    let executor = null;
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanRemove,
        limit: 5
      });
      const logEntry = auditLogs.entries.find(e => 
        e.target.id === ban.user.id && 
        Date.now() - e.createdTimestamp < 10000
      );
      if (logEntry) executor = logEntry.executor;
    } catch (error) {}

    const userInfo = [
      `Kullanıcı: ${ban.user.tag}`,
      `ID: \`${ban.user.id}\``,
      `Hesap Oluşturma: <t:${Math.floor(ban.user.createdTimestamp / 1000)}:R>`
    ];

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setAuthor({ 
        name: ban.user.tag, 
        iconURL: ban.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle('✅ Yasak Kaldırıldı')
      .setDescription(`<@${ban.user.id}> yasağı **kaldırıldı**${executor ? ` <@${executor.id}> tarafından` : ''}`)
      .addFields(
        { name: 'Kullanıcı Bilgileri', value: userInfo.join('\n'), inline: true },
        { name: 'Kaldıran', value: executor ? `<@${executor.id}>\n\`${executor.id}\`` : 'Bilinmiyor', inline: true }
      )
      .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${ban.guild.name} • ${ban.guild.id}` })
      .setTimestamp();

    await this.log(ban.guild.id, 'banRemove', embed);
  }

  async voiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member) return;
    
    let title, color, description, channelInfo;
    const guildId = member.guild.id;
    
    if (!oldState.channel && newState.channel) {
      title = '🔊 Kanala Giriş Yapıldı';
      color = '#57F287';
      description = `<@${member.id}> ses kanalına **giriş yaptı**.`;
      channelInfo = `🔊 ${newState.channel.name}`;
    } else if (oldState.channel && !newState.channel) {
      title = '🔇 Kanaldan Çıkış Yapıldı';
      color = '#ED4245';
      description = `<@${member.id}> ses kanalından **çıkış yaptı**.`;
      channelInfo = `🔊 ${oldState.channel.name}`;
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      title = '🔀 Kanal Değiştirildi';
      color = '#FEE75C';
      description = `<@${member.id}> ses kanalını **değiştirdi**.`;
      channelInfo = `🔊 ${oldState.channel.name} ➜ 🔊 ${newState.channel.name}`;
    } else {
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ 
        name: member.user.tag, 
        iconURL: member.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle(title)
      .setDescription(description)
      .addFields(
        { name: '📍 Kanal', value: channelInfo, inline: true },
        { name: '👤 Kullanıcı ID', value: `\`${member.id}\``, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${member.guild.name} • ${guildId}` })
      .setTimestamp();

    await this.log(member.guild.id, 'voiceActivity', embed);
  }

  async guildUpdate(oldGuild, newGuild) {
    const hasChanges = 
      oldGuild.name !== newGuild.name ||
      oldGuild.iconURL() !== newGuild.iconURL() ||
      oldGuild.bannerURL() !== newGuild.bannerURL() ||
      oldGuild.description !== newGuild.description ||
      oldGuild.verificationLevel !== newGuild.verificationLevel ||
      oldGuild.explicitContentFilter !== newGuild.explicitContentFilter ||
      oldGuild.afkChannelId !== newGuild.afkChannelId ||
      oldGuild.afkTimeout !== newGuild.afkTimeout ||
      oldGuild.systemChannelId !== newGuild.systemChannelId;
    
    if (!hasChanges) return;
    
    let executor = null;
    try {
      const auditLogs = await newGuild.fetchAuditLogs({
        type: AuditLogEvent.GuildUpdate,
        limit: 1
      });
      const logEntry = auditLogs.entries.first();
      if (logEntry && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }
    } catch (error) {}

    const verificationLevels = ['Yok', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'];
    const contentFilters = ['Kapalı', 'Rolsüz Üyeler', 'Tüm Üyeler'];
    
    const oldInfo = [
      `İsim: ${oldGuild.name}`,
      `İkon: ${oldGuild.iconURL() ? 'Var' : 'Yok'}`,
      `Afiş: ${oldGuild.bannerURL() ? 'Var' : 'Yok'}`,
      `Doğrulama: ${verificationLevels[oldGuild.verificationLevel] || 'Bilinmiyor'}`,
      `İçerik Filtresi: ${contentFilters[oldGuild.explicitContentFilter] || 'Bilinmiyor'}`
    ];
    
    const newInfo = [
      `${oldGuild.name !== newGuild.name ? '✅' : ''} İsim: ${newGuild.name}`,
      `${oldGuild.iconURL() !== newGuild.iconURL() ? '✅' : ''} İkon: ${newGuild.iconURL() ? 'Var' : 'Yok'}`,
      `${oldGuild.bannerURL() !== newGuild.bannerURL() ? '✅' : ''} Afiş: ${newGuild.bannerURL() ? 'Var' : 'Yok'}`,
      `${oldGuild.verificationLevel !== newGuild.verificationLevel ? '✅' : ''} Doğrulama: ${verificationLevels[newGuild.verificationLevel] || 'Bilinmiyor'}`,
      `${oldGuild.explicitContentFilter !== newGuild.explicitContentFilter ? '✅' : ''} İçerik Filtresi: ${contentFilters[newGuild.explicitContentFilter] || 'Bilinmiyor'}`
    ];
    
    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('Sunucu Ayarları Güncellendi')
      .setDescription(`Sunucu ayarları güncellendi${executor ? ` <@${executor.id}> tarafından` : ''}`)
      .addFields(
        { name: 'Eski Ayarlar', value: oldInfo.join('\n'), inline: true },
        { name: 'Yeni Ayarlar', value: newInfo.join('\n'), inline: true }
      )
      .setThumbnail(newGuild.iconURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${newGuild.name} • ${newGuild.id}` })
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
