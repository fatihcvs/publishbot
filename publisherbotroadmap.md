# Publisher Bot — Geliştirme Yol Haritası

> **Son Güncelleme:** 28 Şubat 2026
> Bu belge Publisher Bot'un tüm mevcut özelliklerini, tamamlanan geliştirmeleri ve gelecek planlarını içerir.
> Her büyük güncelleme sonrası bu dosya ve web sitesi birlikte güncellenir.

---

## 📦 Mevcut Özellikler (Tamamlandı)

### 🔨 Moderasyon
- [x] `!kick` — Kullanıcıyı sunucudan at
- [x] `!ban` — Kullanıcıyı yasakla (süre destekli: `!ban @user 7d`)
- [x] `!unban` — Yasağı kaldır
- [x] `!mute` / `!unmute` — Sessizleştir / Sesi aç
- [x] `!uyar` — Uyarı ver (vaka kaydı ile)
- [x] `!uyarılar` — Kullanıcının uyarı geçmişi
- [x] `!temizle` — Toplu mesaj silme
- [x] `!kilitle` / `!aç` — Kanal kilitleme
- [x] `!yavaş` — Slowmode ayarlama
- [x] Moderasyon vakası otomatik ID sistemi
- [x] Otomatik ceza sistemi (uyarı eşiğine göre mute/kick/ban)
- [x] `target.moderatable` kontrolü (bot yetki hatası önleme)

### 🤖 AutoMod
- [x] Spam filtresi (mesaj hızı & tekrar)
- [x] Büyük harf filtresi
- [x] Kötü kelime filtresi (özel liste)
- [x] Link filtresi
- [x] Discord davet filtresi
- [x] Etiket spam filtresi (@everyone / @here)
- [x] Emoji spam filtresi
- [x] Otomatik ceza sistemi (warn → mute → kick → ban)
- [x] Kanal ve rol muafiyeti
- [x] `!automod` ile tüm ayarlar dashboard'dan

### 🔑 Rol Yönetimi
- [x] `!rol ekle/çıkar @user @rol`
- [x] `!roller` — Sunucudaki rol listesi
- [x] Tepki rolleri (reaction roles)
- [x] Oto-rol (yeni üyelere otomatik rol)

### 👋 Hoş Geldin & Veda
- [x] Özel hoş geldin mesajı (embed + değişkenler)
- [x] Veda mesajı
- [x] Oto-rol atama
- [x] Davet eden kişiyi hoş geldin mesajında gösterme

### 📊 Seviye Sistemi
- [x] XP tabanlı seviye sistemi
- [x] Özel Canvas profil & rank kartları
- [x] Seviye rolleri (otomatik atama)
- [x] Haftalık/aylık XP sıralaması
- [x] XP çarpanları (kanal bazlı)
- [x] Sesli kanal XP kazanımı
- [x] `!seviye`, `!lb`, `!top` komutları

### 💰 Ekonomi
- [x] Sunucu parası (server-wide)
- [x] `!günlük` / `!daily` — 7 günlük streak sistemi
- [x] `!çalış` / `!work` — 4 meslek tipi
- [x] `!bakiye`, `!lb para` komutları

### 🎟️ Davet Takibi
- [x] Davet sayısı takibi
- [x] Davet sıralaması
- [x] Kim tarafından davet edildiği hoş geldin mesajında

### 🤖 Yapay Zeka
- [x] GPT-4o sohbet (bot etiketlenince)
- [x] DALL-E 3 görsel oluşturma (`!resim`)
- [x] Görsel analizi (attachment okuma)
- [x] Çeviri (20+ dil, `!çevir`)
- [x] Konuşma hafızası (TTL bazlı temizlik)
- [x] Lazy initialization (API key yoksa sessizce devre dışı)

