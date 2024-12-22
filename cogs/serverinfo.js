const { EmbedBuilder, TextChannel } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const { fetchCareerSavegame } = require('../utils');
const config = require('../config.json');
const fs = require('fs');
const logger = require('../logger');

const EMBED_TRACKER_PATH = './embedTracker.json';

// Safe field addition to avoid empty/undefined values
function addFieldSafe(embed, name, value, inline = true) {
    logger.debug(`Attempting to add field: ${name} - ${value}`);
    if (value && value !== 'undefined' && value !== '') {
        if (name.length > 256) name = name.substring(0, 253) + '...';
        if (value.length > 1024) value = value.substring(0, 1021) + '...';
        embed.addFields({ 
            name: String(name).trim(), 
            value: String(value).trim(), 
            inline: inline 
        });
    } else {
        logger.warn(`Skipping empty or invalid field: ${name} - ${value}`);
    }
}

// Improved server status check using XML parsing
async function isServerOnline() {
    try {
        logger.info(`Fetching server stats from: ${config.server.stats_url}`);
        const response = await axios.get(config.server.stats_url, { timeout: 10_000 });

        if (!response.data.trim()) {
            throw new Error('Empty response from server stats URL.');
        }

        const data = await parseStringPromise(response.data, { explicitArray: false });

        if (!data?.Server?.Slots?.$) {
            throw new Error('Missing <Server> or <Slots> in the XML.');
        }

        logger.info('Server status check: Online');
        return true;

    } catch (error) {
        logger.warn(`Server offline or failed to fetch stats: ${error.message}`);
        return false;
    }
}

