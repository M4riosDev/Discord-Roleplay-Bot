const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { status } = require("minecraft-server-util");

const fetchServerStatus = async (client, context) => {
  const isInteraction = !!context.isCommand;
  const sendReply = async (embed) => {
    if (isInteraction) {
      if (context.deferred || context.replied) {
        return context.followUp({ embeds: [embed], ephemeral: true });
      }
      return context.reply({ embeds: [embed], ephemeral: true });
    } else {
      return context.reply({ embeds: [embed], allowedMentions: { repliedUser: true } });
    }
  };

  const serverIP = client.config.mc.ServerIP;
  const serverPort = Number(client.config.mc.ServerPort);
  const thumbnailURL = client.config.mc.ServerImage;

  try {
    const response = await status(serverIP, serverPort);

    let embed;
    if (response.players.online === 0 && response.players.max === 0) {
      embed = new MessageEmbed()
        .setColor("YELLOW")
        .setTitle("🟡 Maintenance")
        .setFooter({ text: client.config.server.name, iconURL: client.config.server.image })
        .setThumbnail(client.config.server.image);
    } else {
      const playerCount = `${response.players.online}/${response.players.max}`;
      embed = new MessageEmbed()
        .setColor(client.config.server.color)
        .setAuthor({ name: client.config.server.name, iconURL: client.config.server.image })
        .addField("Status", "🟢 Online", true)
        .addField("**Players**", playerCount, true)
        .setTimestamp()
        .setFooter({ text: 'Made by m4r1os' })
        .setThumbnail(client.config.server.image);
    }

    return sendReply(embed);
  } catch (error) {
    console.error(error);

    const embed = new MessageEmbed()
      .setColor("RED")
      .setTitle("🔴 Offline")
      .setFooter({ text: client.config.server.name, iconURL: client.config.server.image})
      .setThumbnail(client.config.server.image);

    return sendReply(embed);
  }
};

module.exports = {
  name: "status",
  description: "Returns Minecraft Roleplay game status.",
  category: "misc",
  aliases: ["mcstatus"],
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Returns Minecraft Roleplay game status."),
  run: async (client, message, args) => {
    await fetchServerStatus(client, message);
  },
  execute: async (interaction) => {
    await fetchServerStatus(interaction.client, interaction);
  },
};