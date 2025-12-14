const { EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'talep',
  aliases: ['ticket', 'destek'],
  description: 'Destek talebi oluşturur veya yönetir',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'kur' || subCommand === 'setup') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('Bu komutu kullanmak için sunucu yönetme yetkisine sahip olmalısın!');
      }

      const category = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      const supportRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

      if (!category) {
        return message.reply('Kullanım: `!talep kur #kategori @destek-rolü`');
      }

      await storage.upsertGuild(message.guild.id, {
        ticketCategory: category.id,
        ticketSupportRole: supportRole?.id || null
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎫 Destek Talebi Oluştur')
        .setDescription('Destek almak için aşağıdaki butona tıklayın.\nBir yetkili en kısa sürede size yardımcı olacaktır.')
        .setFooter({ text: 'Publisher Bot - Talep Sistemi' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Talep Oluştur')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );

      await message.channel.send({ embeds: [embed], components: [row] });
      return message.reply('Talep sistemi kuruldu!');
    }

    if (subCommand === 'kapat' || subCommand === 'close') {
      const ticketChannel = message.channel;
      if (!ticketChannel.name.startsWith('talep-')) {
        return message.reply('Bu komut sadece talep kanallarında kullanılabilir!');
      }

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Talep Kapatıldı')
        .setDescription(`Bu talep ${message.author.tag} tarafından kapatıldı.`)
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      
      setTimeout(async () => {
        try {
          await ticketChannel.delete();
        } catch (err) {
          console.error('Talep kanalı silinirken hata:', err);
        }
      }, 5000);

      return;
    }

    // Yeni talep oluştur
    const guildData = await storage.getGuild(message.guild.id);
    if (!guildData?.ticketCategory) {
      return message.reply('Talep sistemi henüz kurulmamış! Bir yetkili `!talep kur` komutunu kullanmalı.');
    }

    const existingTicket = message.guild.channels.cache.find(
      c => c.name === `talep-${message.author.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    );

    if (existingTicket) {
      return message.reply(`Zaten açık bir talebin var: ${existingTicket}`);
    }

    const subject = args.join(' ') || 'Genel Destek';

    try {
      const ticketChannel = await message.guild.channels.create({
        name: `talep-${message.author.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        type: ChannelType.GuildText,
        parent: guildData.ticketCategory,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: message.author.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          },
          ...(guildData.ticketSupportRole ? [{
            id: guildData.ticketSupportRole,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }] : [])
        ]
      });

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎫 Yeni Destek Talebi')
        .addFields(
          { name: 'Kullanıcı', value: message.author.tag, inline: true },
          { name: 'Konu', value: subject, inline: true }
        )
        .setDescription('Lütfen sorununuzu detaylı bir şekilde açıklayın.\nBir yetkili en kısa sürede size yardımcı olacaktır.\n\nTalebi kapatmak için: `!talep kapat`')
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Talebi Kapat')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );

      await ticketChannel.send({ 
        content: `${message.author}${guildData.ticketSupportRole ? ` <@&${guildData.ticketSupportRole}>` : ''}`,
        embeds: [embed], 
        components: [row] 
      });

      message.reply(`Talebin oluşturuldu: ${ticketChannel}`);
    } catch (error) {
      console.error('Talep oluşturulurken hata:', error);
      message.reply('Talep oluşturulurken bir hata oluştu!');
    }
  }
};
