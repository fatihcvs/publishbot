# Publisher Bot - Geliştirme Yol Haritası

Bu dosya, Publisher Discord botunun temel özelliklerinin gelişimi için planlanmış iyileştirmeleri ve yeni özellikleri içerir.

---

## Mevcut Özellikler (Tamamlandı)

### Moderasyon
- [x] Kick, Ban, Unban komutları
- [x] Mute/Unmute sistemi
- [x] Uyarı sistemi
- [x] Mesaj temizleme
- [x] Kanal kilitleme
- [x] Slowmode ayarlama
- [x] Moderasyon vaka takibi

### AutoMod
- [x] Spam filtresi
- [x] Büyük harf filtresi
- [x] Kötü kelime filtresi
- [x] Link filtresi
- [x] Discord davet filtresi
- [x] Etiket spam filtresi
- [x] Emoji spam filtresi
- [x] Otomatik ceza sistemi

### Rol Yönetimi
- [x] Rol ekleme/çıkarma
- [x] Rol listesi
- [x] Tepki rolleri

### Hoş Geldin Sistemi
- [x] Hoş geldin kanalı ayarlama
- [x] Özel hoş geldin mesajı
- [x] Veda mesajı
- [x] Oto-rol atama

### Davet Takibi
- [x] Davet sayısı takibi
- [x] Davet sıralaması
- [x] Hoş geldin mesajında davet eden gösterme

### Yapay Zeka
- [x] GPT-4o sohbet (etiketleme ile)
- [x] DALL-E 3 görsel oluşturma
- [x] Görsel analizi
- [x] Çeviri (20+ dil)

### Diğer
- [x] Çekiliş sistemi
- [x] Anket sistemi
- [x] Hatırlatıcılar
- [x] AFK sistemi
- [x] Zamanlanmış mesajlar
- [x] Özel komutlar
- [x] Embed oluşturucu
- [x] Doğum günü sistemi
- [x] Sosyal medya bildirimleri
- [x] Web Dashboard

---

## Faz 1: Moderasyon İyileştirmeleri (Planlanan)

### 1.1 Gelişmiş Uyarı Sistemi
- [ ] Uyarı puanları (her uyarı puan verir)
- [ ] Otomatik ceza eşikleri (3 uyarı = mute, 5 uyarı = kick vb.)
- [ ] Uyarı süresi dolması (30 gün sonra otomatik silinme)
- [ ] Uyarı geçmişi detaylı görüntüleme
- [ ] Moderatör notları

### 1.2 Gelişmiş Log Sistemi ✅
- [x] Ayrı log kanalları (mod-log, member-log, message-log)
- [x] Log filtreleme (Türe göre kanallara ayırma)
- [x] Embed formatında detaylı loglar
- [ ] Log arşivleme

### 1.3 Raid Koruması ✅
- [x] Hızlı üye akışı tespiti
- [x] Otomatik sunucu kilitleme (Doğrulama Seviyesi Yükseltme)
- [x] Hesap yaşı kontrolü
- [x] Detaylı Uyarı ve Ceza logları

---

## Faz 2: Topluluk Özellikleri (Planlanan)

### 2.1 Seviye Sistemi İyileştirmeleri ✅
- [x] XP kartları (özel Canvas tasarım)
- [x] Seviye rolleri (otomatik)
- [x] Haftalık/Aylık XP sıralaması
- [x] XP çarpanları (belirli kanallarda daha fazla XP)
- [x] Sesli kanal XP'si

### 2.2 Ekonomi Sistemi
- [x] Sunucu parası
- [x] Günlük/Haftalık ödüller
- [x] Çalışma komutları
- [x] **6.2 Database Optimizasyonu:** N+1 sorgularının azaltılması.
- [ ] Mağaza sistemi
- [ ] Rol satın alma
- [ ] Kumar oyunları (slot, blackjack, rulet)

### 2.3 Profil Sistemi ✅
- [x] Özel profil kartları (Canvas ile resimli)
- [ ] Rozetler ve başarılar (Lethe DB üzerinde kısmen var)
- [x] Biyografi
- [ ] Sosyal medya bağlantıları (Planlanıyor)

