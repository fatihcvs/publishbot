const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'otorol',
  aliases: ['autorole', 'autorol'],
  description: 'Yeni üyelere verilecek otomatik rolü ayarlar',
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();
    
    if (subCommand === 'kapat' || subCommand === 'off' || subCommand === 'disable') {
      await storage.upsertGuild(message.guild.id, { autoRole: null });
      return message.reply('Oto-rol sistemi kapatıldı.');
    }
    
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    
    if (!role) {
      const guildData = await storage.getGuild(message.guild.id);
      const currentRole = guildData?.autoRole;
      if (currentRole) {
        const r = message.guild.roles.cache.get(currentRole);
        return message.reply(`Mevcut oto-rol: ${r ? r.name : 'Silinmiş rol'}\n\nDeğiştirmek için: \`!otorol @rol\`\nKapatmak için: \`!otorol kapat\``);
      }
      return message.reply('Lütfen bir rol belirtin: `!otorol @rol`');
    }
    
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply('Bu rolü veremiyorum, çünkü benim rolümden yüksek!');
    }
    
    await storage.upsertGuild(message.guild.id, { autoRole: role.id });
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Oto-Rol Ayarlandı')
      .setDescription(`Yeni üyelere otomatik olarak **${role.name}** rolü verilecek.`)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
