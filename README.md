# FarmingSimulator25Bot
 A Simple Discord Bot For Farming Simulator 25

# Farming Simulator 25 Discord Bot

A customizable Discord bot designed to provide crop price history, best prices, and live server updates for Farming Simulator 25 players.

---

## Features

- **Crop Price History**:
  - Use `/prices <crop>` to display the price history and the best price with the optimal month for a specific crop.
  - Automatically refreshes pinned messages in the prices channel to match updated crop lists.
  
- **Server Updates**:
  - Displays live Farming Simulator 25 server stats, including player count, map name, vehicles, and installed mods.
  - Updates bot status to show the number of players online.

- **Customizable Settings**:
  - Configure channels, crops, and update intervals using `config.json`.

- **Cleanup Task**:
  - Periodically removes outdated messages in the prices channel for better organization.

---

## Setup

### Prerequisites
- Python 3.10 or later.
- A Discord bot token. (Learn how to create a bot [here](https://discordpy.readthedocs.io/en/stable/discord.html).)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/FarmingSimulator25Bot.git
   ```
   
2. **Navigate to the project folder:**
   ```bash
   cd FarmingSimulator25Bot
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file:**
   - Add your Discord bot token in the following format:
     ```plaintext
     DISCORD_BOT_TOKEN=your-discord-bot-token
     ```

5. **Configure `config.json`:**
   - Update the file with your specific server details:
     ```json
     {
         "server": {
             "stats_url": "http://your-server-url/feed/dedicated-server-stats.xml",
             "economy_url": "http://your-server-url/feed/dedicated-server-savegame.html?file=economy",
             "auto_update_channel_id": 123456789012345678
         },
         "channels": {
             "prices_channel_id": 123456789012345678
         },
         "cleanup_interval": 3600,
         "replacements": {
             "trainTrailer": "Trailer",
             "implement": "Truck",
             "weeder": "Weeder",
             "tractor": "Tractor",
             "motorbike": "Motorcycle",
             "trainTimberTrailer": "Flatbed Trailer"
         },
         "intervals": {
             "status_update_seconds": 60,
             "event_monitor_seconds": 60
         },
         "messages": {
             "server_update": "**Server Updates**\n🖥️ **Server Name:** {server_name}\n🗺️ **Map Name:** {map_name}\n👥 **Players Online:** {players_online}/{player_capacity}\n⏱️ **Farm Progress:** {hours} hours, {minutes} minutes\n\n🚜 **Vehicles:**\n{vehicles}\n\n🛠️ **Installed Mods:**\n{mods}\n\n💡 *This message updates every minute.*"
         },
         "common_fill_types": [
             "Wheat", "Barley", "Canola", "Oats", "Corn", "Sunflowers", "Soybeans",
             "Potatoes", "Rice", "Long Grain Rice", "Sugar Beet", "Sugarcane",
             "Cotton", "Sorghum", "Grapes", "Olives", "Poplar", "Red Beet", "Carrots",
             "Parsnip", "Green Beans", "Peas", "Spinach", "Grass", "Oilseed Radish"
         ]
     }
     ```

---

### Running the Bot

Run the bot with:
```bash
python farmsim.py
```

---

## Usage

### Commands

- `/prices`:
  - Displays a list of available crops.
- `/prices <crop>`:
  - Shows the price history and best price for a specific crop.

### Automatic Features

- **Pinned Message Refresh**:
  - Automatically updates the pinned message in the prices channel to reflect changes in `config.json`.

- **Live Server Stats**:
  - Monitors and updates server stats, player counts, and installed mods every minute.

- **Message Cleanup**:
  - Removes outdated messages in the prices channel (customizable via `cleanup_interval` in `config.json`).

---

## Example Configuration

### Crop List
A customizable crop list for `/prices`:
```json
"common_fill_types": [
    "Wheat", "Barley", "Canola", "Oats", "Corn", "Sunflowers", "Soybeans",
    "Potatoes", "Rice", "Long Grain Rice", "Sugar Beet", "Sugarcane",
    "Cotton", "Sorghum", "Grapes", "Olives", "Poplar", "Red Beet", "Carrots",
    "Parsnip", "Green Beans", "Peas", "Spinach", "Grass", "Oilseed Radish"
]
```

---

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
