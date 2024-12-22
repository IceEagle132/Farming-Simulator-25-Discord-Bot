
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const logger = require('./logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ]
});

// We keep a global collection of commands if we have text commands
client.commands = new Collection();
const prefix = config.prefix;

// Load cogs from the ./cogs directory, skipping any that deal with prices
const cogFiles = fs.readdirSync('./cogs').filter(file => file.endsWith('.js'));

for (const file of cogFiles) {
  // Optionally skip 'prices.js' if it still exists
  if (file === 'prices.js') {
    logger.info(`Skipping ${file} (no longer needed).`);
    continue;
  }

  const cog = require(`./cogs/${file}`);

  if (typeof cog === 'function') {
    // If the cog exports a function, run it (e.g., serverinfo, tasks, etc.)
    cog(client);
    logger.info(`Loaded cog: ${file}`);
  } else if (cog.name) {
    // If the cog exports a command object
    client.commands.set(cog.name, cog);
    logger.info(`Loaded command cog: ${cog.name}`);
  } else {
    logger.warn(`Failed to load cog: ${file} (No valid export)`);
  }
}

client.once('ready', () => {
  logger.info(`${client.user.tag} is online!`);
});

// Handle text commands
client.on('messageCreate', async (message) => {
  // Ignore non-prefix or bot messages
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // Parse the command
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  // Run the command
  try {
    logger.debug(`Executing command: ${commandName} by ${message.author.tag}`);
    await command.execute(message, args);
  } catch (error) {
    logger.error(`Error executing ${commandName}: ${error.stack}`);
    message.channel.send('❌ There was an error executing the command.');
  }
});

// Finally, log in using the bot token from config.json
client.login(config.bot_token);