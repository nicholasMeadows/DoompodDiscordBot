const { SlashCommandBuilder } = require("discord.js");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { ASSETS_DIR, DOOMPOD_HUG2_2023_FILE} = require("../../constants");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("doomhug2")
    .setDescription(
      "Our very first Doom-pod hug but more different circa December 2023"
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const attachmentPath = path.join(ASSETS_DIR, DOOMPOD_HUG2_2023_FILE);
    const file = new AttachmentBuilder(attachmentPath);
    interaction.editReply({ files: [file] });
  },
};
