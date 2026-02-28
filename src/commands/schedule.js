const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'zamanlı',
  aliases: ['schedule', 'zamanli', 'otomesaj', 'autosend'],
  description: 'Zamanlanmış mesajları yönetir. Embed ve tek seferlik desteği.',
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const sub = args[0]?.toLowerCase();

    if (sub === 'ekle' || sub === 'add') return this.add(message, args.slice(1), storage);
    if (sub === 'sil' || sub === 'delete' || sub === 'remove') return this.del(message, args.slice(1), storage);
    if (sub === 'liste' || sub === 'list') return this.list(message, storage);
    if (sub === 'toggle' || sub === 'aç' || sub === 'kapat') return this.toggle(message, args, storage);
    if (sub === 'değiştir' || sub === 'degistir' || sub === 'edit') return this.edit(message, args.slice(1));
    return this.sendHelp(message);
  },

  async add(message, args, storage) {
    const fullText = args.join(' ');
    const isEmbed = /--embed/i.test(fullText);
    const tekMatch = fullText.match(/--tek\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Kanal etiketleyin.\nKullanım: `!zamanlı ekle #kanal <dakika> <mesaj> [--embed]`').catch(() => { });
    }

    const clean = fullText
      .replace(/<#\d+>/, '')
      .replace(/--embed/i, '')
      .replace(/--tek\s+[\d\-\s:]+/, '')
      .trim().split(/\s+/);

    let intervalMinutes = parseInt(clean[0]);
    let oneShot = null;

    if (tekMatch) {
      oneShot = new Date(tekMatch[1]);
      intervalMinutes = 0;
      if (isNaN(oneShot.getTime()) || oneShot <= new Date()) {
        return message.reply('❌ Geçerli ve gelecekteki bir tarih girin. Örnek: `2026-03-15 20:00`').catch(() => { });
      }
    } else if (!intervalMinutes || intervalMinutes < 1 || intervalMinutes > 10080) {
      return message.reply('❌ Geçerli aralık: 1-10080 dakika (maks 1 hafta).').catch(() => { });
    }

    let msgContent = clean.slice(1).join(' ');
    if (!msgContent) return message.reply('❌ Mesaj içeriği boş olamaz!').catch(() => { });

    if (isEmbed) {
      const parts = msgContent.split(' | ');
      msgContent = JSON.stringify({ __embed: true, title: parts[0], description: parts[1] || '' });
    }

    try {
      const scheduled = await storage.addScheduledMessage(
        message.guild.id,
        channel.id,
        msgContent,
        oneShot ? 0 : intervalMinutes,
        message.author.id
      );

      const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('✅ Zamanlanmış Mesaj Eklendi')
        .addFields(
          { name: 'Kanal', value: channel.toString(), inline: true },
          { name: oneShot ? 'Tarih' : 'Aralık', value: oneShot ? `<t:${Math.floor(oneShot.getTime() / 1000)}:F>` : `${intervalMinutes} dakika`, inline: true },
          { name: 'ID', value: `#${scheduled.id}`, inline: true },
          { name: 'Mesaj', value: isEmbed ? '_(Embed formatında)_' : msgContent.substring(0, 120) }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] }).catch(() => { });
    } catch (err) {
      console.error('[schedule.add]', err);
      return message.reply('❌ Mesaj eklenirken hata oluştu!').catch(() => { });
    }
  },

  async del(message, args, storage) {
    const id = parseInt(args[0]);
    if (!id) return message.reply('❌ Kullanım: `!zamanlı sil <id>`').catch(() => { });
    await storage.deleteScheduledMessage(id).catch(() => { });
    return message.reply(`✅ Zamanlanmış mesaj #${id} silindi!`).catch(() => { });
  },

  async list(message, storage) {
    const messages = await storage.getScheduledMessages(message.guild.id);
    if (!messages.length) return message.reply('Bu sunucuda zamanlanmış mesaj yok.').catch(() => { });
    const lines = messages.map(m => {
      const ch = message.guild.channels.cache.get(m.channelId);
      const status = m.enabled ? '🟢' : '🔴';
      let preview = m.message;
      try { const p = JSON.parse(m.message); if (p.__embed) preview = `[Embed] ${p.title}`; } catch { }
      return `${status} **#${m.id}** ${ch || '?'} — ${m.intervalMinutes ? `${m.intervalMinutes}dk` : 'Tek seferlik'}\n└ "${preview.substring(0, 60)}"`;
    });
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📅 Zamanlanmış Mesajlar')
        .setDescription(lines.join('\n\n'))
        .setTimestamp()]
    }).catch(() => { });
  },

  async toggle(message, args, storage) {
    const sub = args[0]?.toLowerCase();
    const id = parseInt(args[1]);
    if (!id) return message.reply('❌ Kullanım: `!zamanlı aç/kapat <id>`').catch(() => { });
    const enable = sub === 'aç' || sub === 'on';
    await storage.toggleScheduledMessage(id, enable).catch(() => { });
    return message.reply(`✅ #${id} ${enable ? 'açıldı' : 'kapatıldı'}.`).catch(() => { });
  },

  async edit(message, args) {
    const id = parseInt(args[0]);
    const newMsg = args.slice(1).join(' ');
    if (!id || !newMsg) return message.reply('❌ Kullanım: `!zamanlı değiştir <id> <yeni mesaj>`').catch(() => { });
    try {
      const { db } = require('../database/db');
      const { scheduledMessages } = require('../../shared/schema');
      const { eq } = require('drizzle-orm');
      await db.update(scheduledMessages).set({ message: newMsg }).where(eq(scheduledMessages.id, id));
      return message.reply(`✅ #${id} güncellendi.`).catch(() => { });
    } catch { return message.reply('❌ Güncellenemedi.').catch(() => { }); }
  },

  sendHelp(message) {
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📅 Zamanlanmış Mesaj Sistemi')
        .addFields(
          { name: 'Ekle (tekrar)', value: '`!zamanlı ekle #kanal <dakika> <mesaj> [--embed]`' },
          { name: 'Ekle (tek seferlik)', value: '`!zamanlı ekle #kanal 0 <mesaj> --tek 2026-03-15 20:00`' },
          { name: 'Sil', value: '`!zamanlı sil <id>`' },
          { name: 'Listele', value: '`!zamanlı liste`' },
          { name: 'Aç/Kapat', value: '`!zamanlı aç <id>` / `!zamanlı kapat <id>`' },
          { name: 'Düzenle', value: '`!zamanlı değiştir <id> <yeni mesaj>`' },
          { name: 'Embed örnek', value: '`!zamanlı ekle #kanal 60 "Başlık | İçerik buraya" --embed`' }
        )]
    }).catch(() => { });
  }
};
