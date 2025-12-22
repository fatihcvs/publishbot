const { EmbedBuilder } = require('discord.js');

const LATEST_CHANGELOG = {
  version: "2.0.0",
  date: "22 Aralık 2024",
  title: "🎮 Faz 4: Oyuncu Etkileşim Sistemleri",
  sections: [
    {
      emoji: "🔄",
      title: "Takas Sistemi",
      features: [
        "`!takas @kullanıcı hayvan:<id> para:<miktar>` - Takas teklifi gönder",
        "`!takas @kullanıcı hayvan:<id> için:hayvan:<id>` - Hayvan takası teklif et",
        "`!takas liste` - Bekleyen takasları görüntüle",
        "`!takas kabul <id>` - Teklifi kabul et",
        "`!takas reddet <id>` - Teklifi reddet",
        "✨ Teklifler 24 saat geçerlidir",
        "⚠️ Takımdaki hayvanlar takas edilemez"
      ]
    },
    {
      emoji: "🎁",
      title: "Hediye Sistemi",
      features: [
        "`!hediye @kullanıcı <miktar>` - Altın hediye et (10-100.000)",
        "`!hediye @kullanıcı hayvan:<id>` - Hayvan hediye et",
        "`!hediye geçmiş` - Hediye geçmişini görüntüle",
        "⏱️ Aynı kişiye 1 saat bekleme süresi",
        "❤️ Arkadaşlarınızla eşyalarınızı paylaşın!"
      ]
    },
    {
      emoji: "👥",
      title: "Arkadaş Sistemi",
      features: [
        "`!arkadas ekle @kullanıcı` - Arkadaşlık isteği gönder",
        "`!arkadas sil @kullanıcı` - Arkadaş listesinden çıkar",
        "`!arkadas liste` - Arkadaş listeni gör",
        "`!arkadas istekler` - Gelen istekleri gör",
        "`!arkadas kabul <id>` - İsteği kabul et",
        "📊 Arkadaşlarının profillerini ve istatistiklerini gör!"
      ]
    },
    {
      emoji: "⚔️",
      title: "Co-op Raid Sistemi",
      features: [
        "`!raid başlat <boss>` - Sunucuda raid başlat",
        "`!raid katıl` - Aktif raid'e katıl",
        "`!raid saldır` - Boss'a saldır",
        "`!raid durum` - Raid durumunu gör",
        "`!raid bosslar` - Raid boss listesi",
        "👥 Maximum 5 oyuncu katılabilir",
        "💰 Hasara göre ödül dağılımı (2x normal boss ödülü!)",
        "🎯 Takım çalışması ile dev bossları yenin!"
      ]
    },
    {
      emoji: "🏆",
      title: "Gelişmiş Sıralama Sistemi",
      features: [
        "`!siralama coins` - Altın sıralaması",
        "`!siralama level` - Seviye sıralaması",
        "`!siralama hunts` - Av sayısı sıralaması",
        "`!siralama battles` - Savaş zaferleri",
        "`!siralama pvp` - PvP zaferleri",
        "`!siralama animals` - Hayvan sayısı",
        "🌍 Global sıralama - Tüm sunuculardan oyuncular!",
        "📊 Kısa komutlar: `!lb`, `!top`, `!lider`"
      ]
    },
    {
      emoji: "🤖",
      title: "AI Güncellemesi",
      features: [
        "Yapay zeka artık tüm Faz 4 özelliklerini biliyor",
        "Oyuncular @Publisher etiketleyerek yeni sistemler hakkında soru sorabilir",
        "Takas, hediye, raid stratejileri için AI'dan yardım alın!"
      ]
    }
  ],
  footer: "Publisher Bot - Lethe Game v2.0 | Sorularınız için: @Publisher"
};

