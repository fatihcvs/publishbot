const { animals, weapons, armors, accessories, consumables, baits, crates, bosses, achievements } = require('./seedData');

const LETHE_GAME_KNOWLEDGE = `
## LETHE GAME - TAM OYUN REHBERİ

Lethe Game, Publisher Bot'un global hayvan koleksiyon ve savaş oyunudur. Oyuncular hayvan avlar, takım kurar, savaşır ve koleksiyonlarını genişletir.

### OYUN SİSTEMİ

**Global Sistem:** Kullanıcı verileri TÜM sunucularda paylaşılır. Bir sunucuda kazandığın hayvanlar, paralar ve ekipmanlar her yerde kullanılabilir.

**Temel Para Birimleri:**
- 💰 Altın (Gold) - Ana para birimi, hayvan satışı, görevler ve çalışmadan kazanılır
- 💎 Taş (Gems) - Premium para birimi, özel eşyalar için kullanılır

### KOMUTLAR

**Avlanma & Koleksiyon:**
- \`!a\` veya \`!avla\` veya \`!hunt\` - Hayvan avla (15 saniye bekleme süresi)
- \`!k\` veya \`!koleksiyon\` - Yakaladığın hayvanları görüntüle
- \`!sat <id>\` - Hayvan sat (satış fiyatı nadirlığe göre değişir)

**Ekonomi:**
- \`!p\` veya \`!para\` veya \`!bakiye\` - Para ve taşlarını görüntüle
- \`!günlük\` veya \`!daily\` - Günlük ödülünü al (streak bonusları var!)
- \`!çalış\` veya \`!work\` - Çalışarak para kazan (30 dakika bekleme)
- \`!çalış meslek <meslek>\` - Meslek değiştir (hunter/trader/warrior/collector)

**Takım Sistemi:**
- \`!t\` veya \`!takım\` - Savaş takımını görüntüle
- \`!te <id>\` veya \`!takımekle <id>\` - Takıma hayvan ekle (maksimum 3)
- \`!tc <slot>\` veya \`!takımçıkar <slot>\` - Takımdan hayvan çıkar

**Savaş Sistemi:**
- \`!s\` veya \`!savaş\` - PvE savaşa gir
- \`!b\` veya \`!boss\` - Boss savaşına katıl (tam takım gerekli)
- \`!d @kullanıcı\` veya \`!düello @kullanıcı\` - PvP düello yap

**Mağaza & Ekipman:**
- \`!m\` veya \`!mağaza [kategori]\` - Mağazayı görüntüle
- \`!al <kategori> <id>\` - Eşya satın al
- \`!e\` veya \`!envanter\` - Envanteri görüntüle
- \`!ku <hayvan_id> <eşya_id>\` veya \`!kuşan\` - Eşya kuşan
- \`!sd\` veya \`!sandık [aç <id>]\` - Sandık aç

**Evrim Sistemi:**
- \`!evrim <id1> <id2> <id3>\` - Aynı türden 3 hayvanı birleştir (daha güçlü versiyon)
- \`!evrim taşlar\` - Evrim taşlarını görüntüle
- \`!evrim bilgi\` - Evrim sistemi hakkında bilgi
- \`!eğit <id>\` - Hayvanı eğit ve güçlendir

**Görevler:**
- \`!görev\` veya \`!quest\` - Günlük ve haftalık görevleri görüntüle
- \`!görev günlük\` - Sadece günlük görevleri göster
- \`!görev haftalık\` - Sadece haftalık görevleri göster

**Profil:**
- \`!pr\` veya \`!profil [@kullanıcı]\` - Oyun profilini görüntüle

### NADİRLİK SEVİYELERİ

| Nadirlik | Şans | Renk | Satış Fiyatı | XP |
|----------|------|------|--------------|-----|
| Common | %58 | Gri | 5 💰 | 1 |
| Uncommon | %25 | Yeşil | 25 💰 | 5 |
| Rare | %10 | Mavi | 100 💰 | 25 |
| Epic | %5 | Mor | 500 💰 | 100 |
| Legendary | %1.5 | Turuncu | 2,500 💰 | 500 |
| Mythic | %0.4 | Kırmızı | 10,000 💰 | 2,000 |
| Hidden | %0.1 | Siyah | 100,000 💰 | 10,000 |
| Eternal | %0.001 | Altın | 1,000,000 💰 | 100,000 |

### HAYVAN İSTATİSTİKLERİ

Her hayvanın 4 temel istatistiği vardır:
- **HP (Can)** - Savaşta ne kadar hasar alabilir
- **STR (Güç)** - Verdiği hasar miktarı
- **DEF (Savunma)** - Aldığı hasarı azaltır
- **SPD (Hız)** - Savaşta kim önce saldırır

### SAVAŞ MEKANİKLERİ

**PvE Savaş:**
- Rastgele düşmanlara karşı savaş
- Kazanınca para ve XP kazanırsın
- Takımındaki hayvanlar sırayla savaşır

**Boss Savaşları:**
- Güçlü boss'lara karşı takım savaşı
- Tam takım (3/3 hayvan) gerekli
- Nadir hayvan ödülleri verir

**Boss Listesi:**
${bosses.map(b => `- **${b.name}** ${b.emoji}: HP ${b.hp}, STR ${b.str}, DEF ${b.def} → Ödül: ${b.rewardMoney} 💰, ${b.rewardRarity} hayvan şansı`).join('\n')}

**PvP Düello:**
- Başka oyuncularla 1v1 savaş
- Kazanan para ödülü alır

### EVRİM SİSTEMİ

Aynı türden 3 hayvanı birleştirerek daha güçlü versiyonlarını elde edebilirsin:
- Common → Uncommon
- Uncommon → Rare
- Rare → Epic
- Epic → Legendary

**Evrim Formülü:** 3x Aynı Hayvan = 1x Üst Seviye Hayvan (statlar %20 bonus)

### EKİPMAN SİSTEMİ

**Silahlar (Hasar artırır):**
${weapons.slice(0, 5).map(w => `- ${w.emoji} **${w.name}**: +${w.damage} hasar, ${w.price} 💰`).join('\n')}

**Zırhlar (Savunma artırır):**
${armors.slice(0, 5).map(a => `- ${a.emoji} **${a.name}**: +${a.defense} savunma, ${a.price} 💰`).join('\n')}

**Aksesuarlar:**
${accessories.map(a => `- ${a.emoji} **${a.name}**: ${a.effect} +${a.effectValue}%, ${a.price} 💰`).join('\n')}

### İKSİRLER & TÜKETİLEBİLİRLER

${consumables.map(c => `- ${c.emoji} **${c.name}**: ${c.effect} +${c.effectValue}, ${c.price} 💰`).join('\n')}

### YEMLER (Avlanma Bonusu)

${baits.map(b => `- ${b.emoji} **${b.name}**: +%${b.catchBonus} yakalama, ${b.uses} kullanım, ${b.price} 💰`).join('\n')}

### SANDIKLAR

${crates.map(c => `- ${c.emoji} **${c.name}**: ${c.minRarity}-${c.maxRarity} hayvan, ${c.price} 💰`).join('\n')}

### GÜNLÜK ÖDÜL STREAKİ

Üst üste giriş yaparak bonus kazan:
- 1. Gün: 100 💰
- 2. Gün: 150 💰
- 3. Gün: 200 💰
- 4. Gün: 300 💰
- 5. Gün: 500 💰
- 6. Gün: 750 💰
- 7. Gün: 1000 💰 + Gümüş Sandık!

### GÖREV SİSTEMİ

**Günlük Görevler (Her gün sıfırlanır):**
- İlk Av - 1 hayvan yakala
- Avcı - 10 hayvan yakala
- Koleksiyoncu - 25 hayvan yakala
- Savaşçı - 1 PvE savaş kazan
- Düellocu - 1 PvP düello yap
- Nadir Buluş - Rare+ hayvan yakala
- Satıcı - 5 hayvan sat
- Takım Oyuncusu - Takımını güncelle

**Haftalık Görevler:**
- Haftalık Avcı - 100 hayvan yakala
- Boss Avcısı - 1 boss öldür
- PvP Ustası - 10 düello kazan
- Epik Buluş - Epic+ hayvan yakala
- Zengin Ol - 10,000 💰 biriktir
- Koleksiyon Tamamla - 50 farklı hayvan
- Savaş Lordu - 25 savaş kazan

### VIP SUNUCU BONUSLARI

ThePublisher sunucusunda (ID: 291436861082042378) oynayanlara özel:
- 🎯 **%15 Nadir Hayvan Şansı** - Epic ve legendary hayvanları daha kolay yakala
- 💰 **%25 Ekstra Para** - Tüm kazançlarda bonus
- ✨ **%25 Ekstra XP** - Daha hızlı seviye atla
- 🎁 **%50 Günlük Bonus** - Günlük ödüllerde ekstra para
- 🛒 **%15 Mağaza İndirimi** - Tüm eşyalarda indirim
- 🦅 **3 Özel VIP Hayvan** - Sadece VIP sunucusunda yakalanabilir

### BAŞARIMLAR

${achievements.map(a => `- ${a.emoji} **${a.name}**: ${a.description} → ${a.rewardMoney} 💰`).join('\n')}

### TOPLAM İÇERİK

- **${animals.length} Hayvan** (Common'dan Eternal'a kadar)
- **${bosses.length} Boss** (Farklı zorluk seviyeleri)
- **${weapons.length + armors.length + accessories.length} Ekipman**
- **${consumables.length} İksir**
- **${baits.length} Yem Türü**
- **${crates.length} Sandık Türü**
- **${achievements.length} Başarım**

### STRATEJİ İPUÇLARI

1. **Yeni Başlayanlar için:**
   - İlk önce çok avlan ve koleksiyon yap
   - Günlük ödüllerini kaçırma
   - Takımına en güçlü 3 hayvanını koy

2. **Orta Seviye:**
   - Boss savaşlarına katıl
   - Ekipman almaya başla
   - Evrim sistemini kullan

3. **İleri Seviye:**
   - VIP sunucuya katıl bonuslar için
   - Legendary+ hayvanları hedefle
   - Tüm başarımları tamamla

4. **Para Kazanma:**
   - Düşük nadirlikli hayvanları sat
   - Görevleri tamamla
   - Günlük streak'i koru
   - Boss'ları yen

### HAYVAN LİSTESİ (ÖNEMLİ OLANLAR)

**En Güçlü Common:** ${animals.filter(a => a.rarity === 'common').sort((a,b) => b.baseStr - a.baseStr)[0]?.name}
**En Güçlü Uncommon:** ${animals.filter(a => a.rarity === 'uncommon').sort((a,b) => b.baseStr - a.baseStr)[0]?.name}
**En Güçlü Rare:** ${animals.filter(a => a.rarity === 'rare').sort((a,b) => b.baseStr - a.baseStr)[0]?.name}
**En Güçlü Epic:** ${animals.filter(a => a.rarity === 'epic').sort((a,b) => b.baseStr - a.baseStr)[0]?.name}
**En Güçlü Legendary:** ${animals.filter(a => a.rarity === 'legendary').sort((a,b) => b.baseStr - a.baseStr)[0]?.name}
**En Güçlü Mythic:** ${animals.filter(a => a.rarity === 'mythic').sort((a,b) => b.baseStr - a.baseStr)[0]?.name}
**En Güçlü Hidden:** ${animals.filter(a => a.rarity === 'hidden').sort((a,b) => b.baseStr - a.baseStr)[0]?.name}

**VIP Özel Hayvanlar:** VIP Anka, VIP Koruyucu, VIP Ruh (Sadece ThePublisher sunucusunda)

**Efsanevi "King in the North":** Oyundaki en nadir hayvan (%0.001 şans), 1500 HP, 150 STR ile en güçlü hayvan!
`;

