import path from "node:path";

const CONFIG_PATH = "./config.json";
const ASSETS_PATH = path.join(__dirname, "assets");
const AUDIO_PATH = path.join(ASSETS_PATH, "audio");
const IMAGE_PATH = path.join(ASSETS_PATH, "image");
const VIDEO_PATH = path.join(ASSETS_PATH, "video");
const HTML_PATH = path.join(ASSETS_PATH, "html");

const DOOMPOD_HUG1_2023_FILE = "doompod-hug1-2023.gif"
const DOOMPOD_HUG2_2023_FILE = "doompod-hug2-2023.gif"
const DOOMPOD_KATIE_LETS_GO_2023_FILE = "doompod-katie-letsgo-2023.gif";
const DOOMPOD_TRISHAKE_2023_FILE = "doompod-trishake-2023.gif";
const LEGO_SCOOBE_FILE = "lego-scoob.png"
const RANDOM_ACTUALLY_REPLY_FILE = "random-actually-reply.gif";
const HALL_OFF_DOOT_REACTION_TEMPLATE = "reactionHallOfDootMessageTemplate.html";


const MONGO_GUILD_CHANNEL_MESSAGE_COLLECTION_NAME = "guild-channel-message"
const MONGO_GUILD_STICKER_COLLECTION_NAME = "guild-sticker"
const MONGO_BOT_ASSET_COLLECTION_NAME = "bot-asset"
const MONGO_CRON_SCHEDULE_COLLECTION_NAME = "cron-schedule"


export {
    CONFIG_PATH,
    ASSETS_PATH,
    AUDIO_PATH,
    IMAGE_PATH,
    VIDEO_PATH,
    HTML_PATH,
    DOOMPOD_HUG1_2023_FILE,
    DOOMPOD_HUG2_2023_FILE,
    DOOMPOD_KATIE_LETS_GO_2023_FILE,
    DOOMPOD_TRISHAKE_2023_FILE,
    RANDOM_ACTUALLY_REPLY_FILE,
    HALL_OFF_DOOT_REACTION_TEMPLATE,
    LEGO_SCOOBE_FILE,
    MONGO_GUILD_CHANNEL_MESSAGE_COLLECTION_NAME,
    MONGO_GUILD_STICKER_COLLECTION_NAME,
    MONGO_BOT_ASSET_COLLECTION_NAME,
    MONGO_CRON_SCHEDULE_COLLECTION_NAME
}