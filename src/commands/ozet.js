const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'özet',
    aliases: ['ozet', 'summarize', 'tldr'],
    description: 'Kanalın son N mesajını yapay zeka ile özetler.',
    usage: '!özet [mesaj sayısı]',

    async execute(message, args, client, storage) {
        let limit = parseInt(args[0]) || 20;
        if (limit < 5) limit = 5;
        if (limit > 50) limit = 50;

        const thinking = await message.reply('🤔 Mesajlar okunuyor ve özetleniyor...').catch(() => null);

        try {
            const OpenAI = require('openai');
            const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
            if (!openai) return thinking?.edit('❌ OpenAI API anahtarı yapılandırılmamış.');

            // Son N mesajı al (bot mesajları hariç)
            const messages = await message.channel.messages.fetch({ limit: limit + 1 });
            const lines = messages
                .filter(m => !m.author.bot && m.id !== message.id)
                .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                .map(m => `${m.author.username}: ${m.content.slice(0, 300)}`)
                .join('\n');

            if (!lines.trim()) return thinking?.edit('❌ Özetlenecek mesaj bulunamadı.');

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Sen bir Discord kanal analistisin. Verilen konuşmayı kısa ve net Türkçe maddeler halinde özetle. Maksimum 5 madde, emoji kullan.'
                    },
                    { role: 'user', content: `Şu Discord konuşmasını özetle:\n\n${lines}` }
                ],
                max_tokens: 500
            });

            const summary = response.choices[0]?.message?.content || 'Özet oluşturulamadı.';

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📋 Son ${limit} Mesajın Özeti`)
                .setDescription(summary)
                .setFooter({ text: `#${message.channel.name} • GPT-4o-mini` })
                .setTimestamp();

            await thinking?.edit({ content: null, embeds: [embed] });
        } catch (err) {
            await thinking?.edit(`❌ Hata: ${err.message}`);
        }
    }
};
