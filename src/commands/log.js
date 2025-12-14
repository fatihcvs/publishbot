const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'log',
  aliases: ['logs', 'kayıt'],
  description: 'Log kanalını ayarlar',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();
    
    if (subCommand === 'kapat' || subCommand === 'off' || subCommand === 'disable') {
      await storage.upsertGuild(message.guild.id, { logChannel: null });
      return message.reply('Log sistemi kapatıldı.');
    }
    
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    
    if (!channel) {
      const guildData = await storage.getGuild(message.guild.id);
      const currentChannel = guildData?.logChannel;
      if (currentChannel) {
        return message.reply(`Mevcut log kanalı: <#${currentChannel}>\n\nDeğiştirmek için: \`!log #kanal\`\nKapatmak için: \`!log kapat\``);
      }
      return message.reply('Lütfen bir kanal belirtin: `!log #kanal`');
    }
    
    await storage.upsertGuild(message.guild.id, { logChannel: channel.id });
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Log Kanalı Ayarlandı')
      .setDescription(`Log mesajları ${channel} kanalına gönderilecek.`)
      .addFields(
        { name: 'Kaydedilen Olaylar', value: '• Üye katılma/ayrılma\n• Mesaj silme/düzenleme\n• Moderasyon işlemleri\n• Rol değişiklikleri\n• Kanal değişiklikleri' }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
