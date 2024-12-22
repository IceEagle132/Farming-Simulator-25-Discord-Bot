const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const config = require('../config.json');
const logger = require('../logger');
const fs = require('fs');

let previousPlayers = [];
let playerSessions = {};
const PLAYTIME_FILE = './playerPlaytime.json';

// Load previous playtime from file
function loadPlaytimeData() {
    if (fs.existsSync(PLAYTIME_FILE)) {
        return JSON.parse(fs.readFileSync(PLAYTIME_FILE, 'utf8'));
    }
    return {};
}

// Save updated playtime data
function savePlaytimeData(data) {
    fs.writeFileSync(PLAYTIME_FILE, JSON.stringify(data, null, 2));
}

let playtimeData = loadPlaytimeData();

module.exports = (client) => {
    client.once('ready', async () => {
        logger.info('Player status monitor with playtime tracking started.');
        await checkPlayerStatus(client);
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

        const data = await parseStringPromise(response.data, { explicitArray: false });
        const serverName = data?.Server?.$?.name || 'the farm server';
        const slots = data?.Server?.Slots;
        if (!slots || !slots.Player) {
            throw new Error('No <Player> elements found in <Slots>.');
        }

        const playerNodes = Array.isArray(slots.Player) ? slots.Player : [slots.Player];
        const currentPlayers = [];

        playerNodes.forEach((playerNode) => {
            if (playerNode.$.isUsed === 'true') {
                let name = playerNode._;
                if (!name || !name.trim()) {
                    name = 'Unknown';
                }
                const isAdmin = (playerNode.$.isAdmin === 'true');
                currentPlayers.push({ name, isAdmin });

                // Start tracking playtime if not already
                if (!playerSessions[name]) {
                    playerSessions[name] = Date.now();
                    logger.info(`Started tracking playtime for ${name}`);
                }
            }
        });

        // Compare players to detect join/leave events
        const joined = currentPlayers.filter(cp => !previousPlayers.some(pp => pp.name === cp.name));
        const left = previousPlayers.filter(pp => !currentPlayers.some(cp => cp.name === pp.name));

        const channelId = config.channels.player_status_channel_id;
        const channel = client.channels.cache.get(channelId);

        if (channel) {
            for (const player of joined) {
                const adminNote = player.isAdmin ? ' (Admin)' : '';
                const embed = new EmbedBuilder()
                    .setColor(0x57f287)
                    .setTitle('Player Joined')
                    .setDescription(`**${player.name}**${adminNote} has joined ${serverName}!`)
                    .setTimestamp(new Date());

                await channel.send({ embeds: [embed] });
            }

            for (const player of left) {
                const adminNote = player.isAdmin ? ' (Admin)' : '';
                const playtime = calculatePlaytime(player.name);
                const embed = new EmbedBuilder()
                    .setColor(0xed4245)
                    .setTitle('Player Left')
                    .setDescription(`**${player.name}**${adminNote} has left ${serverName}. Total playtime: **${playtime} minutes**`)
                    .setTimestamp(new Date());

                await channel.send({ embeds: [embed] });
            }
        }

        // Update previous players list
        previousPlayers = currentPlayers;
    } catch (error) {
        logger.warn(`Failed to fetch or parse FS server stats: ${error.message}`);
    }
}

// Calculate playtime for a player and update stored data
function calculatePlaytime(playerName) {
    const sessionStart = playerSessions[playerName];
    if (!sessionStart) return 0;

    const sessionDuration = Math.floor((Date.now() - sessionStart) / 60000);  // in minutes
    playerSessions[playerName] = null;  // Clear session

    if (!playtimeData[playerName]) {
        playtimeData[playerName] = 0;
    }
    playtimeData[playerName] += sessionDuration;

    savePlaytimeData(playtimeData);
    logger.info(`Updated playtime for ${playerName}: ${playtimeData[playerName]} minutes total.`);
    return sessionDuration;
}