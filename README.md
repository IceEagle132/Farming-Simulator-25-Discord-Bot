# Farming Simulator 25 Discord Bot

A customizable Discord bot designed to provide crop price history, best prices, player status, and live server updates for Farming Simulator 25 players.

**Supported Hosting Options**
- **VPS (Virtual Private Server)** ✅
- **Home Hosted** ✅
- Other hosting options ❌ *Not Supported* - *To Be Added*

---

## Features
- Updates Discord channels with Farming Simulator server status.
- Announces player joins and leaves with optional admin tags.
- Customizable embeds for server info and player activity.

---

## Prerequisites

1. **Install Node.js**: [Download Node.js](https://nodejs.org/) and install the latest LTS version.
2. **Install Git**: [Download Git](https://git-scm.com/) and install it if not already installed.

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/IceEagle132/Farming-Simulator-25-Discord-Bot.git
   cd Farming-Simulator-25-Discord-Bot
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Edit the Config File**:
   Open `config.json` and update the following:
   - **Bot Token**: Add your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications).
   - **Channel IDs**: Replace placeholders with your specific Discord channel IDs.
   - **Server URLs**: Input your Farming Simulator server's `stats_url`, `mod_list_url`, and `career_savegame_url`.
   - **Update Interval**: Customize the intervals for updates in minutes.

4. **Optional**: Enable or disable features:
   - Set `mod_list_url` to `null` to disable the Mod List feature.
   - Set `server_password` to `null` to disable the Server Password display.

---

## Running The Bot

**Edit the Bot Config Settings before running the bot.**

1. Ensure all dependencies are installed and the `config.json` file is properly configured.
2. Run the bot using:
   ```bash
   node bot.js
   ```
3. The bot will log into Discord and start providing updates based on the configuration.

---

## Issues and Support

If you encounter any issues, feel free to reach out to me on Discord: **IceEagle132**

![Contact](https://github.com/user-attachments/assets/be45bb0c-58c2-4c75-a2e1-9a424bac0309)

---

## Contributing

Contributions are welcome! Feel free to submit pull requests to improve functionality or fix bugs.

---

## License

This project is licensed under the MIT License.
