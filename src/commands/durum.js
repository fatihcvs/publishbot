const { EmbedBuilder } = require('discord.js');

// Bot sahibinin Discord ID'si (server.js ile aynı)
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || '259442832576741377';

// Discord activity type numaraları
const ACTIVITY_TYPES = {
    'oynuyor': { type: 0, label: 'Oynuyor' },
    'yayin': { type: 1, label: 'Yayın Yapıyor' },
    'yayin yapıyor': { type: 1, label: 'Yayın Yapıyor' },
    'dinliyor': { type: 2, label: 'Dinliyor' },
    'izliyor': { type: 3, label: 'İzliyor' },
    'rekabet': { type: 5, label: 'Rekabet Ediyor' }
};

module.exports = {
    name: 'durum',
    aliases: ['status', 'activity'],
    description: 'Bot\'un durum yazısını değiştirir (sadece bot sahibi)',
    usage: '!durum <tip> <yazı> | !durum sıfırla | !durum bilgi',
    // Örnek: !durum izliyor !yardım publisherbot.org
    // Örnek: !durum oynuyor Lethe Game
    // Örnek: !durum dinliyor Lo-fi Music

    async execute(message, args, client) {
        // ─── Yalnızca bot sahibi kullanabilir ───────────────────────────────────
        if (!BOT_OWNER_ID) {
            return message.reply('❌ `BOT_OWNER_ID` ortam değişkeni ayarlanmamış! `.env` dosyasına ekleyin.');
        }

        if (message.author.id !== BOT_OWNER_ID) {
            return message.reply('🔒 Bu komutu yalnızca **bot sahibi** kullanabilir.');
        }
        // ────────────────────────────────────────────────────────────────────────

        if (!args.length || args[0] === 'bilgi') {
            const current = client.user.presence?.activities?.[0];
            const typeMap = { 0: 'Oynuyor', 1: 'Yayın Yapıyor', 2: 'Dinliyor', 3: 'İzliyor', 5: 'Rekabet Ediyor' };

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎮 Bot Durum Yönetimi')
                .setDescription('Botun Discord\'da görünen "durum yazısını" değiştirmek için bu komutu kullan.')
                .addFields(
                    {
                        name: '📌 Mevcut Durum',
                        value: current
                            ? `**${typeMap[current.type] || 'Bilinmiyor'}** → ${current.name}`
                            : '*(durum yok)*'
                    },
                    {
                        name: '📋 Kullanım',
                        value: [
                            '`!durum <tip> <yazı>` — Durumu değiştir',
                            '`!durum sıfırla` — Varsayılan duruma dön',
                            '`!durum bilgi` — Bu yardım mesajı'
                        ].join('\n')
                    },
                    {
                        name: '🏷️ Durum Tipleri',
                        value: [
                            '`oynuyor` → 🎮 Oynuyor...',
                            '`dinliyor` → 🎵 Dinliyor...',
                            '`izliyor` → 📺 İzliyor...',
                            '`yayin` → 📡 Yayın Yapıyor...',
                            '`rekabet` → 🏆 Rekabet Ediyor...'
                        ].join('\n')
                    },
                    {
                        name: '💡 Örnekler',
                        value: [
                            '`!durum izliyor !yardım publisherbot.org`',
                            '`!durum oynuyor Lethe Game`',
                            '`!durum dinliyor Lo-fi Music`'
                        ].join('\n')
                    }
                )
                .setFooter({ text: '🔒 Yalnızca bot sahibi kullanabilir' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // !durum sıfırla — varsayılan duruma dön
        if (args[0].toLowerCase() === 'sıfırla' || args[0].toLowerCase() === 'sifirla') {
            const defaultStatus = '!yardım publisherbot.org';
            await client.user.setActivity(defaultStatus, { type: 3 }); // 3 = İzliyor

            const embed = new EmbedBuilder()
                .setColor('#57f287')
                .setTitle('✅ Durum Sıfırlandı')
                .setDescription(`Durum varsayılan ayara döndürüldü:\n**İzliyor** → \`${defaultStatus}\``)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // !durum <tip> <yazı>
        const tipAdi = args[0].toLowerCase();
        const tipBilgi = ACTIVITY_TYPES[tipAdi];

        if (!tipBilgi) {
            const gecerliTipler = Object.keys(ACTIVITY_TYPES).map(t => `\`${t}\``).join(', ');
            return message.reply(`❌ Geçersiz durum tipi! Kullanılabilir tipler: ${gecerliTipler}`);
        }

        const yazı = args.slice(1).join(' ');
        if (!yazı) {
            return message.reply('❌ Durum yazısı belirtmelisin! Örnek: `!durum izliyor !yardım publisherbot.org`');
        }

        if (yazı.length > 128) {
            return message.reply('❌ Durum yazısı en fazla 128 karakter olabilir!');
        }

        try {
            await client.user.setActivity(yazı, { type: tipBilgi.type });

            const embed = new EmbedBuilder()
                .setColor('#57f287')
                .setTitle('✅ Durum Güncellendi')
                .addFields(
                    { name: 'Tip', value: `**${tipBilgi.label}**`, inline: true },
                    { name: 'Yazı', value: `\`${yazı}\``, inline: true }
                )
                .setFooter({ text: `Değiştiren: ${message.author.tag}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[Durum] Activity güncelleme hatası:', error);
            return message.reply('❌ Durum güncellenirken bir hata oluştu!');
        }
    }
};