async function sendChangelogToAdmins(client) {
  const results = {
    success: 0,
    failed: 0,
    servers: []
  };

  for (const guild of client.guilds.cache.values()) {
    try {
      const owner = await guild.fetchOwner();
      
      const mainEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📢 Publisher Bot Güncelleme Duyurusu`)
        .setDescription(`Merhaba **${owner.user.username}**! 👋\n\n**${guild.name}** sunucunuzda kullandığınız Publisher Bot'a yeni özellikler eklendi!\n\n**${LATEST_CHANGELOG.title}**\n📅 Tarih: ${LATEST_CHANGELOG.date}\n\nAşağıda tüm yeni özelliklerin detaylı listesini bulabilirsiniz.`)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setTimestamp();

      const featureEmbeds = LATEST_CHANGELOG.sections.map((section, index) => {
        return new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`${section.emoji} ${section.title}`)
          .setDescription(section.features.join('\n'))
          .setFooter(index === LATEST_CHANGELOG.sections.length - 1 ? { text: LATEST_CHANGELOG.footer } : null);
      });

      const summaryEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Özet')
        .setDescription(`**Yeni Eklenen Sistemler:**
• 🔄 Takas Sistemi - Oyuncular arası hayvan ve para takası
• 🎁 Hediye Sistemi - Arkadaşlara hediye gönderme
• 👥 Arkadaş Sistemi - Arkadaş ekleme ve istatistik paylaşımı
• ⚔️ Co-op Raid - 5 kişilik takım boss savaşları
• 🏆 Gelişmiş Sıralama - 6 farklı kategoride global liderlik tablosu

**Toplam Yeni Komut:** 20+
**Toplam Yeni Özellik:** 30+

Tüm bu özellikler **Lethe Game** oyun sisteminizde aktif! Oyuncularınız hemen kullanmaya başlayabilir.

❓ Sorularınız için botu etiketleyebilir veya \`!yardım\` komutunu kullanabilirsiniz.`)
        .setFooter({ text: '💙 Publisher Bot kullandığınız için teşekkürler!' });

      try {
        await owner.send({ embeds: [mainEmbed] });
        
        for (const embed of featureEmbeds) {
          await owner.send({ embeds: [embed] });
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await owner.send({ embeds: [summaryEmbed] });
        
        results.success++;
        results.servers.push({ name: guild.name, status: 'success', owner: owner.user.tag });
        console.log(`✅ Changelog sent to ${owner.user.tag} (${guild.name})`);
      } catch (dmError) {
        if (dmError.code === 50007) {
          results.failed++;
          results.servers.push({ name: guild.name, status: 'dm_closed', owner: owner.user.tag });
          console.log(`❌ Cannot DM ${owner.user.tag} (${guild.name}) - DMs closed`);
        } else {
          throw dmError;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      results.failed++;
      results.servers.push({ name: guild.name, status: 'error', error: error.message });
      console.error(`❌ Failed to send changelog to ${guild.name}:`, error.message);
    }
  }

  return results;
}

module.exports = {
  name: 'changelog',
  aliases: ['güncelleme', 'duyuru', 'update'],
  description: 'Son güncellemeleri gösterir veya yöneticilere gönderir',
  usage: '!changelog [gönder]',
  
  async execute(message, args, client) {
    if (args[0] === 'gönder' || args[0] === 'send') {
      if (message.author.id !== '291283224498888704') {
        return message.reply('❌ Bu komutu sadece bot sahibi kullanabilir!');
      }
      
      const confirmEmbed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setTitle('⚠️ Onay Gerekli')
        .setDescription(`Tüm sunucu sahiplerine (${client.guilds.cache.size} sunucu) güncelleme mesajı gönderilecek.\n\nDevam etmek için **evet** yazın.`);
      
      await message.reply({ embeds: [confirmEmbed] });
      
      const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'evet';
      const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
      
      collector.on('collect', async () => {
        const sendingEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('📤 Gönderiliyor...')
          .setDescription('Güncelleme mesajları sunucu sahiplerine gönderiliyor. Bu işlem birkaç dakika sürebilir.');
        
        const statusMsg = await message.channel.send({ embeds: [sendingEmbed] });
        
        const results = await sendChangelogToAdmins(client);
        
        const resultEmbed = new EmbedBuilder()
          .setColor(results.failed === 0 ? 0x00FF00 : 0xFFFF00)
          .setTitle('📊 Gönderim Tamamlandı')
          .setDescription(`✅ Başarılı: ${results.success}\n❌ Başarısız: ${results.failed}`)
          .addFields(
            results.servers.slice(0, 10).map(s => ({
              name: s.name,
              value: s.status === 'success' ? `✅ ${s.owner}` : 
                     s.status === 'dm_closed' ? `❌ DM kapalı (${s.owner})` :
                     `❌ Hata: ${s.error}`,
              inline: true
            }))
          );
        
        await statusMsg.edit({ embeds: [resultEmbed] });
      });
      
      collector.on('end', collected => {
        if (collected.size === 0) {
          message.channel.send('⏱️ Zaman aşımı. İşlem iptal edildi.');
        }
      });
      
      return;
    }
    
    const mainEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📢 ${LATEST_CHANGELOG.title}`)
      .setDescription(`📅 **Tarih:** ${LATEST_CHANGELOG.date}\n\n**Yeni Özellikler:**`)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setTimestamp();
    
    for (const section of LATEST_CHANGELOG.sections) {
      mainEmbed.addFields({
        name: `${section.emoji} ${section.title}`,
        value: section.features.slice(0, 3).join('\n') + (section.features.length > 3 ? '\n...' : ''),
        inline: false
      });
    }
    
    mainEmbed.setFooter({ text: 'Detaylı bilgi için !yardım komutunu kullanın' });
    
    await message.reply({ embeds: [mainEmbed] });
  },
  
  sendChangelogToAdmins
};
