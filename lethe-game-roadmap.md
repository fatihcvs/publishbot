# Lethe Game Geliştirme Yol Haritası

Bu belge, Lethe Game'in gelecekteki özelliklerini ve geliştirme planını içerir.

---

## Faz 1: Görev Sistemi ✅ TAMAMLANDI

### Günlük Görevler (8 adet) ✅
- [x] İlk Av - 1 hayvan avla (100💰 + 25 XP)
- [x] Avcı - 10 hayvan avla (250💰 + 50 XP)
- [x] Koleksiyoncu - 25 hayvan avla (500💰 + 100 XP)
- [x] Savaşçı - 3 savaş yap (200💰 + 75 XP)
- [x] Düellocu - 1 düello yap (300💰 + 100 XP)
- [x] Nadir Buluş - Nadir+ hayvan bul (400💰 + 150 XP)
- [x] Satıcı - 5 hayvan sat (200💰 + 50 XP)
- [x] Takım Oyuncusu - Takıma hayvan ekle (150💰 + 50 XP)

### Haftalık Görevler (7 adet) ✅
- [x] Haftalık Avcı - 100 hayvan avla (2,000💰 + 500 XP)
- [x] Boss Avcısı - 3 boss öldür (3,000💰 + 750 XP)
- [x] PvP Ustası - 10 düello kazan (2,500💰 + 600 XP)
- [x] Epik Buluş - Epik+ hayvan bul (1,500💰 + 400 XP)
- [x] Zengin Ol - 10,000💰 kazan (1,000💰 + 300 XP)
- [x] Koleksiyon Tamamla - 50 hayvan topla (2,000💰 + 500 XP)
- [x] Savaş Lordu - 20 savaş kazan (2,500💰 + 600 XP)

### Tamamlama Bonusları ✅
- [x] Günlük Bonus: 1,000💰 + 50 XP + Gümüş Sandık
- [x] Haftalık Bonus: 15,000💰 + 500 XP + Elmas Sandık

### Komutlar ✅
- [x] `!görev` / `!quest` - Görevleri görüntüle
- [x] `!görev günlük` - Günlük görevleri göster
- [x] `!görev haftalık` - Haftalık görevleri göster
- [x] `!görev ödül <id>` - Görev ödülünü al

---

## Faz 2: Ekonomi Geliştirmeleri ✅ TAMAMLANDI

### Günlük Ödül Sistemi ✅
- [x] 7 günlük streak sistemi
- [x] Artan ödüller (100💰 → 1,000💰)
- [x] 7. gün bonus sandık
- [x] Streak sıfırlama (24 saat geçerse)

### Çalışma Sistemi ✅
- [x] 30 dakika cooldown
- [x] 4 meslek tipi (Hunter, Trader, Warrior, Collector)
- [x] Meslek bazlı kazanç farkları
- [x] Meslek değiştirme özelliği

### Komutlar ✅
- [x] `!günlük` / `!daily` - Günlük ödül al
- [x] `!günlük durum` - Streak durumu
- [x] `!çalış` / `!work` - Çalışarak para kazan
- [x] `!çalış meslek <tip>` - Meslek değiştir
- [x] `!çalış durum` - İş durumu

---

## Faz 3: Pet Evrimi ✅ TAMAMLANDI

### Evrim Sistemi ✅
- [x] Evrim taşları (7 farklı nadirlik)
- [x] Aynı türden 3 hayvan birleştirerek evrim
- [x] Evrim seviyesi göstergeleri (⭐⭐⭐ max)
- [x] Stat bonusları (+HP, STR, DEF, SPD)
- [x] Avlanırken evrim taşı düşürme

### Eğitim Sistemi ✅
- [x] `!eğit <hayvan_id>` - Hayvanı eğit
- [x] Eğitim cooldown (1 saat)
- [x] Rastgele stat artışları
- [x] 10 eğitim seviyesi (artan maliyet)

### Özel Yetenekler ✅
- [x] 18 farklı yetenek (nadirliğe göre)
- [x] Pasif yetenekler (Av şansı, Hasar, Kritik, vb.)
- [x] Evrimleşince rastgele yetenek kazanma

### Komutlar ✅
- [x] `!evrim <id1> <id2> <id3>` - Hayvanları birleştir
- [x] `!evrim taşlar` - Evrim taşlarını görüntüle
- [x] `!evrim bilgi` - Evrim sistemi hakkında bilgi
- [x] `!eğit <id>` - Hayvanı eğit

---

## Faz 4: Oyuncu Etkileşim Sistemleri ✅ TAMAMLANDI

