const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionFlagsBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { storage } = require('./database/storage');
const { checkAutomod } = require('./modules/automod');
const { checkAutoPunishment } = require('./modules/autoPunish');
const { Scheduler } = require('./modules/scheduler');
const { LogSystem } = require('./modules/logSystem');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites
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
let logSystem;

client.once(Events.ClientReady, () => {
  console.log(`Publisher Bot online! ${client.user.tag} olarak giriş yapıldı.`);
  console.log(`${client.guilds.cache.size} sunucuda aktif.`);
  client.user.setActivity('!yardım | Publisher Bot', { type: 3 });
  
  scheduler = new Scheduler(client, storage);
  scheduler.start();
  
  logSystem = new LogSystem(client, storage);
});

client.on(Events.GuildMemberAdd, async (member) => {
  const guildData = await storage.getGuild(member.guild.id);
  
  if (guildData?.autoRole) {
    try {
      const role = member.guild.roles.cache.get(guildData.autoRole);
      if (role) {
        await member.roles.add(role);
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
  
  if (logSystem) await logSystem.guildMemberAdd(member);
});

client.on(Events.GuildMemberRemove, async (member) => {
  if (logSystem) await logSystem.guildMemberRemove(member);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (logSystem) await logSystem.guildMemberUpdate(oldMember, newMember);
});

client.on(Events.MessageDelete, async (message) => {
  if (logSystem) await logSystem.messageDelete(message);
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (logSystem) await logSystem.messageUpdate(oldMessage, newMessage);
});

client.on(Events.ChannelCreate, async (channel) => {
  if (logSystem) await logSystem.channelCreate(channel);
});

client.on(Events.ChannelDelete, async (channel) => {
  if (logSystem) await logSystem.channelDelete(channel);
});

client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
  if (logSystem) await logSystem.channelUpdate(oldChannel, newChannel);
});

client.on(Events.GuildRoleCreate, async (role) => {
  if (logSystem) await logSystem.roleCreate(role);
});

client.on(Events.GuildRoleDelete, async (role) => {
  if (logSystem) await logSystem.roleDelete(role);
});

client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
  if (logSystem) await logSystem.roleUpdate(oldRole, newRole);
});

client.on(Events.GuildBanAdd, async (ban) => {
  if (logSystem) await logSystem.guildBanAdd(ban);
});

client.on(Events.GuildBanRemove, async (ban) => {
  if (logSystem) await logSystem.guildBanRemove(ban);
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (logSystem) await logSystem.voiceStateUpdate(oldState, newState);
});

client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
  if (logSystem) await logSystem.guildUpdate(oldGuild, newGuild);
});

client.on(Events.InviteCreate, async (invite) => {
  if (logSystem) await logSystem.inviteCreate(invite);
});

client.on(Events.InviteDelete, async (invite) => {
  if (logSystem) await logSystem.inviteDelete(invite);
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
