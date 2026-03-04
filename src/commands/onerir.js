const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'önerir',
    aliases: ['onerir', 'suggest', 'tavsiye'],
    description: 'Sunucu kurulumunu analiz ederek AI\'nın önerilerini sunar.',
    usage: '!önerir',

    async execute(message, args, client, storage) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ Bu komut için **Sunucuyu Yönet** iznine ihtiyacınız var.');
        }

        const thinking = await message.reply('🤖 Sunucu kurulumu analiz ediliyor...').catch(() => null);

        try {
            const OpenAI = require('openai');
            const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
            if (!openai) return thinking?.edit('❌ OpenAI API anahtarı yapılandırılmamış.');

            const guildData = await storage.getGuild(message.guild.id);
            const settings = guildData || {};

            // Sunucu durumu özeti
            const status = {
                'Hoşgeldin Kanalı': settings.welcomeChannel ? '✅' : '❌',
                'Mod Log Kanalı': settings.modLogChannel ? '✅' : '❌',
                'AutoMod': settings.automodConfig && Object.keys(settings.automodConfig).length > 0 ? '✅' : '❌',
                'Anti-Raid': settings.antiraidConfig?.enabled ? '✅' : '❌',
                'Seviye Sistemi': settings.modules?.leveling ? '✅' : '❌',
                'Tepki Rolleri': settings.modules?.reactionroles ? '✅' : '❌',
                'Ticket Sistemi': settings.ticketCategory ? '✅' : '❌',
                'Müzik (DJ Rolü)': settings.modules?.music ? '✅' : '❌',
                'Premium': settings.premium ? `✅ (${settings.premiumPlan})` : '❌',
            };

            const statusText = Object.entries(status).map(([k, v]) => `${v} ${k}`).join('\n');

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Sen bir Discord sunucu yönetim uzmanısın. Verilen sunucu kurulum durumuna göre en önemli 4-5 öneriyi Türkçe maddeler halinde ver. Her öneri pratik ve uygulanabilir olsun.'
                    },
                    {
                        role: 'user',
                        content: `Sunucu adı: "${message.guild.name}", Üye sayısı: ${message.guild.memberCount}\n\nKurulum durumu:\n${statusText}\n\nBu sunucu için ne önerirsin?`
                    }
                ],
                max_tokens: 600
            });

            const suggestions = response.choices[0]?.message?.content || 'Öneri üretilemedi.';

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('💡 Sunucu Kurulum Önerileri')
                .addFields(
                    { name: '📊 Mevcut Durum', value: statusText, inline: false },
                    { name: '🤖 AI Önerileri', value: suggestions, inline: false }
                )
                .setThumbnail(message.guild.iconURL())
                .setFooter({ text: 'Publisher AI • GPT-4o-mini' })
                .setTimestamp();

            await thinking?.edit({ content: null, embeds: [embed] });
        } catch (err) {
            await thinking?.edit(`❌ Hata: ${err.message}`);
        }
    }
};
