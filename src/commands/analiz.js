const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'analiz',
    aliases: ['analyze', 'kanalanaliz'],
    description: 'Belirtilen kanalın aktivitesini AI ile analiz eder.',
    usage: '!analiz [#kanal]',

    async execute(message, args, client, storage) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Bu komut için **Mesajları Yönet** iznine ihtiyacınız var.');
        }

        // Kanal tespiti
        const target = message.mentions.channels.first() || message.channel;
        if (!target.isTextBased()) return message.reply('❌ Sadece metin kanalları analiz edilebilir.');

        const thinking = await message.reply(`🔍 **#${target.name}** kanalı analiz ediliyor...`).catch(() => null);

        try {
            const OpenAI = require('openai');
            const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
            if (!openai) return thinking?.edit('❌ OpenAI API anahtarı yapılandırılmamış.');

            const messages = await target.messages.fetch({ limit: 50 });
            const sorted = messages
                .filter(m => !m.author.bot)
                .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            if (sorted.size < 3) return thinking?.edit('❌ Analiz için en az 3 mesaj gerekli.');

            // Aktivite istatistikleri
            const userCount = new Set(sorted.map(m => m.author.id)).size;
            const totalMsgs = sorted.size;
            const avgLen = Math.round(sorted.reduce((s, m) => s + m.content.length, 0) / totalMsgs);
            const dateRange = sorted.last()?.createdAt?.toLocaleDateString('tr-TR') + ' — ' + sorted.first()?.createdAt?.toLocaleDateString('tr-TR');

            const conversation = sorted
                .map(m => `${m.author.username}: ${m.content.slice(0, 200)}`)
                .join('\n');

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Sen bir Discord topluluk analistisin. Verilen kanal konuşmasını Türkçe analiz et. Şunları belirt: 1) Ana konular 2) Genel ton (pozitif/negatif/nötr) 3) En aktif kullanıcı tipleri 4) Öneriler. Kısa ve net ol.'
                    },
                    {
                        role: 'user',
                        content: `Kanal: #${target.name}\nMesaj sayısı: ${totalMsgs}, Katılımcı: ${userCount}\n\nKonuşma:\n${conversation}`
                    }
                ],
                max_tokens: 600
            });

            const analysis = response.choices[0]?.message?.content || 'Analiz üretilemedi.';

            const embed = new EmbedBuilder()
                .setColor('#EB459E')
                .setTitle(`🔍 #${target.name} — Kanal Analizi`)
                .addFields(
                    {
                        name: '📊 İstatistikler',
                        value: `• ${totalMsgs} mesaj\n• ${userCount} katılımcı\n• Ort. ${avgLen} karakter\n• ${dateRange}`,
                        inline: true
                    },
                    { name: '🤖 AI Değerlendirme', value: analysis, inline: false }
                )
                .setFooter({ text: 'Publisher AI • GPT-4o-mini' })
                .setTimestamp();

            await thinking?.edit({ content: null, embeds: [embed] });
        } catch (err) {
            await thinking?.edit(`❌ Hata: ${err.message}`);
        }
    }
};
