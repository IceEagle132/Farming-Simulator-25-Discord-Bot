# Farming Simulator 25 Discord Bot

A customizable Discord bot designed to provide crop price history, best prices, and live server updates for Farming Simulator 25 players.

**Supported Hosting Options**

- **VPS (Virtual Private Server)** ✅
- **Home Hosted** ✅
- Other hosting options ❌ *Not Supported* - *To Be Added*


# Add Me on Discord if you have any issues: IceEagle132
![image](https://github.com/user-attachments/assets/be45bb0c-58c2-4c75-a2e1-9a424bac0309)


---

## Features

- **Crop Price History**:
  - Use `/prices <crop>` to display the price history and the best price with the optimal month for a specific crop.
  - Automatically refreshes pinned messages in the prices channel to match updated crop lists.

  ![Crop Price Command](https://i.imgur.com/rsL6Z4C.png "Crop Price Command Example")
  
- **Server Updates**:
  - Displays live Farming Simulator 25 server stats, including player count, map name, vehicles, and installed mods.
  - Updates bot status to show the number of players online.

  ![image](https://github.com/user-attachments/assets/89c50293-6e93-4746-aa4f-f1f8457c4be0)
  ![Server Status](https://i.imgur.com/UDr5TnO.png "Server Status Example")

  ![image](https://github.com/user-attachments/assets/ffb1427c-4dd4-4fcb-a543-e0f89eb18136)
  ![image](https://github.com/user-attachments/assets/0ab47472-ffb6-48e7-a72a-b8a5d8397bc2)


- **Customizable Settings**:
  - Configure channels, crops, and update intervals using `config.json`.

- **Cleanup Task**:
  - Periodically removes outdated messages in the prices channel for better organization.

- **Join/Leave**:
  - Periodically checks if a player joins or leaves the server and announces it to discord.

---

## Setup

### Prerequisites
- Python 3.10 or later.
- A Discord bot token. (Learn how to create a bot [here](https://discordpy.readthedocs.io/en/stable/discord.html).)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/IceEagle132/Farming-Simulator-25-Discord-Bot.git
   ```
   
2. **Navigate to the project folder:**
   ```bash
   cd Farming-Simulator-25-Discord-Bot
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure `config.json`:**
   - Update the file with your specific server details:

5. **Edit `.env`:**
   - Add your Bot Token:

# Farming Simulator 25 Bot Configuration

## Configuration Structure
Below is the JSON structure for configuring the bot:

```json
{
  "server": {
    "stats_url": "http://your-server-url/feed/dedicated-server-stats.xml",
    "economy_url": "http://your-server-url/feed/dedicated-server-savegame.html?file=economy",
    "career_savegame_url": "http://your-server-url/feed/dedicated-server-savegame.html?file=careerSavegame"
  },
  "channels": {
    "auto_update_channel_id": "YOUR_CHANNEL_ID",
    "prices_channel_id": "YOUR_CHANNEL_ID",
    "player_notifications_channel_id": "YOUR_CHANNEL_ID"
  },
  "intervals": {
    "status_update_seconds": 60,
    "event_monitor_seconds": 30,
    "cleanup_interval": 30
  },
  "messages": {
    "server_update": "**Server Updates**\n\n🌐 **Server Name**: {server_name}\n🗺️ **Map Name**: {map_name}\n\n👥 **Players Online**: {players_online}/{player_capacity}\n⏳ **Farm Progress**: {hours}h {minutes}m\n\n📅 **Savegame Creation Date**: {creation_date}\n💾 **Last Save Date**: {last_save_date}\n\n📊 **Economic Difficulty**: {economic_difficulty}\n⏱️ **Time Scale**: {time_scale}x\n💰 **Current Money**: {current_money}\n\n🔧 **Mods**:\n{mods}"
  },
  "common_fill_types": [
    "Wheat", "Barley", "Oat", "Canola", "Sorghum", "Sunflower",
    "Chicken", "ChickenRooster", "Goat"
  ]
}
```
---

### Running the Bot

Run the bot with:
```bash
python bot.py
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
  -📡 **Monitors and updates** server information, including:  
  - 🧍‍♂️ **Player Activity**: Tracks player joins and leaves.  
  - 📊 **Server Stats**: Updates player counts and farm progress.  
  - 🔧 **Mods**: Displays currently installed mods.

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
