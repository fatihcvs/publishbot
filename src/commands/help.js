const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'yardım',
  aliases: ['help', 'h'],
  description: 'Tüm komutları gösterir',
  async execute(message, args, client) {
    const category = args[0]?.toLowerCase();
    
    if (category === 'mod' || category === 'moderasyon') {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🛡️ Moderasyon Komutları')
        .addFields(
          { name: '!kick @kullanıcı [sebep]', value: 'Kullanıcıyı sunucudan atar' },
          { name: '!ban @kullanıcı [sebep]', value: 'Kullanıcıyı yasaklar' },
          { name: '!unban <id>', value: 'Kullanıcının yasağını kaldırır' },
          { name: '!mute @kullanıcı [süre] [birim]', value: 'Kullanıcıyı susturur' },
          { name: '!unmute @kullanıcı', value: 'Susturmayı kaldırır' },
          { name: '!warn @kullanıcı [sebep]', value: 'Kullanıcıyı uyarır' },
          { name: '!uyarılar @kullanıcı', value: 'Uyarıları listeler' },
          { name: '!uyarısil @kullanıcı', value: 'Tüm uyarıları siler' },
          { name: '!temizle [1-100]', value: 'Mesajları siler' },
          { name: '!lock [#kanal]', value: 'Kanalı kilitler' },
          { name: '!unlock [#kanal]', value: 'Kanal kilidini açar' },
          { name: '!slowmode <saniye>', value: 'Yavaş modu ayarlar' },
          { name: '!vaka [numara]', value: 'Moderasyon vakalarını gösterir' }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    
    if (category === 'ayar' || category === 'ayarlar') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚙️ Ayar Komutları')
        .addFields(
          { name: '!otorol @rol', value: 'Yeni üyelere otomatik rol verir' },
          { name: '!hoşgeldin kanal #kanal', value: 'Hoş geldin kanalını ayarlar' },
          { name: '!hoşgeldin mesaj [mesaj]', value: 'Hoş geldin mesajını ayarlar' },
          { name: '!log #kanal', value: 'Log kanalını ayarlar' },
          { name: '!automod', value: 'AutoMod ayarlarını yönetir' },
          { name: '!otoceza', value: 'Otomatik ceza sistemini yönetir' }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    
    if (category === 'rol') {
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎭 Rol Yönetimi')
        .addFields(
          { name: '!rolekle @kullanıcı @rol', value: 'Kullanıcıya rol ekler' },
          { name: '!rolçıkar @kullanıcı @rol', value: 'Kullanıcıdan rol çıkarır' },
          { name: '!roller', value: 'Sunucudaki rolleri listeler' },
          { name: '!tepkirol oluştur [başlık]', value: 'Tepki rol mesajı oluşturur' },
          { name: '!tepkirol ekle <mesaj_id> <emoji> @rol', value: 'Tepki rolü ekler' },
          { name: '!tepkirol liste', value: 'Tepki rollerini listeler' }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    
    if (category === 'eğlence' || category === 'eglence') {
      const embed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('🎉 Eğlence & Utility')
        .addFields(
          { name: '!çekiliş başlat <süre> <kazanan> <ödül>', value: 'Çekiliş başlatır' },
          { name: '!çekiliş bitir <mesaj_id>', value: 'Çekilişi erken bitirir' },
          { name: '!anket "Soru" "Seçenek1" "Seçenek2"', value: 'Anket oluşturur' },
          { name: '!duyuru [#kanal] <mesaj>', value: 'Duyuru gönderir' },
          { name: '!hatırlat <süre> <mesaj>', value: 'Hatırlatıcı oluşturur' },
          { name: '!afk [sebep]', value: 'AFK durumunu ayarlar' }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Publisher Bot - Komutlar')
      .setDescription('Detaylı yardım için: `!yardım <kategori>`')
      .addFields(
        { name: '🛡️ Moderasyon', value: '`!yardım mod`', inline: true },
        { name: '⚙️ Ayarlar', value: '`!yardım ayar`', inline: true },
        { name: '🎭 Rol Yönetimi', value: '`!yardım rol`', inline: true },
        { name: '🎉 Eğlence', value: '`!yardım eğlence`', inline: true },
        { name: '📝 Özel Komutlar', value: '`!komutekle` `!komutsil` `!komutlar`', inline: false },
        { name: 'ℹ️ Bilgi', value: '`!sunucu` `!kullanıcı` `!avatar` `!ping`', inline: false }
      )
      .setFooter({ text: 'Publisher Bot | Gelişmiş Discord Moderasyon Botu' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
