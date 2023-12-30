const { SlashCommandBuilder } = require("discord.js");
const {
  AttachmentBuilder,
  EmbedBuilder,
  MessageAttachment,
} = require("discord.js");
const { ASSETS_DIR } = require("../../constants");

const fileName = "doompod-hug1-2023.gif";
const relativeFile = ASSETS_DIR + "/" + fileName;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("doomhug1")
    .setDescription("Our very first Doom-pod hug circa December 2023"),
  async execute(interaction) {
    await interaction.deferReply();
    const file = new AttachmentBuilder(relativeFile);
    interaction.editReply({ files: [file] });
  },
};
