const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'doğumgünü',
  aliases: ['birthday', 'dogumgunu', 'bday'],
  description: 'Doğum günü sistemini yönetin',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand) {
      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle('🎂 Doğum Günü Sistemi')
        .setDescription('Doğum gününüzü kaydedin ve sunucu sizin için kutlasın!')
        .addFields(
          { name: 'Doğum Günü Ayarla', value: '`!doğumgünü ayarla <gün> <ay>`\nÖrnek: `!doğumgünü ayarla 15 6`', inline: false },
          { name: 'Doğum Günü Sil', value: '`!doğumgünü sil`', inline: false },
          { name: 'Doğum Günümü Gör', value: '`!doğumgünü bak`', inline: false },
          { name: 'Bugünün Doğum Günleri', value: '`!doğumgünü bugün`', inline: false }
        )
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'ayarla' || subCommand === 'set') {
      const day = parseInt(args[1]);
      const month = parseInt(args[2]);
      
      if (!day || !month || day < 1 || day > 31 || month < 1 || month > 12) {
        return message.reply('Geçerli bir tarih girin! Örnek: `!doğumgünü ayarla 15 6` (15 Haziran)');
      }
      
      const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (day > monthDays[month - 1]) {
        return message.reply(`${month}. ayda en fazla ${monthDays[month - 1]} gün var!`);
      }
      
      await storage.setBirthday(message.guild.id, message.author.id, day, month);
      
      const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Doğum Günü Kaydedildi!')
        .setDescription(`Doğum gününüz **${day} ${monthNames[month - 1]}** olarak kaydedildi!`)
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'sil' || subCommand === 'delete' || subCommand === 'remove') {
      const { db } = require('../database/db');
      const { userBirthdays } = require('../../shared/schema');
      const { eq, and } = require('drizzle-orm');
      
      await db.delete(userBirthdays).where(
        and(eq(userBirthdays.guildId, message.guild.id), eq(userBirthdays.userId, message.author.id))
      );
      
      return message.reply('Doğum gününüz silindi!');
    }
    
    if (subCommand === 'bak' || subCommand === 'view' || subCommand === 'gör') {
      const user = message.mentions.users.first() || message.author;
      const birthday = await storage.getBirthday(message.guild.id, user.id);
      
      if (!birthday) {
        return message.reply(user.id === message.author.id 
          ? 'Doğum gününüz henüz kaydedilmemiş! `!doğumgünü ayarla <gün> <ay>` ile kaydedin.'
          : `${user.username} doğum gününü kaydetmemiş!`);
      }
      
      const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      
      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle(`🎂 ${user.username}'in Doğum Günü`)
        .setDescription(`**${birthday.day} ${monthNames[birthday.month - 1]}**`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'bugün' || subCommand === 'today') {
      const birthdays = await storage.getTodaysBirthdays(message.guild.id);
      
      if (birthdays.length === 0) {
        return message.reply('Bugün kimsenin doğum günü yok!');
      }
      
      const users = await Promise.all(birthdays.map(async (b) => {
        try {
          const member = await message.guild.members.fetch(b.userId);
          return member.user.toString();
        } catch {
          return null;
        }
      }));
      
      const validUsers = users.filter(u => u);
      
      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle('🎂 Bugünün Doğum Günleri!')
        .setDescription(validUsers.join('\n') || 'Kullanıcı bulunamadı')
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'kanal' || subCommand === 'channel') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('Bu komutu kullanmak için yetkiniz yok!');
      }
      
      const channel = message.mentions.channels.first();
      if (!channel) {
        return message.reply('Lütfen bir kanal etiketleyin! `!doğumgünü kanal #kanal`');
      }
      
      await storage.upsertBirthdayConfig(message.guild.id, { channelId: channel.id });
      return message.reply(`Doğum günü duyuruları ${channel} kanalına gönderilecek!`);
    }
    
    if (subCommand === 'rol' || subCommand === 'role') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('Bu komutu kullanmak için yetkiniz yok!');
      }
      
      const role = message.mentions.roles.first();
      if (!role) {
        return message.reply('Lütfen bir rol etiketleyin! `!doğumgünü rol @rol`');
      }
      
      await storage.upsertBirthdayConfig(message.guild.id, { roleId: role.id });
      return message.reply(`Doğum günlerinde ${role} rolü verilecek!`);
    }
    
    return message.reply('Geçersiz komut. `!doğumgünü` yazarak kullanılabilir komutları görün.');
  }
};