function isLetheGameQuestion(message) {
  const letheKeywords = [
    'lethe', 'avla', 'avlama', 'hayvan', 'koleksiyon', 'takım', 'takımekle', 'takımçıkar',
    'savaş', 'boss', 'düello', 'mağaza', 'envanter', 'ekipman', 'silah', 'zırh',
    'evrim', 'eğit', 'görev', 'quest', 'günlük', 'çalış', 'work', 'daily',
    'sandık', 'crate', 'yem', 'bait', 'iksir', 'potion', 'nadirlik', 'rarity',
    'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'hidden', 'eternal',
    'ejderha', 'dragon', 'phoenix', 'anka', 'kurt', 'wolf', 'kaplan', 'tiger',
    'avlamak', 'yakalamak', 'satmak', 'almak', 'oyun', 'game', 'hunt', 'hunting',
    'vip sunucu', 'thepublisher', 'altın', 'para', 'taş', 'gem', 'streak',
    '!a ', '!p ', '!k ', '!t ', '!s ', '!b ', '!d ', '!m ', '!e ', '!pr ',
    'nasıl avlarım', 'nasıl oynarım', 'nasıl başlarım', 'ne yapmalıyım',
    'hangi hayvan', 'en güçlü', 'en iyi', 'strateji', 'taktik', 'ipucu',
    'başarım', 'achievement', 'level', 'seviye', 'xp', 'deneyim'
  ];
  
  const lowerMessage = message.toLowerCase();
  return letheKeywords.some(keyword => lowerMessage.includes(keyword));
}

function getLetheGameContext() {
  return LETHE_GAME_KNOWLEDGE;
}

function getAnimalInfo(animalName) {
  const animal = animals.find(a => 
    a.name.toLowerCase() === animalName.toLowerCase() ||
    a.animalId.toLowerCase() === animalName.toLowerCase()
  );
  if (!animal) return null;
  
  return {
    ...animal,
    description: `${animal.emoji} **${animal.name}** (${animal.rarity})
HP: ${animal.baseHp} | STR: ${animal.baseStr} | DEF: ${animal.baseDef} | SPD: ${animal.baseSpd}
Satış: ${animal.sellPrice} 💰 | XP: ${animal.xpReward}`
  };
}

function getBossInfo(bossName) {
  const boss = bosses.find(b => 
    b.name.toLowerCase().includes(bossName.toLowerCase()) ||
    b.bossId.toLowerCase().includes(bossName.toLowerCase())
  );
  return boss;
}

module.exports = {
  LETHE_GAME_KNOWLEDGE,
  isLetheGameQuestion,
  getLetheGameContext,
  getAnimalInfo,
  getBossInfo,
  animals,
  bosses,
  weapons,
  armors
};
