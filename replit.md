# Publisher Discord Bot

Dyno benzeri tam donanımlı Discord botu + Web Dashboard.

## Özellikler

### Moderasyon Komutları
- `!kick @kullanıcı [sebep]` - Kullanıcıyı sunucudan atar
- `!ban @kullanıcı [sebep]` - Kullanıcıyı yasaklar
- `!unban <kullanıcı_id>` - Kullanıcının yasağını kaldırır
- `!mute @kullanıcı [süre] [birim] [sebep]` - Kullanıcıyı susturur
- `!unmute @kullanıcı` - Susturmayı kaldırır
- `!warn @kullanıcı [sebep]` - Kullanıcıyı uyarır
- `!uyarılar @kullanıcı` - Uyarıları listeler
- `!uyarısil @kullanıcı` - Tüm uyarıları siler
- `!temizle [sayı]` - Mesajları siler (1-100)
- `!lock [#kanal]` - Kanalı kilitler
- `!unlock [#kanal]` - Kanal kilidini açar
- `!slowmode <saniye>` - Yavaş modu ayarlar
- `!vaka [numara]` - Moderasyon vakalarını gösterir

### Ayar Komutları
- `!otorol @rol` - Yeni üyelere otomatik rol verir
- `!hoşgeldin kanal #kanal` - Hoş geldin kanalını ayarlar
- `!hoşgeldin mesaj [mesaj]` - Hoş geldin mesajını ayarlar
- `!log #kanal` - Log kanalını ayarlar
- `!automod` - AutoMod ayarlarını yönetir
- `!otoceza` - Otomatik ceza sistemini yönetir

### AutoMod Özellikleri
- Spam filtresi
- Büyük harf filtresi
- Kötü kelime filtresi
- Link filtresi
- Discord davet filtresi
- Etiket spam filtresi
- Emoji spam filtresi

### Rol Yönetimi
- `!rolekle @kullanıcı @rol` - Kullanıcıya rol ekler
- `!rolçıkar @kullanıcı @rol` - Kullanıcıdan rol çıkarır
- `!roller` - Sunucudaki rolleri listeler
- `!tepkirol` - Tepki rolleri oluşturur/yönetir

### Özel Komutlar
- `!komutekle <komut> <yanıt>` - Özel komut ekler
- `!komutsil <komut>` - Özel komutu siler
- `!komutlar` - Özel komutları listeler

### Eğlence & Utility
- `!çekiliş başlat <süre> <kazanan> <ödül>` - Çekiliş başlatır
- `!anket "Soru" "Seçenek1" "Seçenek2"` - Anket oluşturur
- `!duyuru [#kanal] <mesaj>` - Duyuru gönderir
- `!hatırlat <süre> <mesaj>` - Hatırlatıcı oluşturur
- `!afk [sebep]` - AFK durumunu ayarlar

### Bilgi Komutları
- `!sunucu` - Sunucu bilgilerini gösterir
- `!kullanıcı @kullanıcı` - Kullanıcı bilgilerini gösterir
- `!avatar @kullanıcı` - Avatarı gösterir
- `!ping` - Bot gecikmesini gösterir
- `!yardım [kategori]` - Tüm komutları gösterir

## Web Dashboard

Web dashboard Discord OAuth2 ile giriş yaparak sunucu ayarlarını yönetmenizi sağlar.

Dashboard özellikleri:
- Genel ayarlar (log kanalı, oto-rol)
- Hoş geldin sistemi ayarları
- AutoMod yapılandırması
- Otomatik ceza kuralları
- Özel komut yönetimi
- Moderasyon log görüntüleyici

Dashboard için gereken environment variables:
- `DISCORD_CLIENT_ID` - Discord uygulama client ID
- `DISCORD_CLIENT_SECRET` - Discord uygulama client secret

## Proje Yapısı

```
├── src/
│   ├── main.js           # Ana giriş noktası (bot + web server)
│   ├── index.js          # Discord bot
│   ├── commands/         # Bot komutları
│   ├── modules/          # AutoMod, AutoPunish, Scheduler
│   ├── database/         # Storage layer (PostgreSQL/JSON fallback)
│   └── web/              # Express web server
│       ├── server.js     # API endpoints
│       └── public/       # Frontend HTML/CSS/JS
├── shared/
│   └── schema.js         # Drizzle ORM schema
├── data/                 # JSON fallback data
└── package.json
```

## Teknolojiler

- Node.js 20
- discord.js v14
- Express.js (web dashboard)
- PostgreSQL + Drizzle ORM (database)
- Passport.js + Discord OAuth2 (authentication)
