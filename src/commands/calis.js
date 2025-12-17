const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'çalış',
  aliases: ['c', 'calis', 'work', 'iş', 'is'],
  description: 'Çalışarak para kazan',
  usage: '!çalış [meslek]',
  category: 'lethe',
  
  async execute(message, args, client) {
    const userId = message.author.id;
    
    try {
      const subCommand = args[0]?.toLowerCase();
      
      if (subCommand === 'meslek' || subCommand === 'job' || subCommand === 'değiştir') {
        const newJob = args[1]?.toLowerCase();
        const jobs = letheStorage.jobs;
        
        if (!newJob) {
          const jobList = Object.entries(jobs).map(([id, job]) => {
            return `${job.emoji} **${job.name}** (\`${id}\`)\n💰 ${job.minPay}-${job.maxPay} | Bonus: ${job.bonus}`;
          }).join('\n\n');
          
          const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('👔 Meslekler')
            .setDescription('Meslek değiştirmek için: `!çalış meslek <meslek_id>`')
            .addFields({ name: 'Mevcut Meslekler', value: jobList });
          
          return message.reply({ embeds: [embed] });
        }
        
        const result = await letheStorage.changeJob(userId, newJob);
        
        if (!result.success) {
          return message.reply(result.error);
        }
        
        const embed = new EmbedBuilder()
          .setColor('#10B981')
          .setTitle('👔 Meslek Değiştirildi!')
          .setDescription(`Artık **${result.job.emoji} ${result.job.name}** olarak çalışıyorsun!`)
          .addFields(
            { name: '💰 Kazanç', value: `${result.job.minPay}-${result.job.maxPay}`, inline: true },
            { name: '⭐ Bonus', value: result.job.bonus, inline: true }
          );
        
        return message.reply({ embeds: [embed] });
      }
      
      if (subCommand === 'durum' || subCommand === 'status') {
        const status = await letheStorage.getWorkStatus(userId);
        
        const embed = new EmbedBuilder()
          .setColor('#6366F1')
          .setTitle(`${status.job.emoji} İş Durumu`)
          .addFields(
            { name: '👔 Meslek', value: status.job.name, inline: true },
            { name: '📊 Çalışma', value: `${status.totalWorked} kez`, inline: true },
            { name: '💰 Toplam', value: `${status.totalEarned.toLocaleString()}`, inline: true }
          );
        
        if (status.canWork) {
          embed.addFields({
            name: '✅ Durum',
            value: 'Çalışmaya hazırsın! `!çalış` yaz.',
            inline: false
          });
        } else {
          embed.addFields({
            name: '⏳ Durum',
            value: `**${status.minutesLeft} dakika** sonra tekrar çalışabilirsin.`,
            inline: false
          });
        }
        
        return message.reply({ embeds: [embed] });
      }
      
      const result = await letheStorage.doWork(userId);
      
      if (!result.success) {
        const embed = new EmbedBuilder()
          .setColor('#EF4444')
          .setTitle('😴 Dinlenme Zamanı')
          .setDescription(result.error);
        
        return message.reply({ embeds: [embed] });
      }
      
      const workMessages = [
        `${result.job.emoji} **${result.job.name}** olarak çok çalıştın!`,
        `${result.job.emoji} Harika bir iş çıkardın!`,
        `${result.job.emoji} Patronun senden çok memnun!`,
        `${result.job.emoji} Bugün verimli bir gün geçirdin!`,
        `${result.job.emoji} Emeklerin karşılığını aldın!`
      ];
      
      const randomMessage = workMessages[Math.floor(Math.random() * workMessages.length)];
      
      const embed = new EmbedBuilder()
        .setColor('#10B981')
        .setTitle('💼 Çalışma Tamamlandı!')
        .setDescription(randomMessage)
        .addFields(
          { name: '💰 Kazanç', value: `+${result.earned}`, inline: true },
          { name: '📊 Toplam', value: `${result.totalWorked} kez`, inline: true }
        )
        .setFooter({ text: '30 dakika sonra tekrar çalışabilirsin! | !çalış meslek' });
      
      return message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Work command error:', error);
      return message.reply('Çalışma sırasında bir hata oluştu!');
    }
  }
};
