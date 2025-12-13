const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'automod',
  aliases: ['otomod'],
  description: 'AutoMod ayarlarını yönetir',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const subCommand = args[0]?.toLowerCase();
    const guildData = await storage.getGuild(message.guild.id) || {};
    const config = guildData.automodConfig || { enabled: false };
    
    if (!subCommand || subCommand === 'durum' || subCommand === 'status') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('AutoMod Ayarları')
        .addFields(
          { name: 'Durum', value: config.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
          { name: 'Spam Filtresi', value: config.spamFilter?.enabled ? '✅' : '❌', inline: true },
          { name: 'Caps Filtresi', value: config.capsFilter?.enabled ? '✅' : '❌', inline: true },
          { name: 'Kötü Kelime', value: config.badWords?.enabled ? '✅' : '❌', inline: true },
          { name: 'Link Filtresi', value: config.linkFilter?.enabled ? '✅' : '❌', inline: true },
          { name: 'Davet Filtresi', value: config.inviteFilter?.enabled ? '✅' : '❌', inline: true },
          { name: 'Etiket Spam', value: config.mentionSpam?.enabled ? '✅' : '❌', inline: true },
          { name: 'Emoji Spam', value: config.emojiSpam?.enabled ? '✅' : '❌', inline: true }
        )
        .setDescription('Ayarları değiştirmek için:\n`!automod aç/kapat`\n`!automod <filtre> aç/kapat`\n`!automod kelime ekle/sil <kelime>`')
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'aç' || subCommand === 'enable') {
      config.enabled = true;
      await storage.upsertGuild(message.guild.id, { automodConfig: config });
      return message.reply('AutoMod aktif edildi!');
    }
    
    if (subCommand === 'kapat' || subCommand === 'disable') {
      config.enabled = false;
      await storage.upsertGuild(message.guild.id, { automodConfig: config });
      return message.reply('AutoMod kapatıldı!');
    }
    
    const filterTypes = {
      'spam': 'spamFilter',
      'caps': 'capsFilter',
      'kelime': 'badWords',
      'link': 'linkFilter',
      'davet': 'inviteFilter',
      'etiket': 'mentionSpam',
      'emoji': 'emojiSpam'
    };
    
    const filterKey = filterTypes[subCommand];
    if (filterKey && (args[1] === 'aç' || args[1] === 'kapat')) {
      if (!config[filterKey]) config[filterKey] = { enabled: false };
      config[filterKey].enabled = args[1] === 'aç';
      await storage.upsertGuild(message.guild.id, { automodConfig: config });
      return message.reply(`${subCommand} filtresi ${args[1] === 'aç' ? 'aktif edildi' : 'kapatıldı'}!`);
    }
    
    if (subCommand === 'kelime') {
      if (!config.badWords) config.badWords = { enabled: false, words: [] };
      
      if (args[1] === 'ekle' && args[2]) {
        const word = args.slice(2).join(' ').toLowerCase();
        if (!config.badWords.words.includes(word)) {
          config.badWords.words.push(word);
          await storage.upsertGuild(message.guild.id, { automodConfig: config });
          return message.reply(`"${word}" yasaklı kelimeler listesine eklendi.`);
        }
        return message.reply('Bu kelime zaten listede!');
      }
      
      if (args[1] === 'sil' && args[2]) {
        const word = args.slice(2).join(' ').toLowerCase();
        config.badWords.words = config.badWords.words.filter(w => w !== word);
        await storage.upsertGuild(message.guild.id, { automodConfig: config });
        return message.reply(`"${word}" yasaklı kelimeler listesinden silindi.`);
      }
      
      if (args[1] === 'liste') {
        const words = config.badWords.words || [];
        return message.reply(`Yasaklı kelimeler: ${words.length > 0 ? words.map(w => `\`${w}\``).join(', ') : 'Yok'}`);
      }
    }
    
    message.reply('Geçersiz komut! `!automod` yazarak tüm ayarları görün.');
  }
};
