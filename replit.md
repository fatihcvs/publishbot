# Publisher Discord Bot

Güçlü ve tam donanımlı Discord moderasyon botu + Web Dashboard.

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

### Zamanlanmış Mesajlar
- `!zamanlı ekle #kanal <dakika> <mesaj>` - Zamanlanmış mesaj ekler
- `!zamanlı sil <id>` - Zamanlanmış mesajı siler
- `!zamanlı liste` - Tüm zamanlanmış mesajları listeler
- `!zamanlı toggle <id>` - Mesajı açar/kapatır

### Lethe Game (Global Hayvan Koleksiyon Oyunu)

**Global Sistem:** Kullanıcı verileri tüm sunucularda paylaşılır. Her sunucu oyunu açıp kapatabilir ama veriler globaldir.

**VIP Sunucu Sistemi (ThePublisher - ID: 291436861082042378):**
- 🎯 **%15 Nadir Hayvan Şansı** - Daha fazla epic/legendary hayvan yakala!
- 💰 **%25 Ekstra Para** - Tüm kazançlarında bonus altın!
- ✨ **%25 Ekstra XP** - Daha hızlı seviye atla!
- 🎁 **%50 Günlük Bonus** - Günlük ödüllerde ekstra para!
- 🛒 **%15 Mağaza İndirimi** - Tüm eşyalarda indirim!
- 🦅 **3 Özel VIP Hayvan** - Publisher's Guardian, Replit Dragon, VIP Phoenix
- 📨 **DM Promosyon Sistemi** - 24 saatte bir VIP sunucu daveti

**Temel Komutlar (Kısa Aliases):**
- `!a` / `!avla` / `!hunt` - Hayvan avla (15 saniye cooldown)
- `!p` / `!bakiye` / `!para` - Para ve taşlarını görüntüle
- `!k` / `!koleksiyon` - Yakaladığın hayvanları görüntüle
- `!t` / `!takım` - Savaş takımını görüntüle
- `!te` / `!takımekle <id>` - Takıma hayvan ekle (max 3)
- `!tc` / `!takımçıkar <slot>` - Takımdan hayvan çıkar
- `!pr` / `!profil [@kullanıcı]` - Oyun profilini görüntüle

**Görev Sistemi:**
- `!görev` / `!quest` - Günlük ve haftalık görevleri görüntüle
- `!görev günlük` - Sadece günlük görevleri göster
- `!görev haftalık` - Sadece haftalık görevleri göster

**Günlük görevler:** İlk Av, Avcı (10 av), Koleksiyoncu (25 av), Savaşçı, Düellocu, Nadir Buluş, Satıcı, Takım Oyuncusu
**Haftalık görevler:** Haftalık Avcı (100 av), Boss Avcısı, PvP Ustası, Epik Buluş, Zengin Ol, Koleksiyon Tamamla, Savaş Lordu

**Ekonomi Sistemi:**
- `!günlük` / `!daily` - Günlük ödülünü al (streak bonusları!)
- `!günlük durum` - Günlük ödül durumunu gör
- `!çalış` / `!work` - Çalışarak para kazan (30dk cooldown)
- `!çalış meslek <meslek>` - Meslek değiştir (hunter/trader/warrior/collector)

**Streak Ödülleri:** Gün 1: 100💰 → Gün 7: 1000💰 + Gümüş Sandık

**Savaş Sistemi (Kısa Aliases):**
- `!s` / `!savaş` - PvE savaşa gir
- `!b` / `!boss` - Boss savaşına katıl (3/3 takım gerekli)
- `!d` / `!düello @kullanıcı` - PvP düello yap

**Ekipman ve Mağaza (Kısa Aliases):**
- `!m` / `!mağaza [kategori]` - Mağazayı görüntüle
- `!al <kategori> <id>` - Eşya satın al
- `!e` / `!envanter` - Envanteri görüntüle
- `!ku` / `!kuşan <hayvan_id> <eşya_id>` - Eşya kuşan
- `!sd` / `!sandık [aç <id>]` - Sandık aç

