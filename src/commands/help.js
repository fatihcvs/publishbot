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
          { name: '!hoşçakal kanal #kanal', value: 'Hoşçakal kanalını ayarlar' },
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

    if (category === 'ekonomi' || category === 'economy') {
      const embed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('💰 Ekonomi Komutları')
        .addFields(
          { name: '!para [@kullanıcı]', value: 'Bakiyenizi veya başka birinin bakiyesini görüntüler' },
          { name: '!günlük', value: 'Günlük ödülünüzü alın (24 saatte bir)' },
          { name: '!çalış', value: 'Çalışarak para kazanın (30 dakikada bir)' },
          { name: '!banka yatır <miktar>', value: 'Bankaya para yatırın' },
          { name: '!banka çek <miktar>', value: 'Bankadan para çekin' },
          { name: '!mağaza', value: 'Sunucu mağazasını görüntüleyin' },
          { name: '!satınal <ürün_id>', value: 'Mağazadan ürün satın alın' },
          { name: '!mağaza ekle <isim> <fiyat> [@rol]', value: 'Mağazaya ürün ekleyin (Yönetici)' }
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
          { name: '!afk [sebep]', value: 'AFK durumunu ayarlar' },
          { name: '!doğumgünü ayarla <gün> <ay>', value: 'Doğum gününüzü kaydedin' },
          { name: '!doğumgünü bugün', value: 'Bugünün doğum günlerini görün' }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (category === 'seviye' || category === 'level') {
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('📈 Seviye Sistemi')
        .addFields(
          { name: '!seviye [@kullanıcı]', value: 'Seviye ve XP bilgilerinizi görün' },
          { name: '!sıralama', value: 'Sunucu XP sıralamasını görün' },
          { name: '!seviyerol ekle <seviye> @rol', value: 'Seviye ödülü ekleyin (Yönetici)' },
          { name: '!seviyerol liste', value: 'Seviye ödüllerini listeleyin' },
          { name: '!başarımlar', value: 'Başarımlarınızı görüntüleyin' }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (category === 'ai' || category === 'yapay' || category === 'yapay zeka') {
      const embed = new EmbedBuilder()
        .setColor('#00d4ff')
        .setTitle('🤖 Yapay Zeka Komutları')
        .setDescription('GPT-4o ve DALL-E 3 ile desteklenen gelişmiş AI özellikleri!')
        .addFields(
          { name: '@Publisher <mesaj>', value: 'Botu etiketleyerek sohbet edin. Hangi dilde yazarsanız o dilde yanıt verir!' },
          { name: '!görsel <açıklama>', value: 'DALL-E 3 ile görsel oluşturun\nÖrnek: `!görsel güneş batımında sahilde yürüyen kedi`' },
          { name: '!analiz [soru]', value: 'Görselleri analiz edin (görsel ekleyin veya yanıtlayın)' },
          { name: '!çevir <dil> <metin>', value: '20+ dile çeviri yapın\nÖrnek: `!çevir en Merhaba!`' }
        )
        .addFields(
          { name: '🌐 Desteklenen Diller', value: '🇹🇷 Türkçe, 🇬🇧 İngilizce, 🇩🇪 Almanca, 🇫🇷 Fransızca, 🇪🇸 İspanyolca, 🇳🇱 Felemenkçe, 🇮🇹 İtalyanca, 🇵🇹 Portekizce, 🇷🇺 Rusça, 🇯🇵 Japonca, 🇰🇷 Korece, 🇨🇳 Çince ve daha fazlası...', inline: false }
        )
        .setFooter({ text: 'OpenAI GPT-4o & DALL-E 3 ile desteklenmektedir' })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (category === 'lethe' || category === 'oyun' || category === 'game') {
      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('🎮 Lethe Game Komutları')
        .setDescription('Publisher Bot\'un hayvan koleksiyon oyunu! `publisherbot.org/lethe-game` → Tam rehber')
        .addFields(
          {
            name: '🏹 Avlanma & Koleksiyon',
            value: [
              '`!avla` / `!a` — Hayvan avla (15sn)',
              '`!koleksiyon` / `!k` — Koleksiyonunu gör',
              '`!sezon` — Aktif sezonu gör',
              '`!sezon tüm` — Tüm sezon hayvanları',
              '`!ad <id> <isim>` — Hayvana isim ver',
              '`!sat <id>` / `!sat hepsi` — Hayvan sat',
            ].join('\n'),
            inline: false
          },
          {
            name: '🗺️ Bölge & Profil',
            value: [
              '`!bölge` — Mevcut bölgeni gör',
              '`!bölge git <isim>` — Bölge değiştir',
              '`!profil` / `!pr` — Oyun profilini gör',
              '`!bakiye` / `!p` — Altın ve taşlar',
            ].join('\n'),
            inline: false
          },
          {
            name: '⚔️ Savaş & Boss',
            value: [
              '`!savaş` / `!s` — PvE savaş',
              '`!boss` / `!b` — Boss savaşı (3/3 takım)',
              '`!düello @kişi` / `!d` — PvP düello',
              '`!raid başlat <boss>` — Co-op raid',
              '`!raid katıl` · `!raid saldır`',
            ].join('\n'),
            inline: false
          },
          {
            name: '👥 Takım',
            value: [
              '`!takım` / `!t` — Takımı gör',
              '`!takımekle <id>` / `!te` — Ekle',
              '`!takımçıkar <slot>` / `!tc` — Çıkar',
            ].join('\n'),
            inline: true
          },
          {
            name: '🛡️ Klan',
            value: [
              '`!klan kur <isim> <etiket>`',
              '`!klan katıl <etiket>`',
              '`!klan bilgi` · `!klan üyeler`',
              '`!klan sırala`',
            ].join('\n'),
            inline: true
          },
          {
            name: '💰 Ekonomi & Mağaza',
            value: [
              '`!günlük` — Günlük ödül (streak!)',
              '`!çalış` — Para kazan (30dk)',
              '`!mağaza` / `!m` — Mağazayı gör',
              '`!al <kategori> <id>` — Eşya al',
              '`!envanter` / `!e` — Envanteri gör',
              '`!kuşan <hayvan> <eşya>` — Ekipman tak',
              '`!sandık [aç <id>]` — Sandık aç',
            ].join('\n'),
            inline: false
          },
          {
            name: '📊 İstatistik & Sıralama',
            value: [
              '`!siralama coins/level/hunts` — Sıralama',
              '`!başarım` / `!achievement` — Başarımlar',
              '`!görev` — Günlük/haftalık görevler',
              '`!etkinlik` — Aktif etkinlikler',
            ].join('\n'),
            inline: false
          },
          {
            name: '⚗️ Evrim & Eğitim',
            value: [
              '`!evrim <id1> <id2> <id3>` — 3 hayvanı birleştir',
              '`!eğit <id>` — Hayvanı eğit (1saat)',
              '`!takas @kişi hayvan:<id>` — Takas teklifi',
              '`!hediye @kişi <miktar>` — Hediye gönder',
            ].join('\n'),
            inline: false
          }
        )
        .setFooter({ text: '📖 Tam rehber: publisherbot.org/lethe-game' })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (category === 'istatistik' || category === 'stat') {
      const embed = new EmbedBuilder()
        .setColor('#1b2838')
        .setTitle('📊 İstatistik & Oyun Komutları')
        .setDescription('Steam, Valorant, LOL istatistikleri ve film/dizi bilgileri')
        .addFields(
          { name: '!steam <Oyun Adı>', value: 'Steam\'de oyun arar — fiyat, puan, tür, yayın tarihi' },
          { name: '!valorant <Ad#TAG> [bölge]', value: 'Valorant rank ve istatistikler (bölgeler: eu na ap kr br)' },
          { name: '!lol <Ad#TAG> [bölge]', value: 'League of Legends Solo/Flex rank ve WR bilgisi' },
          { name: '!film <Ad>', value: 'Film bilgisi: IMDB puan, oyuncular, özet' },
          { name: '!dizi <Ad>', value: 'Dizi bilgisi: sezon, platform, durum, puan' }
        )
        .setFooter({ text: 'Steam Store API · HenrikDev · Riot Games API · OMDB/TVMaze' })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Publisher Bot — Komutlar')
      .setDescription('Detaylı yardım için: `!yardım <kategori>`')
      .addFields(
        { name: '🛡️ Moderasyon', value: '`!yardım mod`', inline: true },
        { name: '⚙️ Ayarlar', value: '`!yardım ayar`', inline: true },
        { name: '🎭 Rol Yönetimi', value: '`!yardım rol`', inline: true },
        { name: '💰 Ekonomi', value: '`!yardım ekonomi`', inline: true },
        { name: '📈 Seviye', value: '`!yardım seviye`', inline: true },
        { name: '🎉 Eğlence', value: '`!yardım eğlence`', inline: true },
        { name: '🤖 Yapay Zeka', value: '`!yardım ai`', inline: true },
        { name: '📊 İstatistik', value: '`!yardım stat`', inline: true },
        { name: '🎮 Lethe Game', value: '`!yardım lethe`', inline: true },
        { name: '📝 Özel Komutlar', value: '`!komutekle` `!komutsil` `!komutlar`', inline: false },
        { name: '👀 Bilgi', value: '`!sunucu` `!kullanıcı` `!avatar` `!ping`', inline: false }
      )
      .setFooter({ text: 'Publisher Bot | Dashboard: publisherbot.org' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