###  Topluluk & Eğlence
- [x] `!çekiliş` — Çekiliş oluştur / bitir / yeniden çek
- [x] `!anket` — Çok seçenekli, süreli anket
- [x] `!hatırlatıcı` — Kişisel hatırlatıcı
- [x] `!afk` — AFK sistemi
- [x] `!zamanlanmış` — Belirli saatte mesaj gönder
- [x] `!özel-komut` — Sunucuya özel komut ekle
- [x] `!embed` — Embed mesaj oluşturucu
- [x] `!doğumgünü` — Doğum günü sistemi & otomatik kutlama
- [x] `!bilgiyarışması` — Minigame (sunucu para ödüllü)
- [x] `!steam` — Oyun fiyat/bilgi sorgulama
- [x] `!hava` — Hava durumu
- [x] `!kur` — Döviz kuru
- [x] `!film` / `!dizi` — OMDB + TVMaze entegrasyonu
- [x] `!valorant` / `!lol` — Oyun istatistikleri

### 📡 Sosyal Medya Bildirimleri
- [x] YouTube yeni video bildirimi (RSS)
- [x] Reddit yeni post bildirimi (JSON API)
- [x] Twitch'e hazır altyapı (akış kontrol)

### 🛡️ Güvenlik & Anti-Raid
- [x] Hızlı üye akışı tespiti
- [x] Otomatik sunucu kilitleme (doğrulama seviyesi yükseltme)
- [x] Hesap yaşı kontrolü
- [x] Session & helmet güvenliği (CORS, CSP, rate limit)
- [x] İşlenmiş mesaj takip seti (boyut sınırıyla bellek koruması)

