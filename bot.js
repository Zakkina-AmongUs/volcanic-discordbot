const fs = require('fs');
const io = require("@pm2/io");
const dotenv = require('dotenv');
const config = require('./config.json');
const private = require("./IMPORTANT.json");

dotenv.config();
const { REST, Routes, Client, GatewayIntentBits, EmbedBuilder, MessageActivityType } = require('discord.js');
const { stringify } = require('querystring');

// Define commands
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

const rest = new REST({ version: '10' }).setToken(private.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(private.CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error reloading application (/) commands:', error);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const Shwdowtime = io.metric({
  name: 'Shwdow',
  id: 'bot/time/1',
});

const commandUses = io.meter({
  name: 'commands',
  id: 'command/usage/count',
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Setting bot's activity and status
  client.user.setActivity('you', { type: MessageActivityType.Watching });
  client.user.setStatus('dnd');
  
  // Set bot's nickname
  const newNickname = `${config.botName} ${config.botVersion} (<)`;
  try {

    const guild = await client.guilds.fetch("1275471583468847247");
    const botMember = guild.members.cache.get(client.user.id);
    
    if (botMember) {
      await botMember.setNickname(newNickname);
      console.log(`Nickname changed to "${newNickname}" in guild "${guild.name}".`);
    } else {
      console.error('Bot is not a member of the guild or the member cache is not available.');
    }
  } catch (error) {
    console.error('Error changing nickname:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

function fetchData(callback) {
  fs.readFile('./fetch/data.json', 'utf8', (error, data) => {
    if (error) {
      console.error('Failed to fetch data:', error.message);  // Log the error
      callback(null);  // Handle the error by returning null
      return;
    }
    console.log('Data fetched successfully:', data);  // Log the fetched data
    callback(JSON.parse(data));  // Parse and return the data
  });
}


client.on('messageCreate', async message => {
  try {
    commandUses.mark();

    if (!message.content.startsWith("<")) return;

    const args = message.content.slice(1).trim().split(' ');
    const command = args.shift().toLowerCase();
    
    // Check if user is banned from using the bot
    if (config.ban.includes(`<@${message.author.id}>`)) {
      return;
    }


    if (command === 'test') {
      message.channel.send('works :yay:');
    } else if (command === 'setprofile') {
      if (config.OwnerIDs.includes(message.author.id)) {
        if (args.length === 1 && (args[0].startsWith("http://") || args[0].startsWith("https://")) && args[0].includes("i.imgur.com/")) {
          try {
            await client.user.setAvatar(args[0]);
            message.channel.send("Set avatar to image:" + args[0]);
          } catch (error) {
            message.channel.send(error + "\n\nPlease DM _lostinthought_ (rain) with this error and a screenshot with AT LEAST 3 messages of context.");
          }
        } else {
          message.channel.send("Argument 1 not found or not a valid/supported URL.\nThe only supported URL is i.imgur.com/ as of bot version " + config.botVersion);
        }
      } else {
        message.channel.send("You are not permitted to perform this action.");
      }
    } else if (command === 'setname') {
      if (config.OwnerIDs.includes(message.author.id)) {
        await client.guilds.cache.get(message.guildId).setNickname("(>) " + "Volcanic v" + config.version);
        message.channel.send("Bot setup complete.");
      } else {
        message.channel.send("You are not permitted to perform this action.");
      }
    } else if (command === 'default') {
      if (config.OwnerIDs.includes(message.author.id)) {
        await client.guilds.cache.get(message.guildId).setNickname("(>) " + args[0]);
        message.channel.send("Bot setup complete.");
      } else {
        message.channel.send("You are not permitted to perform this action.");
      }
    } else if (command === 'platformer') {
      fetchData((data) => {
        if (data) {
          message.channel.send("Released: " + data.release + "\nWhen release? " + data.whenrelease);
        } else {
          message.channel.send("Failed to fetch platformer data.");
        }
      });
    } else if (command === 'info') {
      const info = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Volcanic ${config.botVersion}`)
        .setAuthor({ name: 'vai', iconURL: 'https://cdn.discordapp.com/avatars/1275461452055969826/d01d00a7f4ea72c315dc44f5b197123d.png', url: 'https://en.pronouns.page/@inner.rain' })
        .setDescription('Some description here')
        .setThumbnail('https://cdn.discordapp.com/avatars/1278744969279967273/fe11c3667f596300b2edb3eb450f69e8.png')
        .addFields(
          { name: 'Version:', value: `${config.botVersion}` },
          { name: '\u200B', value: '\u200B' },
          { name: 'dev:', value: 'inner.rain', inline: true },
        )
        .setTimestamp()

      message.channel.send({ embeds: [info] });
    } else if ((command === 'eval') && config.OwnerIDs.includes(message.author.id)) {
      // Safely evaluate code
      const code = args.join(' '); // Combine args into a single code string
      try {
        let evalResult = eval(code);

        // If the result is a promise, resolve it
        if (evalResult instanceof Promise) {
          evalResult = await evalResult;
        }

        // Convert the result to a string and send it as a message
        message.channel.send(`\`\`\`js\n${require('util').inspect(evalResult)}\n\`\`\``);
      } catch (error) {
        // If an error occurs during evaluation, send the error message
        message.channel.send(`\`\`\`js\n${error}\n\`\`\``);
      }
    }
  } catch (error) {
    message.channel.send(`\`\`\`${error}\`\`\`\n\nSomething went wrong. Context: ${message.content}\n\n`);
  }
});

// Separate event listener for botban and botunban commands
client.on('messageCreate', async message => {
  try {
    if (message.author.bot) return;
    if (!message.content.startsWith('<')) return;
    
    const args = message.content.slice(1).trim().split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'botban') {
      if (config.OwnerIDs.includes(message.author.id)) {
        const userId = args[0];
        if (!userId) {
          return message.channel.send("Please provide a user ID to ban.");
        }
        if (!config.ban) {
          config.ban = [];
        }
        if (!config.ban.includes(userId)) {
          config.ban.push(userId);
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), 'utf8');
          message.channel.send(`User ID ${userId} has been banned from using the bot. <:shwdow:1269277537910001797>`);
        } else {
          message.channel.send(`User ID ${userId} is already banned.`);
        }
      } else {
        message.channel.send("You are not permitted to perform this action.");
      }
    } else if (command === 'botunban') {
      if (config.OwnerIDs.includes(message.author.id)) {
        const userId = args[0];
        if (!userId) {
          return message.channel.send("Please provide a user ID to unban.");
        }
        if (config.ban && config.ban.includes(userId)) {
          config.ban = config.ban.filter(id => id !== userId);
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), 'utf8');
          message.channel.send(`User ID ${userId} has been unbanned from using the bot. <:rain:1269277891485761651>`);
        } else {
          message.channel.send(`User ID ${userId} is not banned.`);
        }
      } else {
        message.channel.send("You are not permitted to perform this action.");
      }
    }
  } catch (error) {
    message.channel.send(`${error}\n\nSomething went wrong. Context: ${message.content}\n\n`);
  }
});

client.login(private.DISCORD_TOKEN);
