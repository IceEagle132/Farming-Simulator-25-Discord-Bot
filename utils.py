import requests
import xml.etree.ElementTree as ET
from config import ECONOMY_URL, STATS_URL, PRICES_CHANNEL_ID, COMMON_FILL_TYPES, CAREER_SAVEGAME_URL
import discord

def fetch_economy_data():
    try:
        # Use the dedicated URL for economy data
        response = requests.get(ECONOMY_URL, timeout=10)

        # Check if the response is empty
        if not response.text.strip():
            print("Empty response received from the server.")
            return None

        # Parse the XML
        economy_data = ET.fromstring(response.text)
        return economy_data

    except ET.ParseError as e:
        print(f"Error parsing economy data: {e}")
        return None
    except requests.RequestException as e:
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

def save_mod_pinned_message_id(message_id):
    """Save the pinned mod message ID to a file."""
    with open("pinned_mod_message_id.txt", "w") as file:
        file.write(str(message_id))

def load_mod_pinned_message_id():
    """Load the pinned mod message ID from a file."""
    try:
        with open("pinned_mod_message_id.txt", "r") as file:
            return int(file.read().strip())
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

    # Dynamically group crops into categories
    categories = {
        "Grains": ["Wheat", "Barley", "Oat", "Canola", "Sorghum", "Sunflower", "Soybean", "Maize"],
        "Roots and Tubers": ["Potato", "SugarBeet", "Beetroot", "Carrot", "Parsnip"],
        "Specialty Crops": ["Cotton", "RiceLongGrain", "Rice", "GreenBeans", "Peas", "Spinach", "Sugarcane"],
        "Fruits and Oils": ["Grape", "Olive", "SunflowerOil", "CanolaOil", "OliveOil", "Raisins", "GrapeJuice"],
        "Dairy and Animal Products": ["Milk", "GoatMilk", "BuffaloMilk", "Butter", "Cheese", "BuffaloMozzarella", "GoatCheese", "Wool", "Egg", "Honey"],
        "Processed Materials": ["Wood", "WoodChips", "SugarBeetCut", "Silage", "Grass", "DryGrass", "Straw"],
        "Vegetables and Greens": ["Lettuce", "Tomato", "Strawberry", "SpringOnion", "NapaCabbage", "Chilli", "Garlic", "Enoki", "SpinachBags"],
        "Baked Goods and Sweets": ["Flour", "RiceFlour", "Bread", "Cake", "Chocolate"],
        "Preserved Items": ["FermentedNapaCabbage", "PreservedCarrots", "PreservedParsnip", "PreservedBeetroot"],
        "Soups and Canned Goods": ["NoodleSoup", "SoupCansMixed", "SoupCansCarrots", "SoupCansParsnip", "SoupCansBeetroot", "SoupCansPotato"],
        "Fabric and Clothing": ["Fabric", "Clothes"],
        "Miscellaneous": ["Sugar", "Boards", "Planks", "WoodBeam", "PrefabWall", "Cement", "Barrel", "Bathtub", "Bucket", "Rope"],
    }

    # Generate the message dynamically
    fill_types_message = "📋 **Available Crops for /prices**\n\n"
    for category, items in categories.items():
        included_items = [item for item in items if item in COMMON_FILL_TYPES]
        if included_items:
            fill_types_message += f"**{category}**:\n```\n"
            for item in included_items:
                fill_types_message += f"{item}\n"  # Add each crop to the box
            fill_types_message += "```\n\n"

    fill_types_message += "Use `/prices <crop>` to view the price history or best prices."

    # Check if a pinned message exists and update or create it
    if pinned_messages:
        pinned_message = pinned_messages[0]
        await pinned_message.edit(content=fill_types_message)
        print(f"Updated the pinned message in the prices channel.")
    else:
        message = await channel.send(fill_types_message)
        await message.pin()
        print(f"Pinned a new message in the prices channel.")

def fetch_career_savegame_data():
    try:
        response = requests.get(CAREER_SAVEGAME_URL)
        response.raise_for_status()

        # Check if response contains valid XML
        if not response.content.strip():
            print("Empty response received from the server.")
            return None

        # Decode response content to handle BOM or encoding issues
        xml_content = response.content.decode("utf-8-sig")  # Remove BOM if present

        # Parse the XML content
        root = ET.fromstring(xml_content)

        # Extract and return relevant data
        settings = root.find("settings")
        creation_date = settings.findtext("creationDate", "Unknown")
        last_save_date = settings.findtext("saveDate", "Unknown")
        economic_difficulty = settings.findtext("economicDifficulty", "Unknown")
        time_scale = settings.findtext("timeScale", "1")
        current_money = root.find("statistics").findtext("money", "0")

        return {
            "creation_date": creation_date,
            "last_save_date": last_save_date,
            "economic_difficulty": economic_difficulty,
            "time_scale": time_scale,
            "current_money": current_money,
        }
    except ET.ParseError as e:
        print(f"Error parsing career savegame XML: {e}")
        return None
    except Exception as e:
        print(f"Error fetching or processing career savegame data: {e}")
        return None



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