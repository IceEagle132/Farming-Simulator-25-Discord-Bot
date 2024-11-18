import requests
import xml.etree.ElementTree as ET
from config import ECONOMY_URL, STATS_URL, PRICES_CHANNEL_ID, COMMON_FILL_TYPES
import discord

def fetch_economy_data():
    """Fetch and parse the economy XML data."""
    try:
        response = requests.get(ECONOMY_URL)
        response.raise_for_status()
        return ET.fromstring(response.content)
    except Exception as e:
        print(f"Error fetching economy data: {e}")
        return None

def extract_fill_type_prices(economy_data, fill_type_name):
    """Extract price history for a specific fill type."""
    fill_type = economy_data.find(f".//fillType[@fillType='{fill_type_name}']")
    if fill_type is None:
        return f"No data available for {fill_type_name}."

    history = fill_type.find("history")
    if history is None:
        return f"No history data available for {fill_type_name}."

    # Extract period and price data
    price_data = [
        (period.attrib["period"].replace("_", " ").title(), int(period.text))
        for period in history.findall("period")
    ]

    # Calculate high and low prices
    highest = max(price_data, key=lambda x: x[1])
    lowest = min(price_data, key=lambda x: x[1])

    # Format output
    formatted_data = "\n".join(
        [
            f"**{name}**: **${price}**" if (name, price) in [highest, lowest] else f"**{name}**: ${price}"
            for name, price in price_data
        ]
    )

    return (
        f"---\n"
        f"{formatted_data}\n"
        f"---\n"
        f"🔼 Highest: **{highest[0]} (${highest[1]})**\n"
        f"🔽 Lowest: **{lowest[0]} (${lowest[1]})**"
    )

def save_pinned_message_id(message_id):
    with open("pinned_message_id.txt", "w") as file:
        file.write(str(message_id))

def load_pinned_message_id():
    try:
        with open("pinned_message_id.txt", "r") as file:
            return int(file.read())
    except (FileNotFoundError, ValueError):
        return None

async def ensure_pinned_message(bot):
    """Ensure the pinned message in the prices channel is updated with the latest crop list."""
    await bot.wait_until_ready()
    channel = bot.get_channel(PRICES_CHANNEL_ID)
    if channel is None:
        print(f"Prices channel with ID {PRICES_CHANNEL_ID} not found.")
        return

    pinned_messages = await channel.pins()

    fill_types_message = (
        "📋 **Available Crops for /prices**\n\n"
        + ", ".join(COMMON_FILL_TYPES)
        + "\n\nUse `/prices <crop>` to view the price history or best prices."
    )

    if pinned_messages:
        pinned_message = pinned_messages[0]
        await pinned_message.edit(content=fill_types_message)
        print(f"Updated the pinned message in the prices channel.")
    else:
        message = await channel.send(fill_types_message)
        await message.pin()
        print(f"Pinned a new message in the prices channel.")

def fetch_server_stats():
    """
    Fetch and parse server stats from the FS25 server.
    Returns:
        ElementTree.Element: Parsed XML root element or None if an error occurs.
    """
    try:
        # Fetch stats from the FS25 stats URL
        response = requests.get(STATS_URL)
        response.raise_for_status()

        # Parse the XML response
        return ET.fromstring(response.content)
    except Exception as e:
        print(f"Error fetching server stats: {e}")
        return None