---

## Faz 3: Otomasyon İyileştirmeleri (Planlanan)

### 3.1 Gelişmiş AutoMod ✅
- [x] Özel kelime listeleri
- [x] Kanal bazlı kurallar (Muafiyet)
- [x] Rol muafiyetleri
- [ ] Regex tabanlı filtreler
- [ ] AI destekli içerik moderasyonu

### 3.2 Gelişmiş Zamanlanmış Mesajlar
- [ ] Cron expression desteği
- [ ] Embed mesaj desteği
- [ ] Koşullu mesajlar
- [ ] Tekrarlama desenleri

### 3.3 Akış Otomasyonu
- [ ] IF-THEN kuralları
- [ ] Olay tetikleyicileri
- [ ] Özel aksiyonlar
- [ ] Webhook entegrasyonları

---

## Faz 4: Etkileşim Özellikleri (Planlanan)

### 4.1 Gelişmiş Anket Sistemi ✅
- [x] Çoklu seçim anketleri
- [x] Süre sınırlı anketler
- [x] Otomatik sonuç açıklama
- [ ] Anonim oylama
- [ ] Rol bazlı oylama
- [ ] Anket sonuçları grafiği

### 4.2 Yarışma Sistemi ✅
- [x] Bilgi yarışmaları (Minigame)
- [x] Otomatik ödül dağıtımı (Ekonomi sistemiyle entegre)
- [ ] Puan tabanlı yarışmalar
- [ ] Yarışma geçmişi

### 4.3 Etkinlik Yönetimi
- [ ] Etkinlik oluşturma
- [ ] Katılım takibi
- [ ] Hatırlatmalar
- [ ] Tekrarlayan etkinlikler

---

## Faz 5: Entegrasyon İyileştirmeleri (Planlanan)

### 5.1 Sosyal Medya Genişletme ✅
- [x] YouTube video bildirimleri (RSS)
- [x] Reddit post bildirimleri (JSON)
- [ ] Twitch canlı yayın bildirimleri
- [ ] GitHub commit bildirimleri

### 5.2 Müzik Özellikleri
- [ ] YouTube müzik çalma
- [ ] Spotify entegrasyonu
- [ ] Çalma listeleri
- [ ] DJ modu

### 5.3 API Entegrasyonları ✅
- [x] Hava durumu (wttr.in)
- [x] Döviz kurları (Truncgil Finans)
- [x] Oyun istatistikleri (Steam Store API, Valorant/HenrikDev, LOL/Riot API)
- [x] Film/Dizi bilgileri (OMDB + TVMaze fallback)

---

## Faz 6: Dashboard İyileştirmeleri (Planlanan)

### 6.1 Yeni Arayüz
- [x] Modern tasarım
- [x] Karanlık/Aydınlık tema
- [x] Mobil uyumlu tasarım
- [x] Gerçek zamanlı istatistikler

### 6.2 Gelişmiş Yönetim
- [ ] Toplu işlemler
- [ ] İçe/Dışa aktarma
- [ ] Yedekleme sistemi
- [ ] Değişiklik geçmişi

### 6.3 Analitik ✅
- [x] Üye büyüme grafikleri (Chart.js)
- [x] Mesaj istatistikleri (Chart.js)
- [ ] Komut kullanım analizi
- [ ] Aktif saat analizi

---

## Öncelik Sırası

1. **Yüksek Öncelik (Aktif Geliştirme):**
   - Dashboard İyileştirmeleri (Faz 6) ⬅️ ŞU AN
   - Gelişmiş Uyarı Sistemi
   - Raid Koruması

2. **Orta Öncelik:**
   - Seviye Sistemi İyileştirmeleri
   - Ekonomi Sistemi
   - Gelişmiş AutoMod

3. **Düşük Öncelik:**
   - Müzik Özellikleri
   - API Entegrasyonları
   - Akış Otomasyonu

---

## Notlar

- Bu yol haritası, kullanıcı geri bildirimlerine göre güncellenebilir
- Her faz tamamlandığında bu dosya güncellenecek
- Yeni özellik talepleri için issue açılabilir

Son Güncelleme: 23 Aralık 2024
