const { SlashCommandBuilder } = require("discord.js");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { ASSETS_DIR } = require("../../constants");

const fileName = "doompod-katie-letsgo-2023.gif";
const relativeFile = ASSETS_DIR + "/" + fileName;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("doomhugletsgo")
    .setDescription("Katie was impatient circa December 2023"),
  async execute(interaction) {
    await interaction.deferReply();

    const file = new AttachmentBuilder(relativeFile);
    interaction.editReply({ files: [file] });
  },
};
