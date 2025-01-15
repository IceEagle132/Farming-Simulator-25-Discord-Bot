const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const config = require('../config.json');
const logger = require('../logger');
const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = require('fs');

let previousPlayers = [];
let playerSessions = {};

// Define the directory and file path
const DATA_DIR = path.join(__dirname, '..', 'data'); // Adjust the path as needed
const PLAYTIME_FILE = path.join(DATA_DIR, 'playerPlaytime.json');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`Created data directory at ${DATA_DIR}`);
}

// Initialize playtime file if it doesn't exist
function initializePlaytimeFile() {
    if (!fs.existsSync(PLAYTIME_FILE)) {
        try {
            fs.writeFileSync(PLAYTIME_FILE, JSON.stringify({}, null, 2));
            logger.info('Initialized playerPlaytime.json with an empty object.');
        } catch (error) {
            logger.error(`Failed to initialize playtime file: ${error.message}`);
        }
    }
}

initializePlaytimeFile();

// Load previous playtime from file
function loadPlaytimeData() {
    if (fs.existsSync(PLAYTIME_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(PLAYTIME_FILE, 'utf8'));
        } catch (error) {
            logger.error(`Failed to parse playtime data: ${error.message}. Resetting playtime data.`);
            return {};
        }
    }
    return {};
}

// Save updated playtime data asynchronously
async function savePlaytimeData(data) {
    try {
        await fsPromises.writeFile(PLAYTIME_FILE, JSON.stringify(data, null, 2));
        logger.debug('Playtime data saved successfully.');
    } catch (error) {
        logger.error(`Failed to save playtime data: ${error.message}`);
    }
}

let playtimeData = loadPlaytimeData();

module.exports = (client) => {
    client.once('ready', async () => {
        logger.info('Player status monitor with playtime tracking started.');
        await checkPlayerStatus(client);
        setInterval(() => checkPlayerStatus(client), 60_000); // Every 60 seconds
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
        const serverNameStringToRemove = config.server.server_name_string_to_remove || '';
        let serverName = data?.Server?.$?.name || 'the farm server';
        serverName = serverName.replace(serverNameStringToRemove, '');
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
                    logger.info(`Started tracking playtime for ${name} at ${new Date(playerSessions[name]).toISOString()}`);
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
                    .setTitle(config.messages.player_joined_title)
                    .setDescription(config.messages.player_joined_description
                        .replace('{player_name}', player.name)
                        .replace('{admin_note}', adminNote)
                        .replace('{server_name}', serverName))
                    .setTimestamp(new Date());

                await channel.send({ embeds: [embed] });
            }

            for (const player of left) {
                const adminNote = player.isAdmin ? ' (Admin)' : '';
                const totalPlaytimeSeconds = calculatePlaytime(player.name);
                const totalPlaytime = formatPlaytime(totalPlaytimeSeconds);

                const embed = new EmbedBuilder()
                    .setColor(0xed4245)
                    .setTitle(config.messages.player_left_title)
                    .setDescription(config.messages.player_left_description
                        .replace('{player_name}', player.name)
                        .replace('{admin_note}', adminNote)
                        .replace('{server_name}', serverName)
                        .replace('{total_playtime}', totalPlaytime))
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
    if (!sessionStart) return playtimeData[playerName] || 0; // Return existing playtime if session not found

    const sessionDurationSeconds = Math.floor((Date.now() - sessionStart) / 1000); // in seconds
    delete playerSessions[playerName]; // Properly remove the session

    if (!playtimeData[playerName]) {
        playtimeData[playerName] = 0;
    }
    playtimeData[playerName] += sessionDurationSeconds;

    savePlaytimeData(playtimeData); // Note: This is asynchronous

    logger.info(`Updated playtime for ${playerName}: ${playtimeData[playerName]} seconds total.`);
    return playtimeData[playerName];
}

// Helper function to format seconds into 'Xm Ys'
function formatPlaytime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}
