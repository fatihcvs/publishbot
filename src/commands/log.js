const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { guilds } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

module.exports = {
  name: 'log',
  aliases: ['logs', 'kayıt', 'logayarla'],
  description: 'Gelişmiş Denetim Kaydı (Log) kanallarını ayarlar',
  permissions: [PermissionFlagsBits.ManageGuild],
  usage: '!log [genel/mod/üye/mesaj/kapat] [#kanal]',

  async execute(message, args, client, storage) {
    if (!args[0]) {
      return this.showStatus(message, storage);
    }

    const subCommand = args[0].toLowerCase();

    if (subCommand === 'kapat' || subCommand === 'off' || subCommand === 'disable') {
      await db.update(guilds)
        .set({ logChannel: null, modLogChannel: null, memberLogChannel: null, messageLogChannel: null })
        .where(eq(guilds.id, message.guild.id));
      return message.reply('✅ Bütün log sistemleri kapatıldı ve kanallar temizlendi.');
    }

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

    if (!channel && subCommand !== 'durum') {
      return message.reply('❌ Lütfen bir kanal belirtin. Örnek: `!log mod #mod-log`');
    }

    if (subCommand === 'genel' || subCommand === 'all') {
      await db.update(guilds).set({ logChannel: channel.id }).where(eq(guilds.id, message.guild.id));
      return this.sendSuccess(message, 'Genel / Varsayılan', channel);
    }
    else if (subCommand === 'mod' || subCommand === 'moderasyon') {
      await db.update(guilds).set({ modLogChannel: channel.id }).where(eq(guilds.id, message.guild.id));
      return this.sendSuccess(message, 'Moderasyon', channel);
    }
    else if (subCommand === 'üye' || subCommand === 'uye' || subCommand === 'member') {
      await db.update(guilds).set({ memberLogChannel: channel.id }).where(eq(guilds.id, message.guild.id));
      return this.sendSuccess(message, 'Üye Etkinlik', channel);
    }
    else if (subCommand === 'mesaj' || subCommand === 'message') {
      await db.update(guilds).set({ messageLogChannel: channel.id }).where(eq(guilds.id, message.guild.id));
      return this.sendSuccess(message, 'Mesaj (Silme/Düzenleme)', channel);
    }
    else if (subCommand === 'durum' || subCommand === 'status') {
      return this.showStatus(message, storage);
    }
    else {
      // Fallback or old command style `!log #channel` (sets general)
      const possibleChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
      if (possibleChannel) {
        await db.update(guilds).set({ logChannel: possibleChannel.id }).where(eq(guilds.id, message.guild.id));
        return this.sendSuccess(message, 'Genel / Varsayılan', possibleChannel);
      }
      return message.reply(`❌ Geçersiz kategori. Kullanım: \`!log [genel/mod/üye/mesaj] #kanal\``);
    }
  },

  async sendSuccess(message, typeName, channel) {
    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle(`✅ ${typeName} Logları Ayarlandı`)
      .setDescription(`Bu kategoriye ait log olayları bundan sonra <#${channel.id}> kanalına gönderilecek.`)
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },

  async showStatus(message, storage) {
    const guildData = await storage.getGuild(message.guild.id);

    const genel = guildData.logChannel ? `<#${guildData.logChannel}>` : '❌ Kapalı';
    const mod = guildData.modLogChannel ? `<#${guildData.modLogChannel}>` : '*Genel kanalı kullanır (Varsayılan)*';
    const uye = guildData.memberLogChannel ? `<#${guildData.memberLogChannel}>` : '*Genel kanalı kullanır (Varsayılan)*';
    const mesaj = guildData.messageLogChannel ? `<#${guildData.messageLogChannel}>` : '*Genel kanalı kullanır (Varsayılan)*';

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📊 Denetim Kaydı (Log) Kanalları')
      .setDescription('Farklı olayları farklı kanallara yönlendirebilirsiniz. Spesifik bir kanal atanmamış olaylar **Genel** kanala gönderilir.')
      .addFields(
        { name: '🌐 Genel Log Kanalı', value: `\`!log genel #kanal\`\n${genel}`, inline: false },
        { name: '🔨 Moderasyon Logları\n*(Ban, Kick, Rol/Kanal Günc.)*', value: `\`!log mod #kanal\`\n${mod}`, inline: true },
        { name: '👥 Üye Logları\n*(Katılma, Ayrılma, Ses Kanalı)*', value: `\`!log üye #kanal\`\n${uye}`, inline: true },
        { name: '✉️ Mesaj Logları\n*(Silinen, Düzenlenen Msjlar)*', value: `\`!log mesaj #kanal\`\n${mesaj}`, inline: true }
      )
      .setFooter({ text: 'Tüm logları kapatmak için: !log kapat' });

    return message.reply({ embeds: [embed] });
  }
};
