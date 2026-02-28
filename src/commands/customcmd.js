const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
  name: 'komutekle',
  aliases: ['addcommand', 'addcmd', 'özel-komut', 'ozel-komut', 'customcmd'],
  description: 'Özel komut ekler/siler/listeler. Embed ve kanal kısıtı destekli.',
  usage: '!komutekle <ad> <yanıt> [--kanal #kanal] [--embed]',
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'sil' || sub === 'delete' || sub === 'remove') {
      return this.deleteCmd(message, args.slice(1));
    }
    if (sub === 'liste' || sub === 'list') {
      return this.listCmds(message);
    }
    if (sub === 'ekle' || sub === 'add') {
      return this.addCmd(message, args.slice(1));
    }

    // Geriye uyumluluk: !komutekle <ad> <yanıt> (eski format)
    const cmdName = args[0]?.toLowerCase();
    const rest = args.slice(1).join(' ');
    if (cmdName && rest && !['sil', 'liste', 'ekle', 'delete', 'list', 'add'].includes(cmdName)) {
      return this.addCmd(message, args);
    }

    return this.sendHelp(message);
  },

  async addCmd(message, args) {
    // --kanal ve --embed flaglarını ayrıştır
    const fullText = args.join(' ');
    const chnMatch = fullText.match(/--kanal\s+<#(\d+)>/);
    const isEmbed = /--embed/i.test(fullText);
    const channelId = chnMatch?.[1] || null;

    const clean = fullText
      .replace(/--kanal\s+<#\d+>/, '')
      .replace(/--embed/i, '')
      .trim().split(/\s+/);

    const cmdName = clean[0]?.toLowerCase();
    const response = clean.slice(1).join(' ');

    if (!cmdName || !response) {
      return message.reply('❌ Kullanım: `!komutekle ekle <ad> <yanıt> [--kanal #kanal] [--embed]`').catch(() => { });
    }

    // Rezerv komut adı kontrolü
    const reserved = ['yardım', 'help', 'warn', 'ban', 'kick', 'mute', 'vaka', 'anket'];
    if (reserved.includes(cmdName)) {
      return message.reply(`❌ \`${cmdName}\` rezerv komut adı, kullanılamaz.`).catch(() => { });
    }

    // Yanıtı embed JSON formatında veya düz metin olarak sakla
    let storedResponse = response;
    if (isEmbed) {
      // Embed: başlık ve içeriği "Başlık | İçerik" şeklinde ayrıştır
      const parts = response.split(' | ');
      const embedData = { __embed: true, title: parts[0] || response, description: parts[1] || '' };
      storedResponse = JSON.stringify(embedData);
    } else if (channelId) {
      const chanData = { __channelOnly: channelId, text: response };
      storedResponse = JSON.stringify(chanData);
    }

    const existing = await storage.getCustomCommand(message.guild.id, cmdName);
    if (existing) await storage.deleteCustomCommand(message.guild.id, cmdName);

    await storage.addCustomCommand(message.guild.id, cmdName, storedResponse, message.author.id);

    const flags = [];
    if (isEmbed) flags.push('Embed ✅');
    if (channelId) flags.push(`Kanal: <#${channelId}>`);

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('✅ Özel Komut Eklendi')
      .addFields(
        { name: 'Komut', value: `!${cmdName}`, inline: true },
        { name: 'Yanıt', value: response.slice(0, 80) + (response.length > 80 ? '…' : ''), inline: true }
      )
      .setTimestamp();

    if (flags.length) embed.addFields({ name: 'Özellikler', value: flags.join(' • ') });
    return message.reply({ embeds: [embed] }).catch(() => { });
  },

  async deleteCmd(message, args) {
    const cmdName = args[0]?.toLowerCase();
    if (!cmdName) return message.reply('❌ Kullanım: `!komutekle sil <ad>`').catch(() => { });
    const existing = await storage.getCustomCommand(message.guild.id, cmdName);
    if (!existing) return message.reply('Bu komut bulunamadı.').catch(() => { });
    await storage.deleteCustomCommand(message.guild.id, cmdName);
    return message.reply(`✅ \`!${cmdName}\` komutu silindi.`).catch(() => { });
  },

  async listCmds(message) {
    const cmds = await storage.getCustomCommands(message.guild.id);
    if (!cmds || cmds.length === 0) return message.reply('Bu sunucuda özel komut yok.').catch(() => { });

    const lines = cmds.map(c => {
      let flag = '';
      try { const p = JSON.parse(c.response); if (p.__embed) flag = '📋'; else if (p.__channelOnly) flag = `📌<#${p.__channelOnly}>`; } catch { }
      return `• \`!${c.name}\` ${flag}`;
    });

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`⚙️ Özel Komutlar (${cmds.length})`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: '!komutekle sil <ad> ile silebilirsiniz.' })
      .setTimestamp();

    return message.reply({ embeds: [embed] }).catch(() => { });
  },

  sendHelp(message) {
    const embed = new EmbedBuilder().setColor('#FFA500').setTitle('⚙️ Özel Komut Sistemi')
      .addFields(
        { name: 'Ekle', value: '`!komutekle ekle <ad> <yanıt> [--embed] [--kanal #kanal]`' },
        { name: 'Sil', value: '`!komutekle sil <ad>`' },
        { name: 'Listele', value: '`!komutekle liste`' },
        { name: 'Embed Yanıt', value: '`!komutekle ekle selam Merhaba! | Sunucuya hoş geldin --embed`' },
        { name: 'Kanal Kısıtı', value: '`!komutekle ekle info Sunucu bilgisi --kanal #genel`' }
      );
    return message.reply({ embeds: [embed] }).catch(() => { });
  }
};
