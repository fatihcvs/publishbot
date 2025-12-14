class StatChannelSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
    
    this.startUpdater();
  }

  startUpdater() {
    // Her 5 dakikada bir güncelle
    setInterval(() => this.updateAllStats(), 5 * 60 * 1000);
  }

  async updateAllStats() {
    for (const guild of this.client.guilds.cache.values()) {
      await this.updateGuildStats(guild);
    }
  }

  async updateGuildStats(guild) {
    try {
      const channels = guild.channels.cache.filter(c => 
        c.type === 2 && // GuildVoice
        (c.name.includes('Üyeler:') || 
         c.name.includes('Botlar:') || 
         c.name.includes('Kanallar:') ||
         c.name.includes('Roller:') ||
         c.name.includes('Çevrimiçi:'))
      );

      for (const [, channel] of channels) {
        try {
          if (channel.name.includes('Üyeler:')) {
            await channel.setName(`👥 Üyeler: ${guild.memberCount}`);
          } else if (channel.name.includes('Botlar:')) {
            const botCount = guild.members.cache.filter(m => m.user.bot).size;
            await channel.setName(`🤖 Botlar: ${botCount}`);
          } else if (channel.name.includes('Kanallar:')) {
            const channelCount = guild.channels.cache.size;
            await channel.setName(`📊 Kanallar: ${channelCount}`);
          } else if (channel.name.includes('Roller:')) {
            const roleCount = guild.roles.cache.size;
            await channel.setName(`🎭 Roller: ${roleCount}`);
          } else if (channel.name.includes('Çevrimiçi:')) {
            const onlineCount = guild.members.cache.filter(m => 
              m.presence?.status && m.presence.status !== 'offline'
            ).size;
            await channel.setName(`🟢 Çevrimiçi: ${onlineCount}`);
          }
        } catch (err) {
          // Rate limit veya izin hatası, sessizce atla
        }
      }
    } catch (error) {
      console.error('İstatistik güncelleme hatası:', error);
    }
  }
}

module.exports = { StatChannelSystem };
