const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'temizle',
  aliases: ['clear', 'purge', 'sil'],
  description: 'Belirtilen sayıda mesajı siler',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args, client) {
    const amount = parseInt(args[0]);
    
    if (!amount || amount < 1 || amount > 100) {
      return message.reply('Lütfen 1-100 arasında bir sayı belirtin!');
    }
    
    try {
      await message.delete();
      const deleted = await message.channel.bulkDelete(amount, true);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Mesajlar Silindi')
        .setDescription(`${deleted.size} mesaj silindi.`)
        .setTimestamp();
      
      const reply = await message.channel.send({ embeds: [embed] });
      setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (error) {
      console.error(error);
      message.channel.send('Mesajlar silinirken bir hata oluştu!');
    }
  }
};
