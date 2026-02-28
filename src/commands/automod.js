const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { guilds } = require('../../shared/schema');
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
      case 'bwl': case 'kelime':
        return this.handleBadWords(message, args.slice(1), storage);
      case 'muafiyet': case 'bypass': case 'exempt':
        return this.handleExemptions(message, args.slice(1), storage);
      case 'regex':
        return this.handleRegex(message, args.slice(1), storage);
      case 'whitelist': case 'izin':
        return this.handleWhitelist(message, args.slice(1), storage);
      case 'duplikat': case 'duplicate': case 'dup':
        return this.handleDuplicate(message, args.slice(1), storage);
      case 'durum': case 'status':
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
    if (!automodConfig.badWords) automodConfig.badWords = { enabled: true, words: [], action: 'delete' };
    if (!automodConfig.badWords.words) automodConfig.badWords.words = [];
    let wordsList = automodConfig.badWords.words;
    if (action === 'ekle' || action === 'add') {
      const word = args.slice(1).join(' ').toLowerCase();
      if (!word) return message.reply('Lütfen eklenecek kelimeyi girin.');
      if (wordsList.includes(word)) return message.reply('Bu kelime zaten listede!');
      wordsList.push(word);
      automodConfig.badWords.words = wordsList;
      automodConfig.badWords.enabled = true;
      automodConfig.enabled = true;
      await this.saveConfig(message.guild.id, automodConfig);
      return message.reply(`✅ \`${word}\` yasaklı kelime listesine eklendi.`);
    } else if (action === 'sil' || action === 'remove') {
      const word = args.slice(1).join(' ').toLowerCase();
      if (!wordsList.includes(word)) return message.reply('Bu kelime listede yok.');
      automodConfig.badWords.words = wordsList.filter(w => w !== word);
      await this.saveConfig(message.guild.id, automodConfig);
      return message.reply(`✅ \`${word}\` listeden silindi.`);
    } else if (action === 'liste' || action === 'list') {
      if (wordsList.length === 0) return message.reply('Yasaklı kelime listesi boş.');
      const embed = new EmbedBuilder().setColor('#ED4245').setTitle('🚫 Yasaklı Kelimeler')
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
        return message.reply(`✅ <@&${role.id}> muaf tutuldu.`);
      } else if (channel) {
        if (automodConfig.exemptChannels.includes(channel.id)) return message.reply('Bu kanal zaten muaf.');
        automodConfig.exemptChannels.push(channel.id);
        await this.saveConfig(message.guild.id, automodConfig);
        return message.reply(`✅ <#${channel.id}> muaf tutuldu.`);
      }
      return message.reply('❌ Bir rol veya kanal etiketleyin.');
    } else if (action === 'sil' || action === 'remove') {
      const role = message.mentions.roles.first();
      const channel = message.mentions.channels.first();
      if (role) {
        automodConfig.exemptRoles = automodConfig.exemptRoles.filter(id => id !== role.id);
        await this.saveConfig(message.guild.id, automodConfig);
        return message.reply(`✅ <@&${role.id}> muafiyeti kaldırıldı.`);
      } else if (channel) {
        automodConfig.exemptChannels = automodConfig.exemptChannels.filter(id => id !== channel.id);
        await this.saveConfig(message.guild.id, automodConfig);
        return message.reply(`✅ <#${channel.id}> muafiyeti kaldırıldı.`);
      }
    } else if (action === 'liste' || action === 'list') {
      let desc = '**Muaf Roller:**\n' + (automodConfig.exemptRoles.length > 0 ? automodConfig.exemptRoles.map(id => `• <@&${id}>`).join('\n') : 'Yok');
      desc += '\n\n**Muaf Kanallar:**\n' + (automodConfig.exemptChannels.length > 0 ? automodConfig.exemptChannels.map(id => `• <#${id}>`).join('\n') : 'Yok');
      return message.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('🛡️ Muafiyetler').setDescription(desc)] });
    }
  },

  async handleRegex(message, args, storage) {
    if (!args[0]) return message.reply('❌ Kullanım: `!automod regex [ekle/sil/liste] [pattern]`');
    const action = args[0].toLowerCase();
    const guildData = await storage.getGuild(message.guild.id);
    let cfg = guildData.automodConfig || {};
    if (!cfg.regexFilter) cfg.regexFilter = { enabled: false, patterns: [], action: 'delete' };
    if (!cfg.regexFilter.patterns) cfg.regexFilter.patterns = [];

    if (action === 'ekle' || action === 'add') {
      const pattern = args.slice(1).join(' ');
      if (!pattern) return message.reply('Lütfen regex pattern giriniz.');
      try { new RegExp(pattern); } catch { return message.reply('❌ Geçersiz regex pattern!'); }
      if (cfg.regexFilter.patterns.includes(pattern)) return message.reply('Bu pattern zaten kayıtlı.');
      cfg.regexFilter.patterns.push(pattern);
      cfg.regexFilter.enabled = true;
      cfg.enabled = true;
      await this.saveConfig(message.guild.id, cfg);
      return message.reply(`✅ Regex pattern eklendi: \`${pattern}\``);
    } else if (action === 'sil' || action === 'remove') {
      const idx = parseInt(args[1]) - 1;
      if (isNaN(idx) || !cfg.regexFilter.patterns[idx]) return message.reply('Geçersiz numara. `!automod regex liste` ile numaraları görün.');
      const removed = cfg.regexFilter.patterns.splice(idx, 1);
      if (cfg.regexFilter.patterns.length === 0) cfg.regexFilter.enabled = false;
      await this.saveConfig(message.guild.id, cfg);
      return message.reply(`✅ Pattern silindi: \`${removed[0]}\``);
    } else if (action === 'liste' || action === 'list') {
      if (!cfg.regexFilter.patterns.length) return message.reply('Kayıtlı regex pattern yok.');
      return message.reply({
        embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('🔍 Regex Filtreleri')
          .setDescription(cfg.regexFilter.patterns.map((p, i) => `**${i + 1}.** \`${p}\``).join('\n'))]
      });
    }
  },

  async handleWhitelist(message, args, storage) {
    if (!args[0]) return message.reply('❌ Kullanım: `!automod whitelist [ekle/sil/liste] [domain]`');
    const action = args[0].toLowerCase();
    const guildData = await storage.getGuild(message.guild.id);
    let cfg = guildData.automodConfig || {};
    if (!cfg.linkFilter) cfg.linkFilter = { enabled: false, whitelist: [], action: 'delete' };
    if (!cfg.linkFilter.whitelist) cfg.linkFilter.whitelist = [];

    if (action === 'ekle' || action === 'add') {
      const domain = args[1]?.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      if (!domain) return message.reply('Lütfen bir domain girin (ör: discord.com).');
      if (cfg.linkFilter.whitelist.includes(domain)) return message.reply('Bu domain zaten listede.');
      cfg.linkFilter.whitelist.push(domain);
      await this.saveConfig(message.guild.id, cfg);
      return message.reply(`✅ \`${domain}\` link whitelist'e eklendi.`);
    } else if (action === 'sil' || action === 'remove') {
      const domain = args[1]?.toLowerCase();
      cfg.linkFilter.whitelist = cfg.linkFilter.whitelist.filter(d => d !== domain);
      await this.saveConfig(message.guild.id, cfg);
      return message.reply(`✅ \`${domain}\` whitelist'ten silindi.`);
    } else if (action === 'liste' || action === 'list') {
      if (!cfg.linkFilter.whitelist.length) return message.reply('Whitelist boş.');
      return message.reply({
        embeds: [new EmbedBuilder().setColor('#57F287').setTitle('✅ Link Whitelist')
          .setDescription(cfg.linkFilter.whitelist.map(d => `• \`${d}\``).join('\n'))]
      });
    }
  },

  async handleDuplicate(message, args, storage) {
    const action = args[0]?.toLowerCase();
    if (!action) return message.reply('❌ Kullanım: `!automod duplikat [aç/kapat]`');
    const guildData = await storage.getGuild(message.guild.id);
    let cfg = guildData.automodConfig || {};
    if (!cfg.duplicateFilter) cfg.duplicateFilter = { enabled: false, action: 'delete' };
    if (action === 'aç' || action === 'ac' || action === 'on') {
      cfg.duplicateFilter.enabled = true;
      cfg.enabled = true;
      await this.saveConfig(message.guild.id, cfg);
      return message.reply('✅ Duplikat mesaj filtresi **açıldı**.');
    } else if (action === 'kapat' || action === 'off') {
      cfg.duplicateFilter.enabled = false;
      await this.saveConfig(message.guild.id, cfg);
      return message.reply('✅ Duplikat mesaj filtresi **kapatıldı**.');
    }
  },

  async showStatus(message, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    const conf = guildData.automodConfig || {};
    const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🛡️ AutoMod Durumu')
      .addFields(
        { name: 'Genel', value: conf.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
        { name: 'Yasaklı Kelime', value: `${conf.badWords?.words?.length || 0} kelime`, inline: true },
        { name: 'Muafiyetler', value: `${(conf.exemptRoles?.length || 0) + (conf.exemptChannels?.length || 0)} rol/kanal`, inline: true },
        { name: 'Regex Filtreler', value: `${conf.regexFilter?.patterns?.length || 0} pattern`, inline: true },
        { name: 'Link Whitelist', value: `${conf.linkFilter?.whitelist?.length || 0} domain`, inline: true },
        { name: 'Duplikat Filtre', value: conf.duplicateFilter?.enabled ? '✅ Açık' : '❌ Kapalı', inline: true }
      );
    return message.reply({ embeds: [embed] });
  },

  async saveConfig(guildId, automodConfig) {
    await db.update(guilds).set({ automodConfig }).where(eq(guilds.id, guildId));
  },

  sendHelp(message) {
    const embed = new EmbedBuilder().setColor('#FFA500').setTitle('🛡️ AutoMod Sistemi')
      .addFields(
        { name: 'Yasaklı Kelimeler', value: '`!automod bwl ekle/sil/liste <kelime>`' },
        { name: 'Muafiyetler', value: '`!automod muafiyet ekle/sil/liste <@rol/#kanal>`' },
        { name: 'Regex Filtre', value: '`!automod regex ekle/sil/liste <pattern>`' },
        { name: 'Link Whitelist', value: '`!automod whitelist ekle/sil/liste <domain>`' },
        { name: 'Duplikat Filtre', value: '`!automod duplikat aç/kapat`' },
        { name: 'Durum', value: '`!automod durum`' }
      );
    return message.reply({ embeds: [embed] });
  }
};