**Evrim Sistemi:**
- `!evrim <id1> <id2> <id3>` - Aynı türden 3 hayvanı birleştir
- `!evrim taşlar` - Evrim taşlarını görüntüle
- `!evrim bilgi` - Evrim sistemi hakkında bilgi
- `!eğit <id>` - Hayvanı eğit ve güçlendir

**Diğer:**
- `!sat <id>` / `!hayvansat` - Hayvan sat

**Kanal Kontrolü:**
- `!oyunkanal ekle #kanal` - Oyun kanalı ekle
- `!oyunkanal sil #kanal` - Oyun kanalı kaldır
- `!oyunkanal liste` - İzinli kanalları listele
- `!oyunkanal sıfırla` - Tüm kısıtlamaları kaldır

**Nadirlik Seviyeleri:** Common (58%), Uncommon (25%), Rare (10%), Epic (5%), Legendary (1.5%), Mythic (0.4%), Hidden (0.1%)

**103 Hayvan, 5 Boss, 15 Görev, 18 Yetenek, Evrim ve Ekipman Sistemi**

### Doğum Günü Sistemi
- `!doğumgünü ayarla <gün> <ay>` - Doğum gününü kaydetme
- `!doğumgünü sil` - Doğum gününü silme
- `!doğumgünü kanal #kanal` - Kutlama kanalını ayarlama
- `!doğumgünü mesaj <mesaj>` - Kutlama mesajını özelleştirme
- `!doğumgünü liste` - Yaklaşan doğum günlerini görme

### Sosyal Medya Bildirimleri
- `!sosyal ekle <platform> <kullanıcı> #kanal [mesaj]` - Bildirim ekleme
- `!sosyal sil <id>` - Bildirim silme
- `!sosyal liste [platform]` - Bildirimleri listeleme
- `!sosyal toggle <id>` - Bildirimi açma/kapama
- Desteklenen platformlar: Twitch, YouTube, TikTok, Twitter/X, Instagram, RSS

### Araçlar
- `!embed basit/gelişmiş/alan` - Özel embed mesaj oluşturma
- `!anket "Soru" "Seçenek1" "Seçenek2"` - Anket oluşturma (10 seçeneğe kadar)

### Yapay Zeka Özellikleri (GPT-4o & DALL-E 3)
- `@Publisher <mesaj>` - Botu etiketleyerek sohbet edin (çok dilli destek!)
- `!görsel <açıklama>` - DALL-E 3 ile görsel oluşturma
- `!analiz [soru]` - Görselleri yapay zeka ile analiz etme
- `!çevir <dil> <metin>` - 20+ dile çeviri yapma

**Desteklenen Diller:**
Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Felemenkçe (Hollandaca), İtalyanca, Portekizce, Rusça, Japonca, Korece, Çince, Arapça, Lehçe, İsveççe, Norveççe, Fince, Danca, Yunanca, Ukraynaca

### Davet Takibi
- `!davet` / `!invites` - Kendi davet istatistiklerinizi görün
- `!davet @kullanıcı` - Başka birinin davet istatistiklerini görün
- `!davet sıralama` - En çok davet eden kullanıcıları listeler
- Hoş geldin mesajlarında `{inviter}` placeholder'ı ile davet eden kişiyi gösterebilirsiniz

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
- Sosyal medya bildirimleri
- Lethe Game açma/kapama
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
│   │   ├── moderation/   # Moderasyon komutları
│   │   ├── avla.js       # Lethe Game - Hayvan avlama
│   │   ├── birthday.js   # Doğum günü sistemi
│   │   ├── social.js     # Sosyal medya bildirimleri
│   │   ├── poll.js       # Anket sistemi
│   │   └── embed.js      # Embed oluşturucu
│   ├── lethe/            # Lethe Game modülü
│   │   ├── letheStorage.js  # Global oyun veritabanı işlemleri
│   │   └── seedData.js   # Hayvan ve eşya verileri
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
- OpenAI GPT-4o & DALL-E 3 (AI features)
