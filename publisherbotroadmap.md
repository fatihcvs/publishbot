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
- [x] Katılım koşulları (`--rol @rol`, `--seviye N` flag'leri)
- [x] Birden fazla kazanan desteği
- [x] `!çekiliş liste` — aktif çekilişler
- [x] DM ile kazanan bildirimi
- [x] `!çekiliş yeniden <mesaj_id>` — yeniden çekme

### 2.2 Anket Sistemi İyileştirme
- [x] `--anonim` flag — anonim oylama
- [x] `--rol @rol` — rol bazlı oy kısıtı
- [x] `!anket sonuç <id>` — ASCII bar chart ile sonuç embed
- [x] `!anket kapat <id>` — anketi manuel kapat

### 2.3 Etkinlik Yönetimi
- [x] `!etkinlik oluştur <tarih> <HH:MM> "<başlık>" "<açıklama>"` — Discord Scheduled Event
- [x] `!etkinlik liste` — aktif etkinlikler, katılımcı sayısı
- [x] `!etkinlik iptal <id>` — etkinliği iptal et

### 2.4 Özel Komut Builder
- [x] `--embed` flag (embed formatında yanıt)
- [x] `--kanal #kanal` kısıtı
- [x] `!komutekle liste` — tüm özel komutlar
- [x] `!komutekle sil <ad>` — komut sil

### 2.5 Forum Kanalı Yönetimi
- [x] `!forum çözüldü` — başlığa tag ekle + arşivle
- [x] `!forum arşiv <gün>` — eski başlıkları arşivle (bulk)
- [x] `!forum top` — en aktif başlıklar

---

## 🚀 Faz 3 — Otomasyon & Akış Yönetimi

### 3.1 IF-THEN Otomasyon Motoru
- [x] `!otomasyon ekle <ad> <tetikleyici> <aksiyon>` — kural oluştur
- [x] Tetikleyiciler: `uye_katildi`, `uye_ayrildi`, `mesaj_iceriyor:<kelime>`
- [x] Aksiyonlar: `rol_ver`, `rol_al`, `mesaj_gonder`, `dm_gonder`
- [x] Koşullar: `rol_sahibi_mi`, `hesap_yasi_ustu`
- [x] Priority sırası + `!otomasyon aç/kapat/sil/liste`

### 3.2 Gelişmiş Zamanlanmış Mesajlar
- [x] `--embed` flag — embed formatında zamanlanmış mesaj
- [x] `--tek <YYYY-MM-DD HH:MM>` — tek seferlik, gönderilince silinir
- [x] `!zamanlı değiştir <id>` — mesaj düzenleme

### 3.3 Webhook Yönetim Merkezi
- [x] `!webhook ekle <ad> #kanal` — unique key ile receiver oluştur
- [x] `POST /webhooks/:guildId/:key` — public incoming webhook endpoint
- [x] GitHub push/PR/issue otomatik ayrıştırma + embed
- [x] `!webhook şablon <ad>` — `{title}` `{body}` `{url}` `{author}` `{repo}` değişkenleri
- [x] `!webhook liste/sil`

### 3.4 Olay Tabanlı Mesaj Şablonları
- [x] `!şablon hosgeldin/veda/seviyeatlama <metin>` — sistem mesajı özelleştir
- [x] Değişkenler: `{user}` `{username}` `{server}` `{level}` `{member_count}` `{inviter}`
- [x] `!şablon önizle <tür>` — test mesajı ile önizle

---

## 🚀 Faz 4 — Ekonomi & Mağaza Sistemi

### 4.1 Sunucu Mağazası
- [x] `!sunucu-mağaza` — sunucunun özel mağazası (rol/ünvan satın al)
- [x] Rol satın alma (sunucu parası ile)
- [x] Özel ünvan satın alma (nickname prefix)
- [x] Ürün stok limiti (`!mağaza-yönet stok <id> <adet>`)
- [x] `!mağaza-yönet ekle/sil/stok/liste` — moderatör yönetimi

### 4.2 Kumar Oyunları
- [x] `!kumar slot <miktar>` — Slot makinesi (emoji çark + çarpan)
- [x] `!kumar blackjack <miktar>` — Bota karşı 21 oyunu
- [x] `!kumar rulet <miktar> <kırmızı|siyah|0-36>` — Renk/numara bahsi
- [x] `!kumar zar <miktar>` — Bota karşı zar yarışması
- [x] Günlük bahis limiti (5000 coin/gün, anti-farming)

### 4.3 Para Transferi & Vergi
- [x] `!ver @user <miktar>` — Kullanıcıya para gönder
- [x] Transfer vergisi (%5 varsayılan, guilds.modConfig.transferTax)
- [x] Bot'a ve kendine transfer koruması

### 4.4 Sunucu Hazinesi
- [x] Transfer vergisi + kumar kaybından otomatik birikim
- [x] `!hazine` — bakiye ve vergi oranı görüntüleme
- [x] `!hazine ver @user <miktar>` — moderatör ödül dağıtımı

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
