// ./cogs/playerstatus.js

const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const config = require('../config.json');
const logger = require('../logger');

// Keep track of players who were online last time we checked
let previousPlayers = [];

module.exports = (client) => {
  client.once('ready', async () => {
    logger.info('Player status monitor (embed version) started.');

    // Run one check right away
    await checkPlayerStatus(client);

    // Then check again every 60 seconds (change as needed)
    setInterval(() => checkPlayerStatus(client), 60_000);
  });
};

async function checkPlayerStatus(client) {
  try {
    const statsUrl = config.server.stats_url; 
    logger.debug(`Fetching FS server stats from: ${statsUrl}`);

    const response = await axios.get(statsUrl, { timeout: 10_000 });
    if (!response.data.trim()) {
      throw new Error('Empty response from the FS server stats.');
    }

    // Parse the XML
    const data = await parseStringPromise(response.data, { explicitArray: false });

    // Grab the server name from the <Server name="..." ...> attribute
    const serverName = data?.Server?.$?.name || 'the farm server';

    // Example XML structure:
    // <Server name="DavisFi Farming" ...>
    //   <Slots capacity="16" numUsed="2">
    //     <Player isUsed="true" isAdmin="false">Davis</Player>
    //     <Player isUsed="true" isAdmin="true">Tomje</Player>
    //     ...
    //   </Slots>
    // </Server>
    const slots = data?.Server?.Slots;
    if (!slots || !slots.Player) {
      throw new Error('No <Player> elements found in <Slots>.');
    }

    // Convert 'slots.Player' to an array if it's not already
    const playerNodes = Array.isArray(slots.Player) ? slots.Player : [slots.Player];

    // Build a list of current (online) players
    const currentPlayers = [];
    playerNodes.forEach((playerNode) => {
      // We only care about players that have isUsed="true"
      if (playerNode.$.isUsed === 'true') {
        // The player's name is stored in playerNode._ (text content), not in an attribute
        let name = playerNode._; 
        // If name is missing or empty, fallback to "Unknown"
        if (!name || !name.trim()) {
          name = 'Unknown';
        }

        const isAdmin = (playerNode.$.isAdmin === 'true');
        currentPlayers.push({ name, isAdmin });
      }
    });

    // Compare currentPlayers to previousPlayers to find who joined/left
    const joined = currentPlayers.filter(
      (cp) => !previousPlayers.some((pp) => pp.name === cp.name)
    );
    const left = previousPlayers.filter(
      (pp) => !currentPlayers.some((cp) => cp.name === pp.name)
    );

    // If there's any join/leave, announce it via embeds
    if (joined.length > 0 || left.length > 0) {
      const channelId = config.channels.player_status_channel_id; 
      // e.g. "123456789012345678"
      const channel = client.channels.cache.get(channelId);

      if (!channel) {
        logger.warn(`playerstatus: Could not find channel ID: ${channelId}`);
      } else {
        // Announce joins
        for (const player of joined) {
          const adminNote = player.isAdmin ? ' (Admin)' : '';
          const embed = new EmbedBuilder()
            .setColor(0x57f287) // green-ish
            .setTitle('Player Joined')
            // Use the actual server name here
            .setDescription(`**${player.name}**${adminNote} has joined ${serverName}!`)
            .setTimestamp(new Date());
          
          await channel.send({ embeds: [embed] });
        }

        // Announce leaves
        for (const player of left) {
          const adminNote = player.isAdmin ? ' (Admin)' : '';
          const embed = new EmbedBuilder()
            .setColor(0xed4245) // red-ish
            .setTitle('Player Left')
            // Use the actual server name here
            .setDescription(`**${player.name}**${adminNote} has left ${serverName}.`)
            .setTimestamp(new Date());
          
          await channel.send({ embeds: [embed] });
        }
      }
    }

    // Update our tracking for next time
    previousPlayers = currentPlayers;

  } catch (error) {
    logger.warn(`Failed to fetch or parse FS server stats: ${error.message}`);
  }
}