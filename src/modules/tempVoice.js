const { ChannelType, PermissionFlagsBits } = require('discord.js');

class TempVoiceSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
    this.tempChannels = new Map();
    
    this.setupListeners();
  }

  setupListeners() {
    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      await this.handleVoiceUpdate(oldState, newState);
    });
  }

  async handleVoiceUpdate(oldState, newState) {
    const guildId = newState.guild?.id || oldState.guild?.id;
    if (!guildId) return;

    const guildData = await this.storage.getGuild(guildId);
    if (!guildData?.tempVoiceChannel) return;

    // Kullanıcı tetikleyici kanala katıldı mı?
    if (newState.channelId === guildData.tempVoiceChannel) {
      await this.createTempChannel(newState, guildData);
    }

    // Kullanıcı geçici kanaldan ayrıldı mı?
    if (oldState.channelId && this.tempChannels.has(oldState.channelId)) {
      await this.checkEmptyChannel(oldState);
    }
  }

  async createTempChannel(state, guildData) {
    try {
      const channel = await state.guild.channels.create({
        name: `🔊 ${state.member.displayName}'in Odası`,
        type: ChannelType.GuildVoice,
        parent: guildData.tempVoiceCategory,
        permissionOverwrites: [
          {
            id: state.member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers
            ]
          }
        ]
      });

      this.tempChannels.set(channel.id, {
        owner: state.member.id,
        createdAt: Date.now()
      });

      await state.member.voice.setChannel(channel);
    } catch (error) {
      console.error('Geçici kanal oluşturulurken hata:', error);
    }
  }

  async checkEmptyChannel(state) {
    const channelId = state.channelId;
    const channel = state.guild.channels.cache.get(channelId);
    
    if (!channel) return;
    
    if (channel.members.size === 0) {
      try {
        await channel.delete();
        this.tempChannels.delete(channelId);
      } catch (error) {
        console.error('Geçici kanal silinirken hata:', error);
      }
    }
  }
}

module.exports = { TempVoiceSystem };
