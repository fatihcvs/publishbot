const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ara',
  aliases: ['search', 'youtube', 'yt'],
  description: 'YouTube veya Google araması yapar',
  async execute(message, args, client) {
    const query = args.join(' ');
    
    if (!query) {
      return message.reply('Kullanım: `!ara <arama terimi>`\nÖrnek: `!ara müzik videosu`');
    }

    const encodedQuery = encodeURIComponent(query);

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`🔍 Arama: "${query}"`)
      .setDescription('Aşağıdaki linklerden arama sonuçlarına ulaşabilirsiniz:')
      .addFields(
        { name: '🎬 YouTube', value: `[YouTube'da Ara](https://www.youtube.com/results?search_query=${encodedQuery})`, inline: true },
        { name: '🔍 Google', value: `[Google'da Ara](https://www.google.com/search?q=${encodedQuery})`, inline: true },
        { name: '🎵 Spotify', value: `[Spotify'da Ara](https://open.spotify.com/search/${encodedQuery})`, inline: true },
        { name: '📺 Twitch', value: `[Twitch'te Ara](https://www.twitch.tv/search?term=${encodedQuery})`, inline: true },
        { name: '🎮 Steam', value: `[Steam'de Ara](https://store.steampowered.com/search/?term=${encodedQuery})`, inline: true },
        { name: '📚 Wikipedia', value: `[Wikipedia'da Ara](https://tr.wikipedia.org/wiki/Special:Search?search=${encodedQuery})`, inline: true }
      )
      .setFooter({ text: `${message.author.tag} tarafından arandı` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
