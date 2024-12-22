# Farming Simulator 25 Discord Bot

A **customizable Discord bot** designed to provide:

- **Crop price history** and best seasonal prices  
- **Live server updates** (map name, difficulty, money, mod list, etc.)  
- **Player join/leave notifications** for Farming Simulator 25 players

---

## Supported Hosting Options

- **VPS (Virtual Private Server)** ✅  
- **Home Hosted** ✅  
- Other hosting options ❌ *Not Supported* (To be added)

---

## Need Help?

Add me on Discord if you have any issues: **IceEagle132**

![image](https://github.com/user-attachments/assets/be45bb0c-58c2-4c75-a2e1-9a424bac0309)

---

## Table of Contents

1. [Overview](#overview)  
2. [Requirements](#requirements)  
3. [Download](#download)  
4. [Installation](#installation)  
5. [Configuration](#configuration)  
6. [Running the Bot](#running-the-bot)  
7. [Usage & Notes](#usage--notes)  
8. [Troubleshooting](#troubleshooting)  
9. [Contributing](#contributing)  
10. [License](#license)

---

## 1. Overview

This bot connects to your **Farming Simulator 25** dedicated server’s XML feeds to:

- Fetch economy data (crop prices)  
- Display server info (map name, difficulty, current money, mods)  
- Announce join/leave events via the stats feed  
- Update automatically at set intervals

Whether you host the bot **on a VPS** or **at home**, it runs on Node.js and updates Discord channels according to your `config.json` settings.

---

## 2. Requirements

1. **Node.js v16 or newer**  
   - [Download here](https://nodejs.org/en/download/) (LTS recommended).  
   - Ensure “Add to PATH” is selected if you’re on Windows.  
   - After installation, open a new terminal and run `node -v` to check.

2. **Discord Bot Token**  
   - Create a bot user via the [Discord Developer Portal](https://discord.com/developers/applications).  
   - Copy your bot’s **token**—keep it private.

3. **Farming Simulator 25 Dedicated Server**  
   - You’ll need the URLs to your server’s economy XML, stats XML, or career savegame feeds if you want the bot to display that data.

---

## 3. Download

You can obtain this repository in two ways:

### A. **Download ZIP**

1. Go to [this GitHub repo](https://github.com/IceEagle132/Farming-Simulator-25-Discord-Bot).
2. Click the green **Code** button, then select **Download ZIP**.
3. Extract the ZIP to a folder on your computer.

### B. **Clone via Git**

1. Install [Git](https://git-scm.com/downloads) if needed.
2. Open a terminal or command prompt:
   ```bash
   git clone https://github.com/IceEagle132/Farming-Simulator-25-Discord-Bot.git
   cd Farming-Simulator-25-Discord-Bot