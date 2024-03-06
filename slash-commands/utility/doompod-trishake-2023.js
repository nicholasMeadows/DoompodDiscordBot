const { SlashCommandBuilder } = require("discord.js");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { ASSETS_DIR, DOOMPOD_TRISHAKE_2023_FILE} = require("../../constants");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trishake")
    .setDescription("The trinity known as tri-shake circa December 2023"),
  async execute(interaction) {
    await interaction.deferReply();
    const attachmentFile = path.join(ASSETS_DIR, DOOMPOD_TRISHAKE_2023_FILE);
    const file = new AttachmentBuilder(attachmentFile);
    interaction.editReply({ files: [file] });
  },
};
