const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'tepkirol',
  aliases: ['reactionrole', 'rr'],
  description: 'Tepki rolü oluşturur',
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const subCommand = args[0]?.toLowerCase();
    
    if (subCommand === 'ekle' || subCommand === 'add') {
      const messageId = args[1];
      const emoji = args[2];
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[3]);
      
      if (!messageId || !emoji || !role) {
        return message.reply('Kullanım: `!tepkirol ekle <mesaj_id> <emoji> @rol`');
      }
      
      try {
        const targetMessage = await message.channel.messages.fetch(messageId);
        await targetMessage.react(emoji);
        
        await storage.addReactionRole(message.guild.id, message.channel.id, messageId, emoji, role.id);
        
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Tepki Rolü Eklendi')
          .addFields(
            { name: 'Emoji', value: emoji, inline: true },
            { name: 'Rol', value: role.name, inline: true }
          )
          .setTimestamp();
        
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.reply('Tepki rolü eklenirken bir hata oluştu! Mesaj ID\'sini kontrol edin.');
      }
      return;
    }
    
    if (subCommand === 'oluştur' || subCommand === 'create') {
      const title = args.slice(1).join(' ') || 'Rol Seçimi';
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(title)
        .setDescription('Aşağıdaki emojilere tıklayarak rol alabilirsiniz.')
        .setTimestamp();
      
      const roleMessage = await message.channel.send({ embeds: [embed] });
      await message.reply(`Tepki rolü mesajı oluşturuldu! Mesaj ID: \`${roleMessage.id}\`\n\nŞimdi \`!tepkirol ekle ${roleMessage.id} <emoji> @rol\` komutuyla roller ekleyebilirsiniz.`);
      return;
    }
    
    if (subCommand === 'liste' || subCommand === 'list') {
      const reactionRoles = await storage.getReactionRoles(message.guild.id);
      
      if (reactionRoles.length === 0) {
        return message.reply('Bu sunucuda tepki rolü bulunmuyor.');
      }
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Tepki Rolleri')
        .setDescription(reactionRoles.map(rr => {
          const role = message.guild.roles.cache.get(rr.roleId);
          return `${rr.emoji} → ${role?.name || 'Silinmiş Rol'} (Mesaj: ${rr.messageId})`;
        }).join('\n'))
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    message.reply('Kullanım:\n`!tepkirol oluştur [başlık]` - Rol seçim mesajı oluşturur\n`!tepkirol ekle <mesaj_id> <emoji> @rol` - Tepki rolü ekler\n`!tepkirol liste` - Tepki rollerini listeler');
  }
};
