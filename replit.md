# Publisher Discord Bot

Dyno benzeri özelliklere sahip kapsamlı bir Discord botu.

## Özellikler

### Moderasyon Komutları
- `!kick @kullanıcı [sebep]` - Kullanıcıyı sunucudan atar
- `!ban @kullanıcı [sebep]` - Kullanıcıyı yasaklar
- `!unban <kullanıcı_id>` - Kullanıcının yasağını kaldırır
- `!mute @kullanıcı [süre] [birim] [sebep]` - Kullanıcıyı susturur
- `!unmute @kullanıcı` - Susturmayı kaldırır
- `!warn @kullanıcı [sebep]` - Kullanıcıyı uyarır
- `!uyarılar @kullanıcı` - Uyarıları listeler
- `!temizle [sayı]` - Mesajları siler (1-100)

### Ayar Komutları
- `!otorol @rol` - Yeni üyelere otomatik rol verir
- `!hoşgeldin kanal #kanal` - Hoş geldin kanalını ayarlar
- `!hoşgeldin mesaj [mesaj]` - Hoş geldin mesajını ayarlar
- `!log #kanal` - Log kanalını ayarlar

### Rol Yönetimi
- `!rolekle @kullanıcı @rol` - Kullanıcıya rol ekler
- `!rolçıkar @kullanıcı @rol` - Kullanıcıdan rol çıkarır
- `!roller` - Sunucudaki rolleri listeler

### Özel Komutlar
- `!komutekle <komut> <yanıt>` - Özel komut ekler
- `!komutsil <komut>` - Özel komutu siler
- `!komutlar` - Özel komutları listeler

### Bilgi Komutları
- `!sunucu` - Sunucu bilgilerini gösterir
- `!kullanıcı @kullanıcı` - Kullanıcı bilgilerini gösterir
- `!avatar @kullanıcı` - Avatarı gösterir
- `!ping` - Bot gecikmesini gösterir
- `!yardım` - Tüm komutları gösterir

## Kurulum

1. Discord Developer Portal'dan bot oluşturun
2. Bot token'ını `DISCORD_BOT_TOKEN` olarak ayarlayın
3. Botu sunucunuza davet edin (Administrator yetkisi önerilir)

## Proje Yapısı

```
├── src/
│   ├── index.js          # Ana bot dosyası
│   └── commands/          # Komut dosyaları
├── data/                  # Yapılandırma verileri (JSON)
└── package.json           # Proje bağımlılıkları
```

## Teknolojiler

- Node.js 20
- discord.js v14
