const { SlashCommandBuilder } = require("discord.js");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { ASSETS_DIR } = require("../../constants");

const fileName = "doompod-hug2-2023.gif";
const relativeFile = ASSETS_DIR + "/" + fileName;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("doomhug2")
    .setDescription(
      "Our very first Doom-pod hug but more different circa December 2023"
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const file = new AttachmentBuilder(relativeFile);
    interaction.editReply({ files: [file] });
  },
};
