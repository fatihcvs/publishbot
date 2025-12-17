const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'oyunkanal',
  aliases: ['gamechannel', 'lethekanalı'],
  description: 'Lethe Game komutlarının çalışacağı kanalları ayarla',
  category: 'settings',
  async execute(message, args, client, storage) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine ihtiyacın var.');
    }

    const subCommand = args[0]?.toLowerCase();
    const guildData = await storage.getGuild(message.guild.id);
    const modules = guildData?.modules || {};
    const allowedChannels = modules.letheChannels || [];

    if (!subCommand || subCommand === 'yardım') {
      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('🎮 Oyun Kanalı Ayarları')
        .setDescription('Lethe Game komutlarının hangi kanallarda çalışacağını ayarla.')
        .addFields(
          { name: '📌 Komutlar', value: 
            '`!oyunkanal ekle #kanal` - Kanal ekle\n' +
            '`!oyunkanal sil #kanal` - Kanal kaldır\n' +
            '`!oyunkanal liste` - İzin verilen kanalları listele\n' +
            '`!oyunkanal sıfırla` - Tüm kısıtlamaları kaldır (tüm kanallarda aktif)'
          },
          { name: '📝 Not', value: 'Hiç kanal eklenmemişse oyun tüm kanallarda çalışır.' }
        )
        .setFooter({ text: `Şu an ${allowedChannels.length} kanal izinli` });

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'ekle' || subCommand === 'add') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply('❌ Lütfen bir kanal etiketle veya kanal ID\'si gir.\n`!oyunkanal ekle #kanal`');
      }

      if (!channel.isTextBased()) {
        return message.reply('❌ Sadece metin kanalları eklenebilir.');
      }

      if (allowedChannels.includes(channel.id)) {
        return message.reply(`❌ <#${channel.id}> zaten oyun kanalları listesinde.`);
      }

      const newChannels = [...allowedChannels, channel.id];
      await storage.upsertGuild(message.guild.id, {
        modules: { ...modules, letheChannels: newChannels }
      });

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('✅ Kanal Eklendi')
        .setDescription(`<#${channel.id}> artık Lethe Game için izinli.`)
        .addFields({ name: 'Toplam İzinli Kanal', value: `${newChannels.length}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'sil' || subCommand === 'kaldır' || subCommand === 'remove') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply('❌ Lütfen bir kanal etiketle veya kanal ID\'si gir.\n`!oyunkanal sil #kanal`');
      }

      if (!allowedChannels.includes(channel.id)) {
        return message.reply(`❌ <#${channel.id}> zaten oyun kanalları listesinde değil.`);
      }

      const newChannels = allowedChannels.filter(id => id !== channel.id);
      await storage.upsertGuild(message.guild.id, {
        modules: { ...modules, letheChannels: newChannels }
      });

      const embed = new EmbedBuilder()
        .setColor('#f59e0b')
        .setTitle('🗑️ Kanal Kaldırıldı')
        .setDescription(`<#${channel.id}> artık oyun kanalı değil.`)
        .addFields({ name: 'Kalan İzinli Kanal', value: newChannels.length > 0 ? `${newChannels.length}` : 'Hiç (tüm kanallar aktif)' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'liste' || subCommand === 'list') {
      if (allowedChannels.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#6b7280')
          .setTitle('📋 Oyun Kanalları')
          .setDescription('Henüz özel kanal ayarlanmamış.\n**Lethe Game tüm kanallarda aktif.**')
          .setFooter({ text: 'Belirli kanallarla sınırlamak için: !oyunkanal ekle #kanal' });

        return message.reply({ embeds: [embed] });
      }

      const channelList = allowedChannels
        .map(id => `<#${id}>`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('📋 İzinli Oyun Kanalları')
        .setDescription(channelList)
        .addFields({ name: 'Toplam', value: `${allowedChannels.length} kanal` })
        .setFooter({ text: 'Sadece bu kanallarda Lethe Game komutları çalışır' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'sıfırla' || subCommand === 'reset') {
      await storage.upsertGuild(message.guild.id, {
        modules: { ...modules, letheChannels: [] }
      });

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('🔄 Sıfırlandı')
        .setDescription('Kanal kısıtlamaları kaldırıldı.\n**Lethe Game artık tüm kanallarda aktif.**')
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply('❓ Bilinmeyen alt komut. `!oyunkanal yardım` yazarak kullanımı öğrenebilirsin.');
  }
};
