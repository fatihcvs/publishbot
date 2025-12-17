const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'zamanlı',
  aliases: ['schedule', 'zamanli', 'otomesaj', 'autosend'],
  description: 'Zamanlanmış mesajları yönetir',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'ekle' || subCommand === 'add') {
      const channel = message.mentions.channels.first();
      if (!channel) {
        return message.reply('Kullanım: `!zamanlı ekle #kanal <dakika> <mesaj>`\nÖrnek: `!zamanlı ekle #duyurular 60 Sunucumuza hoş geldiniz!`');
      }

      const intervalStr = args[2];
      const interval = parseInt(intervalStr);
      
      if (!interval || interval < 1 || interval > 10080) {
        return message.reply('Geçerli bir aralık belirtin! (1-10080 dakika arası, max 1 hafta)');
      }

      const messageContent = args.slice(3).join(' ');
      if (!messageContent) {
        return message.reply('Lütfen gönderilecek mesajı belirtin!');
      }

      try {
        const scheduled = await storage.addScheduledMessage(
          message.guild.id,
          channel.id,
          messageContent,
          interval,
          message.author.id
        );

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Zamanlanmış Mesaj Eklendi')
          .addFields(
            { name: 'Kanal', value: channel.toString(), inline: true },
            { name: 'Aralık', value: `${interval} dakika`, inline: true },
            { name: 'ID', value: `#${scheduled.id}`, inline: true },
            { name: 'Mesaj', value: messageContent.substring(0, 200) + (messageContent.length > 200 ? '...' : '') }
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Zamanlanmış mesaj ekleme hatası:', error);
        return message.reply('Mesaj eklenirken bir hata oluştu!');
      }
    }

    if (subCommand === 'sil' || subCommand === 'delete' || subCommand === 'remove') {
      const id = parseInt(args[1]);
      if (!id) {
        return message.reply('Kullanım: `!zamanlı sil <id>`');
      }

      try {
        await storage.deleteScheduledMessage(id);
        return message.reply(`✅ Zamanlanmış mesaj #${id} silindi!`);
      } catch (error) {
        console.error('Zamanlanmış mesaj silme hatası:', error);
        return message.reply('Mesaj silinirken bir hata oluştu!');
      }
    }

    if (subCommand === 'liste' || subCommand === 'list') {
      const messages = await storage.getScheduledMessages(message.guild.id);
      
      if (messages.length === 0) {
        return message.reply('Bu sunucuda zamanlanmış mesaj bulunmuyor.');
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📅 Zamanlanmış Mesajlar')
        .setDescription(
          messages.map(m => {
            const channel = message.guild.channels.cache.get(m.channelId);
            const status = m.enabled ? '🟢' : '🔴';
            return `${status} **#${m.id}** - ${channel || 'Bilinmeyen Kanal'}\n└ Her ${m.intervalMinutes} dakikada: "${m.message.substring(0, 50)}${m.message.length > 50 ? '...' : ''}"`;
          }).join('\n\n')
        )
        .setFooter({ text: `Toplam ${messages.length} zamanlanmış mesaj` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'toggle' || subCommand === 'aç' || subCommand === 'kapat') {
      const id = parseInt(args[1]);
      if (!id) {
        return message.reply('Kullanım: `!zamanlı toggle <id>`');
      }

      try {
        const messages = await storage.getScheduledMessages(message.guild.id);
        const msg = messages.find(m => m.id === id);
        
        if (!msg) {
          return message.reply('Bu ID ile zamanlanmış mesaj bulunamadı!');
        }

        await storage.toggleScheduledMessage(id, !msg.enabled);
        const status = !msg.enabled ? 'açıldı' : 'kapatıldı';
        return message.reply(`✅ Zamanlanmış mesaj #${id} ${status}!`);
      } catch (error) {
        console.error('Toggle hatası:', error);
        return message.reply('İşlem sırasında bir hata oluştu!');
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📅 Zamanlanmış Mesaj Sistemi')
      .setDescription('Belirlediğiniz aralıklarla otomatik mesaj gönderin!')
      .addFields(
        { name: '!zamanlı ekle #kanal <dakika> <mesaj>', value: 'Yeni zamanlanmış mesaj ekler', inline: false },
        { name: '!zamanlı sil <id>', value: 'Zamanlanmış mesajı siler', inline: false },
        { name: '!zamanlı liste', value: 'Tüm zamanlanmış mesajları listeler', inline: false },
        { name: '!zamanlı toggle <id>', value: 'Mesajı açar/kapatır', inline: false }
      )
      .setFooter({ text: 'Minimum 1 dakika, maksimum 10080 dakika (1 hafta)' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
