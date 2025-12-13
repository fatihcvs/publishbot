const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'log',
  aliases: ['logs', 'kayıt'],
  description: 'Log kanalını ayarlar',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const subCommand = args[0]?.toLowerCase();
    
    if (!client.config[message.guild.id]) {
      client.config[message.guild.id] = {};
    }
    
    if (subCommand === 'kapat' || subCommand === 'off') {
      delete client.config[message.guild.id].logChannel;
      client.saveConfig();
      return message.reply('Log sistemi kapatıldı.');
    }
    
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    
    if (!channel) {
      const currentChannel = client.config[message.guild.id].logChannel;
      if (currentChannel) {
        return message.reply(`Mevcut log kanalı: <#${currentChannel}>\n\nDeğiştirmek için: \`!log #kanal\`\nKapatmak için: \`!log kapat\``);
      }
      return message.reply('Lütfen bir kanal belirtin: `!log #kanal`');
    }
    
    client.config[message.guild.id].logChannel = channel.id;
    client.saveConfig();
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Log Kanalı Ayarlandı')
      .setDescription(`Log mesajları ${channel} kanalına gönderilecek.`)
      .addFields(
        { name: 'Kaydedilen Olaylar', value: '• Üye katılma/ayrılma\n• Mesaj silme\n• Moderasyon işlemleri' }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
