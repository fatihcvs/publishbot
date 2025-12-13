const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'çekiliş',
  aliases: ['giveaway', 'cekilis'],
  description: 'Çekiliş oluşturur',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const subCommand = args[0]?.toLowerCase();
    
    if (subCommand === 'başlat' || subCommand === 'start' || subCommand === 'oluştur') {
      const duration = args[1];
      const winners = parseInt(args[2]) || 1;
      const prize = args.slice(3).join(' ');
      
      if (!duration || !prize) {
        return message.reply('Kullanım: `!çekiliş başlat <süre> <kazanan_sayısı> <ödül>`\nÖrnek: `!çekiliş başlat 1h 2 Discord Nitro`');
      }
      
      const timeMatch = duration.match(/^(\d+)([smhd])$/i);
      if (!timeMatch) {
        return message.reply('Geçersiz süre! Örnek: 30m, 1h, 1d');
      }
      
      const amount = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      
      let ms;
      switch (unit) {
        case 's': ms = amount * 1000; break;
        case 'm': ms = amount * 60 * 1000; break;
        case 'h': ms = amount * 60 * 60 * 1000; break;
        case 'd': ms = amount * 24 * 60 * 60 * 1000; break;
      }
      
      const endsAt = new Date(Date.now() + ms);
      
      const embed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('🎉 Çekiliş!')
        .setDescription(`**Ödül:** ${prize}\n**Kazanan Sayısı:** ${winners}\n**Bitiş:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`)
        .addFields({ name: 'Katılmak için', value: '🎉 tepkisine tıklayın!' })
        .setFooter({ text: `${message.author.tag} tarafından`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      const giveawayMessage = await message.channel.send({ embeds: [embed] });
      await giveawayMessage.react('🎉');
      
      const giveaway = await storage.createGiveaway(
        message.guild.id,
        message.channel.id,
        prize,
        winners,
        endsAt,
        message.author.id
      );
      
      await storage.updateGiveaway(giveaway.id, { messageId: giveawayMessage.id });
      
      await message.delete().catch(() => {});
      return;
    }
    
    if (subCommand === 'bitir' || subCommand === 'end') {
      const messageId = args[1];
      if (!messageId) {
        return message.reply('Kullanım: `!çekiliş bitir <mesaj_id>`');
      }
      
      const giveaways = await storage.getActiveGiveaways();
      const giveaway = giveaways.find(g => g.messageId === messageId);
      
      if (!giveaway) {
        return message.reply('Çekiliş bulunamadı!');
      }
      
      await storage.updateGiveaway(giveaway.id, { endsAt: new Date() });
      return message.reply('Çekiliş bitirilecek!');
    }
    
    message.reply('Kullanım:\n`!çekiliş başlat <süre> <kazanan_sayısı> <ödül>`\n`!çekiliş bitir <mesaj_id>`');
  }
};
