const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionFlagsBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { storage } = require('./database/storage');
const { checkAutomod } = require('./modules/automod');
const { checkAutoPunishment } = require('./modules/autoPunish');
const { Scheduler } = require('./modules/scheduler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction]
});

client.commands = new Collection();
client.storage = storage;

const PREFIX = '!';

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => client.commands.set(alias, command));
    }
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

let scheduler;

client.once(Events.ClientReady, () => {
  console.log(`Publisher Bot online! ${client.user.tag} olarak giriş yapıldı.`);
  console.log(`${client.guilds.cache.size} sunucuda aktif.`);
  client.user.setActivity('!yardım | Publisher Bot', { type: 3 });
  
  scheduler = new Scheduler(client, storage);
  scheduler.start();
});

client.on(Events.GuildMemberAdd, async (member) => {
  const guildData = await storage.getGuild(member.guild.id);
  
  if (guildData?.autoRole) {
    try {
      const role = member.guild.roles.cache.get(guildData.autoRole);
      if (role) {
        await member.roles.add(role);
        console.log(`Oto-rol verildi: ${member.user.tag}`);
      }
    } catch (error) {
      console.error('Oto-rol hatası:', error);
    }
  }
  
  if (guildData?.welcomeChannel && guildData?.welcomeMessage) {
    try {
      const channel = member.guild.channels.cache.get(guildData.welcomeChannel);
      if (channel) {
        const welcomeMsg = guildData.welcomeMessage
          .replace(/{user}/g, member.toString())
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, member.guild.name)
          .replace(/{membercount}/g, member.guild.memberCount);
        
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Hoş Geldin!')
          .setDescription(welcomeMsg)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Hoş geldin mesajı hatası:', error);
    }
  }
  
  if (guildData?.logChannel) {
    try {
      const logChannel = member.guild.channels.cache.get(guildData.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Üye Katıldı')
          .setDescription(`${member.user.tag} sunucuya katıldı.`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'Hesap Oluşturulma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
          )
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Log hatası:', error);
    }
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  const guildData = await storage.getGuild(member.guild.id);
  
  if (guildData?.logChannel) {
    try {
      const logChannel = member.guild.channels.cache.get(guildData.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Üye Ayrıldı')
          .setDescription(`${member.user.tag} sunucudan ayrıldı.`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
          )
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Log hatası:', error);
    }
  }
});

client.on(Events.MessageDelete, async (message) => {
  if (!message.guild || message.author?.bot) return;
  
  const guildData = await storage.getGuild(message.guild.id);
  
  if (guildData?.logChannel) {
    try {
      const logChannel = message.guild.channels.cache.get(guildData.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#ff9900')
          .setTitle('Mesaj Silindi')
          .addFields(
            { name: 'Kanal', value: message.channel.toString(), inline: true },
            { name: 'Yazar', value: message.author?.tag || 'Bilinmiyor', inline: true },
            { name: 'İçerik', value: message.content?.slice(0, 1000) || 'İçerik yok' }
          )
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Log hatası:', error);
    }
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    
    const reactionRole = await storage.getReactionRole(reaction.message.id, reaction.emoji.name);
    if (reactionRole) {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role = reaction.message.guild.roles.cache.get(reactionRole.roleId);
      if (role && member) {
        await member.roles.add(role);
      }
    }
  } catch (error) {
    console.error('Reaction role add error:', error);
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    
    const reactionRole = await storage.getReactionRole(reaction.message.id, reaction.emoji.name);
    if (reactionRole) {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role = reaction.message.guild.roles.cache.get(reactionRole.roleId);
      if (role && member) {
        await member.roles.remove(role);
      }
    }
  } catch (error) {
    console.error('Reaction role remove error:', error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const afk = await storage.getAfk(message.guild.id, message.author.id);
  if (afk) {
    await storage.removeAfk(message.guild.id, message.author.id);
    const reply = await message.reply(`Tekrar hoş geldin! AFK durumun kaldırıldı. (<t:${Math.floor(new Date(afk.createdAt).getTime() / 1000)}:R> önce AFK oldunuz)`);
    setTimeout(() => reply.delete().catch(() => {}), 5000);
  }
  
  const mentionedUsers = message.mentions.users;
  for (const [userId, user] of mentionedUsers) {
    const userAfk = await storage.getAfk(message.guild.id, userId);
    if (userAfk) {
      message.reply(`${user.tag} şu anda AFK: ${userAfk.reason}`);
    }
  }
  
  const blocked = await checkAutomod(message, client, storage);
  if (blocked) return;
  
  const customCmd = await storage.getCustomCommand(message.guild.id, message.content.toLowerCase());
  if (customCmd) {
    return message.reply(customCmd.response);
  }
  
  if (!message.content.startsWith(PREFIX)) return;
  
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName);
  if (!command) return;
  
  if (command.permissions) {
    const hasPermission = message.member.permissions.has(command.permissions);
    if (!hasPermission) {
      return message.reply('Bu komutu kullanmak için yetkiniz yok!');
    }
  }
  
  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error('Komut hatası:', error);
    message.reply('Komut çalıştırılırken bir hata oluştu!');
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('DISCORD_BOT_TOKEN bulunamadı! Lütfen token\'ı ayarlayın.');
  process.exit(1);
}

client.login(token);

module.exports = { client };