### Takas Sistemi ✅
- [x] `!takas @kullanıcı hayvan:<id> para:<miktar>` - Takas teklifi gönder
- [x] `!takas @kullanıcı hayvan:<id> için:hayvan:<id>` - Hayvan takası
- [x] `!takas liste` - Bekleyen takasları görüntüle
- [x] `!takas kabul/reddet <id>` - Teklifi işle
- [x] 24 saat geçerlilik süresi
- [x] Takımdaki hayvanlar takas edilemez

### Hediye Sistemi ✅
- [x] `!hediye @kullanıcı <miktar>` - Altın hediye et (10-100,000)
- [x] `!hediye @kullanıcı hayvan:<id>` - Hayvan hediye et
- [x] `!hediye geçmiş` - Hediye geçmişini görüntüle
- [x] Aynı kişiye 1 saat bekleme süresi

### Arkadaş Sistemi ✅
- [x] `!arkadas ekle @kullanıcı` - Arkadaşlık isteği gönder
- [x] `!arkadas sil @kullanıcı` - Arkadaş listesinden çıkar
- [x] `!arkadas liste` - Arkadaş listeni gör
- [x] `!arkadas istekler` - Gelen istekleri gör
- [x] `!arkadas kabul/reddet <id>` - İsteği işle
- [x] Arkadaşlarının istatistiklerini takip et

### Co-op Raid Sistemi ✅
- [x] `!raid başlat <boss>` - Sunucuda raid başlat
- [x] `!raid katıl` - Aktif raid'e katıl
- [x] `!raid saldır` - Boss'a saldır
- [x] `!raid durum` - Raid durumunu gör
- [x] Maximum 5 oyuncu katılabilir
- [x] Hasara göre ödül dağılımı (2x normal boss!)

### Gelişmiş Sıralama Sistemi ✅
- [x] `!siralama coins/level/hunts` - Kategori sıralaması
- [x] `!siralama battles/pvp/animals` - Ek kategoriler
- [x] Global sıralama (tüm sunuculardan oyuncular)
- [x] Kısa komutlar: `!lb`, `!top`, `!lider`

---

## Faz 5: Sezonluk Hayvan Sistemi ✅ TAMAMLANDI

### Sezon Mekanikleri ✅
- [x] 4 sezon: Bahar, Yaz, Sonbahar, Kış
- [x] Otomatik sezon geçişi (ay bazlı)
- [x] Her sezon 12 özel hayvan (toplam 48)
- [x] Sezonluk hayvanlar normal avlanma havuzuna dahil

### Sezonluk Hayvanlar ✅

#### 🌸 Bahar (Mart - Mayıs)
- [x] 3 Common: Bahar Tavşanı, Çiçek Kuşu, Polen Arısı
- [x] 2 Uncommon: Yağmur Kurbağası, Kiraz Tilkisi
- [x] 2 Rare: Çayır Geyiği, Gökkuşağı Kelebeği
- [x] 2 Epic: Çiçek Ruhu, Sakura Ejderhası
- [x] 1 Legendary: Yeniden Doğuş Ankası
- [x] 1 Mythic: Doğa Titanı
- [x] 1 Hidden: Bahar Tanrıçası

#### ☀️ Yaz (Haziran - Ağustos)
- [x] 3 Common: Güneş Kertenkelesi, Plaj Yengeci, Mercan Balığı
- [x] 2 Uncommon: Tropikal Papağan, Kum Kaplumbağası
- [x] 2 Rare: Palmiye Maymunu, Dalga Yunusu
- [x] 2 Epic: Volkan Semenderi, Okyanus Ruhu
- [x] 1 Legendary: Güneş Tanrısı
- [x] 1 Mythic: Cennet Kuşu
- [x] 1 Hidden: Yaz Lordu

#### 🍂 Sonbahar (Eylül - Kasım)
- [x] 3 Common: Orman Mantarı, Yaprak Kirpisi, Sonbahar Sincabı
- [x] 2 Uncommon: Şükran Hindisi, Orman Porsuğu
- [x] 2 Rare: Gece Baykuşu, Akçaağaç Ruhu
- [x] 2 Epic: Balkabağı Kralı, Ay Işığı Kurdu
- [x] 1 Legendary: Sonbahar Perisi
- [x] 1 Mythic: Gölge Lordu
- [x] 1 Hidden: Hasat Tanrısı

#### ❄️ Kış (Aralık - Şubat)
- [x] 3 Common: Kar Pengueni, Kar Adamı, Ren Geyiği
- [x] 2 Uncommon: Buz Kurdu, Kutup Foku
- [x] 2 Rare: Kutup Ayısı, Kar Baykuşu
- [x] 2 Epic: Buz Elementali, Kar Fırtınası Ruhu
- [x] 1 Legendary: Buzul Titanı
- [x] 1 Mythic: Kış Kraliçesi
- [x] 1 Hidden: Ebedi Buz Lordu

