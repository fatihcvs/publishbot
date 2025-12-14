const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  name: 'geçicises',
  aliases: ['tempvoice', 'gecicises', 'tempvc'],
  description: 'Geçici ses kanalları sistemini yönetir',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'kur' || subCommand === 'setup') {
      const category = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!category || category.type !== ChannelType.GuildCategory) {
        return message.reply('Lütfen bir kategori belirtin! Kullanım: `!geçicises kur <kategori_id>`');
      }

      // Ana ses kanalını oluştur
      const triggerChannel = await message.guild.channels.create({
        name: '➕ Oda Oluştur',
        type: ChannelType.GuildVoice,
        parent: category.id
      });

      await storage.upsertGuild(message.guild.id, { 
        tempVoiceChannel: triggerChannel.id,
        tempVoiceCategory: category.id
      });

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Geçici Ses Kanalları Kuruldu')
        .setDescription(`Kullanıcılar ${triggerChannel} kanalına katıldığında otomatik olarak kendi ses odalarını oluşturacaklar.`)
        .addFields(
          { name: 'Tetikleyici Kanal', value: `${triggerChannel}`, inline: true },
          { name: 'Kategori', value: `${category.name}`, inline: true }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'kapat' || subCommand === 'disable') {
      const guildData = await storage.getGuild(message.guild.id);
      
      if (guildData?.tempVoiceChannel) {
        const channel = message.guild.channels.cache.get(guildData.tempVoiceChannel);
        if (channel) await channel.delete().catch(() => {});
      }

      await storage.upsertGuild(message.guild.id, { 
        tempVoiceChannel: null,
        tempVoiceCategory: null
      });

      return message.reply('Geçici ses kanalları sistemi kapatıldı!');
    }

    // Yardım
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🔊 Geçici Ses Kanalları')
      .setDescription('Kullanıcıların kendi ses odalarını oluşturmasına izin verin!')
      .addFields(
        { name: '!geçicises kur <kategori>', value: 'Sistemi kurar' },
        { name: '!geçicises kapat', value: 'Sistemi kapatır' }
      )
      .setFooter({ text: 'Kullanıcılar tetikleyici kanala katıldığında otomatik oda oluşturulur' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
