const { SlashCommandBuilder } = require("discord.js");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { ASSETS_DIR } = require("../../constants");

const fileName = "doompod-trishake-2023.gif";
const relativeFile = ASSETS_DIR + "/" + fileName;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trishake")
    .setDescription("The trinity known as tri-shake circa December 2023"),
  async execute(interaction) {
    await interaction.deferReply();
    const file = new AttachmentBuilder(relativeFile);
    interaction.editReply({ files: [file] });
  },
};
