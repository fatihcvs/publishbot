const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../database/db');
const { guilds } = require('../../../shared/schema');
const { eq } = require('drizzle-orm');

module.exports = {
  name: 'automod',
  description: 'Gelişmiş AutoMod sistemini yapılandırır (Özel Kelimeler, Muafiyetler).',
  permissions: [PermissionFlagsBits.ManageGuild],
  usage: '!automod [bwl/muafiyet/durum]',

  async execute(message, args, client, storage) {
    if (!args[0]) return this.sendHelp(message);

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'bwl':
      case 'kelime':
        return this.handleBadWords(message, args.slice(1), storage);
      case 'muafiyet':
      case 'bypass':
      case 'exempt':
        return this.handleExemptions(message, args.slice(1), storage);
      case 'durum':
      case 'status':
        return this.showStatus(message, storage);
      default:
        return this.sendHelp(message);
    }
  },

  async handleBadWords(message, args, storage) {
    if (!args[0]) return message.reply('❌ Kullanım: `!automod bwl [ekle/sil/liste] [kelime]`');

    const action = args[0].toLowerCase();
    const guildData = await storage.getGuild(message.guild.id);
    let automodConfig = guildData.automodConfig || { enabled: true, badWords: { enabled: true, words: [], action: 'delete' } };

    // Ensure specific keys exist
    if (!automodConfig.badWords) automodConfig.badWords = { enabled: true, words: [], action: 'delete' };
    if (!automodConfig.badWords.words) automodConfig.badWords.words = [];

    let wordsList = automodConfig.badWords.words;

    if (action === 'ekle' || action === 'add') {
      const word = args.slice(1).join(' ').toLowerCase();
      if (!word) return message.reply('Lütfen eklenecek kelimeyi girin.');
      if (wordsList.includes(word)) return message.reply('Bu kelime halihazırda yasaklı listesinde bulunuyor!');

      wordsList.push(word);
      automodConfig.badWords.words = wordsList;
      automodConfig.badWords.enabled = true;
      automodConfig.enabled = true;

      await this.saveConfig(message.guild.id, automodConfig);
      return message.reply(`✅ \`${word}\` kelimesi yasaklı kelimeler (BWL) listesine eklendi.`);
    }
    else if (action === 'sil' || action === 'remove') {
      const word = args.slice(1).join(' ').toLowerCase();
      if (!word) return message.reply('Lütfen silinecek kelimeyi girin.');
      if (!wordsList.includes(word)) return message.reply('Bu kelime yasaklı listesinde bulunmuyor.');

      wordsList = wordsList.filter(w => w !== word);
      automodConfig.badWords.words = wordsList;

      await this.saveConfig(message.guild.id, automodConfig);
      return message.reply(`✅ \`${word}\` kelimesi yasaklı kelimeler (BWL) listesinden silindi.`);
    }
    else if (action === 'liste' || action === 'list') {
      if (wordsList.length === 0) return message.reply('Yasaklı kelime (BWL) listesi şu an boş.');
      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🚫 Yasaklı Kelimeler (BWL) Listesi')
        .setDescription(wordsList.map(w => `• ${w}`).join('\n'));
      return message.reply({ embeds: [embed] });
    }
  },

  async handleExemptions(message, args, storage) {
    if (!args[0]) return message.reply('❌ Kullanım: `!automod muafiyet [ekle/sil/liste] [@rol/#kanal]`');

    const action = args[0].toLowerCase();
    const guildData = await storage.getGuild(message.guild.id);
    let automodConfig = guildData.automodConfig || { enabled: true };

    if (!automodConfig.exemptRoles) automodConfig.exemptRoles = [];
    if (!automodConfig.exemptChannels) automodConfig.exemptChannels = [];

    if (action === 'ekle' || action === 'add') {
      const role = message.mentions.roles.first();
      const channel = message.mentions.channels.first();

      if (role) {
        if (automodConfig.exemptRoles.includes(role.id)) return message.reply('Bu rol zaten muaf.');
        automodConfig.exemptRoles.push(role.id);
        await this.saveConfig(message.guild.id, automodConfig);
        return message.reply(`✅ <@&${role.id}> rolü AutoMod kontrollerinden muaf tutuldu.`);
      } else if (channel) {
        if (automodConfig.exemptChannels.includes(channel.id)) return message.reply('Bu kanal zaten muaf.');
        automodConfig.exemptChannels.push(channel.id);
        await this.saveConfig(message.guild.id, automodConfig);
        return message.reply(`✅ <#${channel.id}> kanalı AutoMod kontrollerinden muaf tutuldu.`);
      }
      return message.reply('❌ Lütfen muaf tutulacak bir rol veya kanal etiketleyin.');
    }
    else if (action === 'sil' || action === 'remove') {
      const role = message.mentions.roles.first();
      const channel = message.mentions.channels.first();

      if (role) {
        if (!automodConfig.exemptRoles.includes(role.id)) return message.reply('Bu rol muafiyet listesinde değil.');
        automodConfig.exemptRoles = automodConfig.exemptRoles.filter(id => id !== role.id);
        await this.saveConfig(message.guild.id, automodConfig);
        return message.reply(`✅ <@&${role.id}> rolünün muafiyeti kaldırıldı.`);
      } else if (channel) {
        if (!automodConfig.exemptChannels.includes(channel.id)) return message.reply('Bu kanal muafiyet listesinde değil.');
        automodConfig.exemptChannels = automodConfig.exemptChannels.filter(id => id !== channel.id);
        await this.saveConfig(message.guild.id, automodConfig);
        return message.reply(`✅ <#${channel.id}> kanalının muafiyeti kaldırıldı.`);
      }
      return message.reply('❌ Lütfen muafiyeti kaldırılacak bir rol veya kanal etiketleyin.');
    }
    else if (action === 'liste' || action === 'list') {
      let desc = '**Muaf Roller:**\n';
      desc += automodConfig.exemptRoles.length > 0 ? automodConfig.exemptRoles.map(id => `• <@&${id}>`).join('\n') : 'Yok';
      desc += '\n\n**Muaf Kanallar:**\n';
      desc += automodConfig.exemptChannels.length > 0 ? automodConfig.exemptChannels.map(id => `• <#${id}>`).join('\n') : 'Yok';

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🛡️ AutoMod Muafiyetleri')
        .setDescription(desc);
      return message.reply({ embeds: [embed] });
    }
  },

  async showStatus(message, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    const conf = guildData.automodConfig || {};

    const isEnabled = conf.enabled ? '✅ Aktif' : '❌ Kapalı';
    const bwlCount = conf.badWords?.words?.length || 0;
    const bypassCount = (conf.exemptRoles?.length || 0) + (conf.exemptChannels?.length || 0);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🛡️ AutoMod Durumu')
      .addFields(
        { name: 'Genel Durum', value: isEnabled, inline: true },
        { name: 'Yasaklı Kelimeler (BWL)', value: `${bwlCount} kelime`, inline: true },
        { name: 'Muafiyetler', value: `${bypassCount} rol/kanal`, inline: true }
      );

    message.reply({ embeds: [embed] });
  },

  async saveConfig(guildId, automodConfig) {
    await db.update(guilds).set({ automodConfig }).where(eq(guilds.id, guildId));
  },

  sendHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🛡️ Gelişmiş AutoMod Sistemi')
      .addFields(
        { name: 'Özel Yasaklı Kelime Listesi (BWL)', value: '`!automod bwl ekle <kelime>`\n`!automod bwl sil <kelime>`\n`!automod bwl liste`' },
        { name: 'Rol/Kanal Muafiyetleri', value: '`!automod muafiyet ekle <@rol/#kanal>`\n`!automod muafiyet sil <@rol/#kanal>`\n`!automod muafiyet liste`' },
        { name: 'Durum Görüntüleme', value: '`!automod durum`' }
      );
    return message.reply({ embeds: [embed] });
  }
};