### 🌐 Web Dashboard
- [x] Discord OAuth2 girişi
- [x] Sunucu listesi & yönetim sayfası
- [x] Moderasyon ayarları
- [x] AutoMod ayarları
- [x] Seviye / Ekonomi / Rol yönetimi
- [x] Sosyal medya bildirimleri yönetimi
- [x] Embed oluşturucu (dashboard'dan)
- [x] Üye büyüme & mesaj analitik grafikleri (Chart.js)
- [x] Lethe Game sayfası (canlı rehber)

### ⚙️ Admin Paneli (Bot Sahibi)
- [x] Bot istatistikleri & genel bakış
- [x] Sunucu yönetimi (kara liste)
- [x] Kara liste yönetimi
- [x] Toplu duyuru (bot'un bulunduğu sunuculardaki adminlere)
- [x] Redeem Kod yönetimi (oluştur, listele, sil)
- [x] Sunucu snapshot (yedekleme & geri yükleme)
- [x] Premium sunucu yönetimi
- [x] Komut kullanım logları (CSV dışa aktarma)
- [x] Gelişmiş analitik (heatmap, top guild)
- [x] Güvenlik & erişim logları
- [x] Canlı log izleme
- [x] Bot presence yönetimi
- [x] Kullanıcı profil sorgulama & düzenleme

---

## 🚀 Faz 1 — Moderasyon Derinleştirme

### 1.1 Gelişmiş Uyarı Sistemi
- [x] Uyarı **puanı** sistemi (farklı ihlaller farklı puan verir)
- [x] Eşik bazlı otomatik ceza tablosu (`!modconfig` ile özelleştirilebilir)
- [x] Uyarı otomatik sona erme (`!modconfig süre <gün>`, varsayılan: 30 gün)
- [x] Moderatör özel notu (`!warn @user sebep | not` formatı)
- [x] Uyarı geçmişi paginated embed (`!vaka @user`)

### 1.2 Vakalar Arşivi
- [x] Tüm moderasyon vakalarını veritabanında sakla
- [x] `!vaka <id>` — Vaka detayı (mod notu dahil)
- [x] `!vaka @user` — Kullanıcının tüm vakaları (paginated)
- [x] `!vaka istatistik` — Moderatör başına işlem sayısı

### 1.3 AutoMod Gelişmiş Özellikler
- [x] Özel regex filtreleri (`!automod regex ekle/sil/liste`)
- [x] Link whitelist sistemi (`!automod whitelist ekle/sil/liste <domain>`)
- [x] Duplicate mesaj tespiti (`!automod duplikat aç/kapat`)

### 1.4 `!modconfig` Komutu (YENİ)
- [x] Mute/kick/ban eşiği ayarla
- [x] Uyarı sona erme süresi ayarla
- [x] Konfigürasyonu görüntüle / sıfırla

---

## 🚀 Faz 2 — Topluluk & Etkileşim Genişletme

### 2.1 Gelişmiş Çekiliş Sistemi
- [ ] Katılım koşulları (belirli rol, belirli seviye, belirli kanal üyeliği)
- [ ] Birden fazla kazanan desteği
- [ ] Çekiliş geçmişi (son 10 çekiliş)
- [ ] Çekiliş embed'inde anlık katılımcı sayısı güncelleme (button)
- [ ] DM ile kazanan bildirimi

### 2.2 Anket Sistemi İyileştirme
- [ ] Anonim oylama seçeneği
- [ ] Rol bazlı oy hakkı (sadece @Moderatör oy verebilir)
- [ ] Sonuç grafiği (Chart.js tabanlı anket özeti embed)
- [ ] Anket güncelleme (süre uzatma, soru düzenleme)

### 2.3 Etkinlik Yönetimi
- [ ] `!etkinlik oluştur <başlık> <tarih> <açıklama>` — Discord event entegrasyonlu
- [ ] Katılım takibi (gidiyorum / ilgileniyor / gitmiyorum)
- [ ] Hatırlatma DM'i (30 dk önce)
- [ ] Tekrarlayan etkinlik desteği (haftalık toplantı, vb.)
- [ ] Dashboard'dan etkinlik yönetim sayfası

### 2.4 Özel Komut Builder
- [ ] Dashboard'da görsel komut oluşturucu (drag & drop)
- [ ] Tetikleyici koşulları (belirli kanalda, belirli roldeyken)
- [ ] Embed + düz metin + görsel destekli yanıt
- [ ] Komut kullanım istatistiği

### 2.5 Forum Kanalı Yönetimi
- [ ] Forum başlığı açıldığında otomatik tag atama
- [ ] Çözüldü işaretleme (bot komutu ile)
- [ ] Eski forum başlıklarını otomatik arşivleme
- [ ] En aktif forum başlıkları sıralaması

---

## 🚀 Faz 3 — Otomasyon & Akış Yönetimi

### 3.1 IF-THEN Otomasyon Motoru
- [ ] Dashboard'dan görsel kural oluşturucu
- [ ] Tetikleyiciler: Üye katıldı / ayrıldı / seviye atladı / belirli mesaj gönderdi
- [ ] Aksiyonlar: Rol ver/al, mesaj gönder, kanal kilitle, DM gönder
- [ ] Koşullar: Rol sahibi mi, hesap yaşı, seviye eşiği
- [ ] Kural öncelik sırası

### 3.2 Gelişmiş Zamanlanmış Mesajlar
- [ ] Cron expression desteği (`0 9 * * 1` = her Pazartesi 09:00)
- [ ] Embed destekli zamanlanmış mesaj
- [ ] Tekrarlayan mesaj (günlük/haftalık/aylık)
- [ ] Koşullu mesaj (eğer sunucuda X üyeden fazlası varsa gönder)
- [ ] Dashboard'dan zamanlama takvimi görünümü

### 3.3 Webhook Yönetim Merkezi
- [ ] Dashboard'dan webhook oluştur/sil/test et
- [ ] Gelen webhook payload'larını özelleştir (şablon)
- [ ] GitHub push/PR/issue → Discord channel
- [ ] Jira issue → Discord channel
- [ ] Özel HTTP tetikleyiciler (Zapier alternatifi)

### 3.4 Olay Tabanlı Mesaj Şablonları
- [ ] Tüm sistem mesajları (hoş geldin, veda, seviye atlama) dashboard'dan düzenlenebilir
- [ ] Değişkenler: `{user}`, `{server}`, `{level}`, `{inviter}`, `{count}`
- [ ] Emoji + görsel destekli şablonlar

---

## 🚀 Faz 4 — Ekonomi & Mağaza Sistemi

### 4.1 Sunucu Mağazası
- [ ] `!mağaza` — Sunucunun özel mağazası
- [ ] Rol satın alma (sunucu parası ile)
- [ ] Özel ünvan satın alma
- [ ] Ürün stok limiti
- [ ] Dashboard'dan mağaza yönetimi (ürün ekle/çıkar/fiyat düzenle)

### 4.2 Kumar Oyunları
- [ ] `!slot` — Slot makinesi (emojili animasyon)
- [ ] `!blackjack` — Bot'a karşı 21 oyunu
- [ ] `!rulet` — Renk/numara bahsi
- [ ] `!zar` — İki oyunculu zar yarışması
- [ ] Günlük bahis limiti (anti-farming)

### 4.3 Para Transferi & Vergi
- [ ] `!ver @user <miktar>` — Kullanıcıya para gönder
- [ ] Transfer vergisi (configurable, örn. %5 hazineye gider)
- [ ] Sahte transfer koruması (bot'a transfer edilemez)

### 4.4 Sunucu Hazinesi
- [ ] Vergilerden biriken sunucu hazinesi
- [ ] Çekilişlerde sunucu hazinesi ödülü
- [ ] Etkinlik ödülleri için kullanım
- [ ] Şeffaf hazine görüntüleme (`!hazine`)

---

## 🚀 Faz 5 — Müzik Sistemi

### 5.1 Temel Müzik
- [ ] YouTube'dan şarkı çal (`!çal <link/arama>`)
- [ ] Çalma listesi yönetimi (`!sıra`, `!atla`, `!dur`, `!devam`)
- [ ] Ses seviyesi kontrolü
- [ ] Loop modu (tek şarkı / tüm liste)
- [ ] Karıştır (shuffle)

### 5.2 Gelişmiş Müzik
- [ ] Spotify şarkı linki desteği (YouTube'a dönüştür)
- [ ] Spotify çalma listesi import
- [ ] 24/7 mod (sessizlik varsa bile kalmaya devam et)
- [ ] DJ modu (sadece @DJ rolü kontrol edebilir)
- [ ] `!lirik` — Aktif şarkının sözleri

### 5.3 Ses Filtreleri
- [ ] Bas güçlendirme, nightcore, 8D ses efektleri
- [ ] Normalleştirici

---

## 🚀 Faz 6 — Sosyal Medya & Entegrasyon Genişletme

### 6.1 Twitch Bildirimleri
- [ ] Twitch canlı yayın başladı bildirimi
- [ ] Özelleştirilebilir embed (thumbnail, oyun adı, izleyici sayısı)
- [ ] Yayın bitti bildirimi (isteğe bağlı)
- [ ] Çoklu kanal takip desteği

### 6.2 GitHub Entegrasyonu
- [ ] Push / PR / Issue bildirimleri
- [ ] Release bildirimi (yeni sürüm)
- [ ] Dashboard'dan repo ekle/çıkar

### 6.3 RSS Genel Okuyucu
- [ ] Herhangi bir RSS/Atom feed'i Discord kanalına bağla
- [ ] Feed başlığı, özeti ve linki embed olarak gönder
- [ ] Kontrol sıklığı ayarlanabilir (5–60 dakika)

### 6.4 Steam Entegrasyonu Derinleştirme
- [x] Oyun bilgisi & fiyat
- [ ] Oyun fiyat takibi (indirim gelince bildirim)
- [ ] Kullanıcı oyun kütüphanesi özeti
- [ ] Steam indirim haberleri otomatik paylaşım

---

## 🚀 Faz 7 — Dashboard & Admin Panel İyileştirmeleri

### 7.1 Dashboard UX İyileştirmeleri
- [ ] Canlı önizleme — Embed oluştururken sağ tarafta anlık görünüm
- [ ] Komut arama çubuğu (tüm bot komutlarını filtrele)
- [ ] İşlem geçmişi — Son 20 dashboard değişikliği kaydı
- [ ] Ayar şablonları — Başka sunucudan kopyala

### 7.2 Toplu İşlem Araçları
- [ ] Toplu rol atama (listedeki tüm üyelere rol ver)
- [ ] Toplu mesaj silme (konuşmadan X günden eski mesajlar)
- [ ] Toplu kanal oluşturma (şablondan)
- [ ] Ayarları dışa/içe al (JSON format)

### 7.3 Gelişmiş Analitik
- [ ] Komut başına kullanım frekansı grafiği
- [ ] Aktif saat ısı haritası (hangi saatte en aktif)
- [ ] Üye retention analizi (katılım vs. ayrılma oranı)
- [ ] Moderasyon iş yükü analizi (hangi mod en çok işlem yapıyor)
- [ ] Özel tarih aralığı filtresi

### 7.4 Admin Panel Yeni Özellikler
- [ ] Bot ayarları global editörü (tüm sunucular için varsayılan)
- [ ] Sunucu sağlık skoru (aktiflik, mod aktivitesi, kural ihlalleri)
- [ ] Otomatik rapor (haftalık bot kullanım özeti e-posta)
- [ ] API anahtarı yönetim sayfası (kullanıcı token'ı)

---

## 🚀 Faz 8 — Premium Sistem

### 8.1 Premium Plan
- [ ] Premium özellikler tanımlama (müzik, özel komut genişletme, vb.)
- [ ] Premium sunucu işaretleme (admin panelden)
- [ ] Premium sona erme bildirimi (DM + sunucu kanalı)
- [ ] Sunucu bazlı premium (tüm sunucu premium olur)
- [ ] Kullanıcı bazlı premium (kişi hangi sunucuda olursa olsun)

### 8.2 Premium Özellikler Paketi
- [ ] Müzik sistemi (premium)
- [ ] Sınırsız özel komut
- [ ] Gelişmiş Canvas profil temaları
- [ ] Öncelikli destek kanalı erişimi
- [ ] Özel bot prefix

### 8.3 Ödeme & Abonelik Altyapısı
- [ ] Stripe entegrasyonu (kart ile ödeme)
- [ ] Patreon bağlantısı (Patreon üyeliği = premium)
- [ ] Dashboard'da abonelik yönetim sayfası

---

## 🚀 Faz 9 — Güvenlik & Altyapı Sağlamlaştırma

### 9.1 Anti-Cheat & Anti-Abuse
- [ ] Ekonomi farming tespiti (anormal hızda para kazanma)
- [ ] Çoklu hesap tespiti (aynı IP'den gelen farklı kullanıcılar)
- [ ] Hile yapanlar için Lethe ban sistemi
- [ ] Şüpheli işlem loglaması

### 9.2 Yedekleme & Felaket Kurtarma
- [ ] Günlük otomatik DB yedekleme
- [ ] Sunucu ayarları tam snapshot (admin panelden)
- [ ] Tek tıkla geri yükleme
- [ ] Yedek dosyaları şifreli depolama

### 9.3 Performans Optimizasyonu
- [ ] Redis cache katmanı (sık sorgulanan veriler için)
- [ ] Leaderboard önbellekleme (her 5 dakika güncelle)
- [ ] Discord.js shard desteği (10+ sunucuda stabil)
- [ ] N+1 sorgu eliminasyonu (tüm modüllerde tarama)
- [ ] Büyük embed'lerde lazy-load

### 9.4 Hata Takip & İzleme
- [ ] Sentry entegrasyonu (anlık hata bildirimi)
- [ ] Uptime monitörü (bot down olursa Discord'a ping)
- [ ] Command latency ölçümü ve dashboard'da gösterim
- [ ] Detaylı log rotasyonu (günlük dosya)

---

## 🚀 Faz 10 — Yapay Zeka Genişletme

### 10.1 AI Moderasyon
- [ ] OpenAI Moderation API ile otomatik kötü içerik tespiti
- [ ] Nefret söylemi / explicit içerik otomatik silme
- [ ] Şüpheli mesaj moderatöre bildirim

### 10.2 Akıllı Bot Komutları
- [ ] `!önerir` — AI, sunucu kurulumuna göre ayar tavsiye eder
- [ ] `!özet` — Belirli kanalın son N mesajını özetle
- [ ] `!analiz #kanal` — Kanal aktivitesini AI ile değerlendir

### 10.3 Kişiselleştirilmiş AI
- [ ] Kullanıcı bazlı AI kişiliği (her sunucu kendi bot kişiliğini yazabilir)
- [ ] Sistem prompt'u dashboard'dan düzenlenebilir
- [ ] AI yanıt dili auto-detect (kullanıcının dili ne ise o dilde yanıtla)
- [ ] Konuşma geçmişi daha akıllı yönetimi (önemli mesajları hatırla)

### 10.4 AI Görsel Tanıma
- [ ] Karşıya yüklenen görselde NSFW tespiti
- [ ] Logo/metin tanıma (telif ihlal tespitine destek)
- [ ] Görsel içeriği açıklama (erişilebilirlik için alt-text)

---

## 📊 Öncelik Matrisi

| Faz | Konu | Öncelik | Tahmini Süre |
|-----|------|---------|--------------|
| Faz 1 | Moderasyon Derinleştirme | 🔴 Yüksek | 1-2 hafta |
| Faz 2 | Topluluk & Etkileşim | 🔴 Yüksek | 2-3 hafta |
| Faz 3 | Otomasyon & Akış | 🟠 Orta | 3-4 hafta |
| Faz 4 | Ekonomi & Mağaza | 🟠 Orta | 2-3 hafta |
| Faz 5 | Müzik Sistemi | 🟡 Normal | 3-4 hafta |
| Faz 6 | Sosyal Medya & Entegrasyon | 🟡 Normal | 2-3 hafta |
| Faz 7 | Dashboard & Admin | 🔴 Yüksek | 2-4 hafta |
| Faz 8 | Premium Sistem | 🟠 Orta | 4-6 hafta |
| Faz 9 | Güvenlik & Altyapı | 🔴 Yüksek | Sürekli |
| Faz 10 | Yapay Zeka Genişletme | 🟡 Normal | 3-5 hafta |

---

## 🗃️ Versiyon Geçmişi

| Versiyon | Tarih | Ana Değişiklikler |
|----------|-------|-------------------|
| v1.0 | — | Temel moderasyon, rol yönetimi, hoş geldin |
| v1.5 | — | AutoMod, seviye sistemi, davet takibi |
| v2.0 | — | GPT-4o, DALL-E 3, görsel analiz, çeviri |
| v2.5 | — | Web Dashboard, analitik grafikler |
| v3.0 | Ara 2024 | Lethe Game tam entegrasyon (151 hayvan, klan, raid) |
| v3.5 | Ara 2024 | Admin paneli (snapshot, premium, kod yönetimi) |
| v3.6 | Şub 2026 | CSP düzeltmesi, analytics API async, presenceCount |
| v4.0 | Yakında | Mağaza, müzik, IF-THEN otomasyon, premium sistem |

---

## 📝 Notlar

- Bu yol haritası kullanıcı geri bildirimlerine göre güncellenebilir
- Her faz tamamlandığında ilgili satır ✅ olarak işaretlenir
- Yeni özellik talepleri için GitHub issue açın
- Web sitesi `/lethe-game` ve bu dosya büyük güncellemelerde senkron güncellenir

---

*Publisher Bot — Topluluklar için güçlü, esnek ve sürekli büyüyen bir Discord botu* 🚀
