const { EmbedBuilder } = require('discord.js');

const LATEST_CHANGELOG = {
  version: "2.0.0",
  date: "22 Aralık 2024",
  
  botUpdates: {
    title: "🤖 Publisher Bot Güncellemeleri",
    sections: [
      {
        emoji: "🤖",
        title: "Yapay Zeka İyileştirmeleri",
        features: [
          "GPT-4o ile gelişmiş sohbet deneyimi",
          "@Publisher etiketleyerek tüm dillerde sohbet edin",
          "Oyun rehberliği için AI desteği eklendi",
          "20+ dil desteği ile çok dilli sohbet"
        ]
      },
      {
        emoji: "📢",
        title: "Yönetici Araçları",
        features: [
          "`!changelog` - Son güncellemeleri görüntüle",
          "`!changelog gönder` - Tüm sunucu yöneticilerine duyuru gönder",
          "Gelişmiş log sistemi ve hata takibi"
        ]
      }
    ]
  },
  
  letheUpdates: {
    title: "🎮 Lethe Game - Faz 4: Oyuncu Etkileşim Sistemleri",
    sections: [
      {
        emoji: "🔄",
        title: "Takas Sistemi",
        features: [
          "`!takas @kullanıcı hayvan:<id> para:<miktar>` - Takas teklifi gönder",
          "`!takas @kullanıcı hayvan:<id> için:hayvan:<id>` - Hayvan takası",
          "`!takas liste` - Bekleyen takasları görüntüle",
          "`!takas kabul/reddet <id>` - Teklifi işle",
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
          "⏱️ Aynı kişiye 1 saat bekleme süresi"
        ]
      },
      {
        emoji: "👥",
        title: "Arkadaş Sistemi",
        features: [
          "`!arkadas ekle/sil @kullanıcı` - Arkadaş yönetimi",
          "`!arkadas liste` - Arkadaş listeni gör",
          "`!arkadas istekler` - Gelen istekleri gör",
          "`!arkadas kabul <id>` - İsteği kabul et",
          "📊 Arkadaşlarının istatistiklerini takip et!"
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
          "👥 Maximum 5 oyuncu katılabilir",
          "💰 Hasara göre ödül (2x normal boss!)"
        ]
      },
      {
        emoji: "🏆",
        title: "Gelişmiş Sıralama",
        features: [
          "`!siralama coins/level/hunts` - Kategori sıralaması",
          "`!siralama battles/pvp/animals` - Daha fazla kategori",
          "🌍 Global sıralama - Tüm sunuculardan oyuncular!",
          "📊 Kısa: `!lb`, `!top`, `!lider`"
        ]
      }
    ]
  },
  
  footer: "Publisher Bot - Lethe Game v2.0 | Sorularınız için: @Publisher"
};