// Main embed updater
async function postOrUpdateEmbed(client) {
    logger.info('Checking for existing embed to update...');

    const channelId = config.channels.serverinfo_channel_id;
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            logger.error(`Invalid channel: ${channelId}`);
            return;
        }
        logger.info(`Channel found: ${channel.name}`);

        const serverOnline = await isServerOnline();
        let statusText = serverOnline ? '🟢 Online' : '🔴 Offline';
        let embedColor = serverOnline ? 0x2ecc71 : 0xe74c3c;

        // Fetch savegame data only if server is online
        let savegameData = null;

        if (serverOnline) {
            savegameData = await fetchCareerSavegame();
            if (!savegameData || !savegameData.careerSavegame) {
                logger.warn('Savegame data missing, but server remains marked online.');
            }
        } else {
            logger.warn('Server offline. Skipping savegame fetch.');
            savegameData = null;
        }

        const savegame = savegameData ? savegameData.careerSavegame : {};
        const settings = savegame.settings ? savegame.settings[0] : {};
        const statistics = savegame.statistics ? savegame.statistics[0] : {};

        const data = {
            mapTitle: settings.mapTitle || 'Unknown',
            savegameName: settings.savegameName || 'Unknown',
            saveDate: settings.saveDate || 'Unknown',
            creationDate: settings.creationDate || 'Unknown',
            economicDifficulty: settings.economicDifficulty || 'Normal',
            initialMoney: settings.initialMoney || '0',
            initialLoan: settings.initialLoan || '0',
            timeScale: settings.timeScale || '1.0',
            trafficEnabled: settings.trafficEnabled === 'true' ? 'Yes' : 'No',
            fruitDestruction: settings.fruitDestruction === 'true' ? 'Enabled' : 'Disabled',
            weedsEnabled: settings.weedsEnabled === 'true' ? 'Yes' : 'No',
            stonesEnabled: settings.stonesEnabled === 'true' ? 'Yes' : 'No',
            snowEnabled: settings.isSnowEnabled === 'true' ? 'Yes' : 'No',
            fuelUsage: settings.fuelUsage || '0',
            helperBuyFuel: settings.helperBuyFuel === 'true' ? 'Yes' : 'No',
            helperBuySeeds: settings.helperBuySeeds === 'true' ? 'Yes' : 'No',
            helperBuyFertilizer: settings.helperBuyFertilizer === 'true' ? 'Yes' : 'No',
            money: statistics.money || '0',
            playTime: statistics.playTime ? (statistics.playTime / 60).toFixed(1) : '0.0'
        };

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('🌐 Farming Simulator - Server Info')
            .setDescription(`Server Status: **${statusText}**`)
            .setFooter({ text: 'Last Updated:' })
            .setTimestamp();

        addFieldSafe(embed, '🗺️ Map Name', data.mapTitle);
        addFieldSafe(embed, '💾 Savegame Name', data.savegameName);
        addFieldSafe(embed, '💾 Save Date', data.saveDate);
        addFieldSafe(embed, '🛠️ Creation Date', data.creationDate);
        addFieldSafe(embed, '⚙️ Difficulty', data.economicDifficulty);
        addFieldSafe(embed, '💰 Current Money', `$${parseInt(data.money || '0').toLocaleString()}`);
        addFieldSafe(embed, '⏳ Time Scale', `${data.timeScale}x`);
        addFieldSafe(embed, '🚦 Traffic Enabled', data.trafficEnabled);
        addFieldSafe(embed, '🌱 Weeds Enabled', data.weedsEnabled);
        addFieldSafe(embed, '🪨 Stones Enabled', data.stonesEnabled);
        addFieldSafe(embed, '❄️ Snow Enabled', data.snowEnabled);
        addFieldSafe(embed, '🌾 Fruit Destruction', data.fruitDestruction);
        addFieldSafe(embed, '⛽ Fuel Usage', data.fuelUsage);
        addFieldSafe(embed, '🕒 Playtime', `${data.playTime} hours`);
        addFieldSafe(embed, '🏦 Initial Loan', `$${parseInt(data.initialLoan || '0').toLocaleString()}`);
        addFieldSafe(embed, '💼 Initial Money', `$${parseInt(data.initialMoney || '0').toLocaleString()}`);
        addFieldSafe(embed, '👨‍🌾 Helper Buys Fuel', data.helperBuyFuel);
        addFieldSafe(embed, '🌾 Helper Buys Seeds', data.helperBuySeeds);
        addFieldSafe(embed, '💧 Helper Buys Fertilizer', data.helperBuyFertilizer);

        if (config.server.enable_mod_list) {
            const modListUrl = config.server.mod_list_url || 'N/A';
            addFieldSafe(embed, '🗂️ Mod List', `[View Mods](${modListUrl})`, false);
        }

        if (config.server.enable_server_password) {
            const serverPassword = config.server.server_password || 'N/A';
            addFieldSafe(embed, '🔑 Server Password', `||${serverPassword}||`, false);
        }

        let embedTracker = {};
        if (fs.existsSync(EMBED_TRACKER_PATH)) {
            embedTracker = JSON.parse(fs.readFileSync(EMBED_TRACKER_PATH, 'utf-8'));
        }

        if (embedTracker.serverinfo_message_id) {
            try {
                const message = await channel.messages.fetch(embedTracker.serverinfo_message_id);
                await message.edit({ embeds: [embed] });
                logger.info(`Embed updated successfully: ${message.id}`);
            } catch (fetchError) {
                logger.warn('Embed message not found. Sending a new one.');
                const sentMessage = await channel.send({ embeds: [embed] });
                embedTracker.serverinfo_message_id = sentMessage.id;
                fs.writeFileSync(EMBED_TRACKER_PATH, JSON.stringify(embedTracker, null, 2));
            }
        } else {
            const sentMessage = await channel.send({ embeds: [embed] });
            embedTracker.serverinfo_message_id = sentMessage.id;
            fs.writeFileSync(EMBED_TRACKER_PATH, JSON.stringify(embedTracker, null, 2));
            logger.info(`Embed posted: ${sentMessage.id}`);
        }
    } catch (error) {
        logger.error(`Failed to post or update embed: ${error.stack}`);
    }
}

module.exports = (client) => {
    client.once('ready', async () => {
        await postOrUpdateEmbed(client);
    });

    const updateInterval = config.intervals.serverinfo_update_minutes * 30 * 1000;
    setInterval(async () => {
        await postOrUpdateEmbed(client);
    }, updateInterval);
};