### Sezon Komutları ✅
- [x] `!sezon` / `!season` - Aktif sezonu ve hayvanlarını göster
- [x] `!sezon tüm` / `!sezon hepsi` - Tüm sezonların hayvanlarını listele
- [x] Sezonluk hayvanlar özel rozetlerle işaretlenir (🌸☀️🍂❄️)
- [x] Yakalanan sezonluk hayvanlar kalıcı olarak koleksiyonda kalır

---

## Faz 6: Etkinlik Sistemi (Planlandı)

### Özel Etkinlikler
- [ ] Hafta sonu 2x XP etkinlikleri
- [ ] Özel hayvan avlama etkinlikleri
- [ ] Boss Rush etkinlikleri
- [ ] Topluluk hedefleri

### Etkinlik Ödülleri
- [ ] Sınırlı süreli hayvanlar
- [ ] Özel ekipmanlar
- [ ] Etkinlik rozetleri
- [ ] Kozmetik eşyalar

---

## Faz 7: Keşif Sistemi (Planlandı)

### Bölge Keşfi
- [ ] Farklı biyomlar (Orman, Çöl, Okyanus, Dağ, vb.)
- [ ] Bölgeye özel hayvanlar
- [ ] Keşif enerjisi sistemi
- [ ] Bölge seviyeleri

### Macera Modu
- [ ] Hikaye tabanlı görevler
- [ ] NPC karakterler
- [ ] Diyalog sistemi
- [ ] Macera ödülleri

### Hazine Avı
- [ ] Gizli hazine lokasyonları
- [ ] Harita parçaları toplama
- [ ] Hazine sandıkları
- [ ] Nadir eşya bulma

---

## Faz 8: Klan Sistemi (Planlandı)

### Klan Mekanikleri
- [ ] Klan kurma ve yönetme
- [ ] Klan seviyeleri ve bonusları
- [ ] Klan savaşları (haftalık)
- [ ] Klan sıralaması
- [ ] Klan hazinesi ve bağışlar

---

## Faz 9: Başarım ve Koleksiyon Genişletmesi (Planlandı)

### Genişletilmiş Başarımlar
- [ ] 50+ yeni başarım
- [ ] Başarım kategorileri
- [ ] Başarım puanları
- [ ] Başarım vitrinleri

### Koleksiyon Albümü
- [ ] Tüm hayvanlar için albüm
- [ ] Koleksiyon tamamlama bonusları
- [ ] Nadir koleksiyonlar
- [ ] Koleksiyon rozetleri

---

## Teknik İyileştirmeler (Devam Eden)

### Performans
- [x] Veritabanı sorgu optimizasyonu
- [x] PostgreSQL entegrasyonu
- [ ] Cache sistemi iyileştirmesi
- [ ] Rate limiting geliştirmesi

### Kullanıcı Deneyimi
- [x] Embed görsellerini iyileştirme
- [x] Kısa komut alias'ları
- [ ] Daha iyi hata mesajları
- [ ] Mobil uyumluluk kontrolü

### Güvenlik
- [x] Anti-exploit önlemleri (cooldown)
- [ ] Hile tespit sistemi
- [x] Güvenli ticaret doğrulaması

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| v1.0 | - | İlk sürüm: 103 hayvan, savaş, boss, ekipman |
| v1.1 | 17 Aralık 2024 | Görev sistemi (8 günlük + 7 haftalık) |
| v1.2 | 17 Aralık 2024 | Ekonomi sistemi (günlük ödül + çalışma) |
| v1.3 | 17 Aralık 2024 | Pet evrimi (evrim taşları, eğitim, 18 yetenek) |
| v2.0 | 22 Aralık 2024 | Faz 4: Oyuncu Etkileşim Sistemleri (Takas, Hediye, Arkadaş, Raid, Sıralama) |
| v2.1 | 22 Aralık 2024 | Faz 5: Sezonluk Hayvan Sistemi (48 yeni hayvan, 4 sezon) |

---

## Toplam İçerik Özeti

| Kategori | Miktar |
|----------|--------|
| Normal Hayvanlar | 103 |
| Sezonluk Hayvanlar | 48 |
| **Toplam Hayvan** | **151** |
| Boss | 5 |
| Ekipman | 30+ |
| Görev | 15 |
| Yetenek | 18 |
| Başarım | 15+ |

---

*Bu yol haritası aktif olarak güncellenmektedir. Önerilerinizi paylaşmaktan çekinmeyin!*