async function sendChangelogToAdmins(client) {
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    servers: []
  };

  const sentToUsers = new Set();

  for (const guild of client.guilds.cache.values()) {
    try {
      const owner = await guild.fetchOwner();
      
      if (sentToUsers.has(owner.user.id)) {
        results.skipped++;
        results.servers.push({ name: guild.name, status: 'skipped', owner: owner.user.tag, reason: 'Zaten gönderildi' });
        console.log(`⏭️ Skipping ${owner.user.tag} (${guild.name}) - Already sent`);
        continue;
      }
      
      const mainEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📢 Publisher Bot Güncelleme Duyurusu`)
        .setDescription(`Merhaba **${owner.user.username}**! 👋\n\n**${guild.name}** sunucunuzda kullandığınız Publisher Bot'a yeni özellikler eklendi!\n\n📅 **Tarih:** ${LATEST_CHANGELOG.date}\n📦 **Versiyon:** ${LATEST_CHANGELOG.version}\n\nAşağıda tüm yeni özelliklerin detaylı listesini bulabilirsiniz.`)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setTimestamp();

      const botHeaderEmbed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(LATEST_CHANGELOG.botUpdates.title)
        .setDescription('Genel bot özellikleri ve iyileştirmeler:');

      const botFeatureEmbeds = LATEST_CHANGELOG.botUpdates.sections.map((section) => {
        return new EmbedBuilder()
          .setColor(0x3498DB)
          .setTitle(`${section.emoji} ${section.title}`)
          .setDescription(section.features.join('\n'));
      });

      const letheHeaderEmbed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(LATEST_CHANGELOG.letheUpdates.title)
        .setDescription('Hayvan koleksiyon oyununa eklenen yeni özellikler:');

      const letheFeatureEmbeds = LATEST_CHANGELOG.letheUpdates.sections.map((section, index) => {
        return new EmbedBuilder()
          .setColor(0x9B59B6)
          .setTitle(`${section.emoji} ${section.title}`)
          .setDescription(section.features.join('\n'))
          .setFooter(index === LATEST_CHANGELOG.letheUpdates.sections.length - 1 ? { text: LATEST_CHANGELOG.footer } : null);
      });

      const summaryEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Güncelleme Özeti')
        .setDescription(`**🤖 Bot Güncellemeleri:**
• Yapay Zeka (GPT-4o) entegrasyonu
• Gelişmiş çok dilli destek
• Yönetici duyuru araçları

**🎮 Lethe Game Güncellemeleri:**
• 🔄 Takas Sistemi - Oyuncular arası hayvan ve para takası
• 🎁 Hediye Sistemi - Arkadaşlara hediye gönderme
• 👥 Arkadaş Sistemi - Arkadaş ekleme ve istatistik paylaşımı
• ⚔️ Co-op Raid - 5 kişilik takım boss savaşları
• 🏆 Gelişmiş Sıralama - 6 farklı kategoride global liderlik tablosu

**📊 Toplam:** 20+ yeni komut, 30+ yeni özellik

Tüm bu özellikler sunucunuzda aktif! Oyuncularınız hemen kullanmaya başlayabilir.

❓ Sorularınız için botu etiketleyebilir veya \`!yardım\` komutunu kullanabilirsiniz.`)
        .setFooter({ text: '💙 Publisher Bot kullandığınız için teşekkürler!' });

      try {
        await owner.send({ embeds: [mainEmbed] });
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await owner.send({ embeds: [botHeaderEmbed] });
        for (const embed of botFeatureEmbeds) {
          await owner.send({ embeds: [embed] });
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        await owner.send({ embeds: [letheHeaderEmbed] });
        for (const embed of letheFeatureEmbeds) {
          await owner.send({ embeds: [embed] });
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        await owner.send({ embeds: [summaryEmbed] });
        
        sentToUsers.add(owner.user.id);
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
      if (message.author.id !== '259442832576741377') {
        return message.reply('❌ Bu komutu kullanma yetkiniz yok!');
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
          .setDescription(`✅ Başarılı: ${results.success}\n⏭️ Atlandı: ${results.skipped || 0}\n❌ Başarısız: ${results.failed}`)
          .addFields(
            results.servers.slice(0, 10).map(s => ({
              name: s.name,
              value: s.status === 'success' ? `✅ ${s.owner}` : 
                     s.status === 'skipped' ? `⏭️ ${s.owner} (zaten gönderildi)` :
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
      .setTitle(`📢 Publisher Bot v${LATEST_CHANGELOG.version} Güncellemeleri`)
      .setDescription(`📅 **Tarih:** ${LATEST_CHANGELOG.date}`)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setTimestamp();
    
    const botEmbed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(LATEST_CHANGELOG.botUpdates.title);
    
    for (const section of LATEST_CHANGELOG.botUpdates.sections) {
      botEmbed.addFields({
        name: `${section.emoji} ${section.title}`,
        value: section.features.slice(0, 3).join('\n') + (section.features.length > 3 ? '\n...' : ''),
        inline: false
      });
    }
    
    const letheEmbed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(LATEST_CHANGELOG.letheUpdates.title);
    
    for (const section of LATEST_CHANGELOG.letheUpdates.sections) {
      letheEmbed.addFields({
        name: `${section.emoji} ${section.title}`,
        value: section.features.slice(0, 2).join('\n') + (section.features.length > 2 ? '\n...' : ''),
        inline: true
      });
    }
    
    letheEmbed.setFooter({ text: 'Detaylı bilgi için !yardım komutunu kullanın | ' + LATEST_CHANGELOG.footer });
    
    await message.reply({ embeds: [mainEmbed, botEmbed, letheEmbed] });
  },
  
  sendChangelogToAdmins
};
