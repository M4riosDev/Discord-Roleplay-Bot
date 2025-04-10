const Discord = require("discord.js");
const { prefix } = require("../../index.js");

const sleep = (ms) => {
  if (!ms) throw new TypeError("Time isn't specified");
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
  name: "purge",
  category: "moderation",
  aliases: ["clear", "delete", "prune"],
  run: async (client, message, args) => {
    if (!message.member.roles.cache.some(r => r.name === client.config.server.perms)) {
      return message.delete().catch(console.error);
    }

    const commands = [
      `bots\` - Delete messages sent by bots.`,
      `humans\` - Delete messages sent by humans.`,
      `embeds\` - Delete messages containing rich embeds.`,
      `files\` - Delete messages containing files/images/attachments.`,
      `mentions\` - Delete messages containing mentions.`,
      `pins\` - Delete messages which are pinned.`,
      `text\` - Delete messages containing only text.`,
      `match\` <text> - Delete messages containing text.`,
      `not\` <text> - Delete messages not containing text.`,
      `startswith\` <text> - Delete messages starting with text.`,
      `endswith\` <text> - Delete messages ending with text.`,
    ];

    const usageEmbed = new Discord.MessageEmbed()
      .setColor("BLUE")
      .setTitle("Purge | Clear | Delete | Prune")
      .setDescription(`Delete a number of messages from a channel. (Ignores pinned, max 100)`)
      .addField("Usage", 
        `\`${prefix}purge <amount>\`\n\`${prefix}purge <amount> --${commands.join(`\n\`${prefix}purge <amount> --`)}`)
        .setFooter({ text: 'Made by m4r1os' });

    if (!args.length || isNaN(args[0])) {
      return message.channel.send({ embeds: [usageEmbed] });
    }

    let amount = parseInt(args[0]);
    if (amount < 2 || amount > 100) {
      return message.channel.send({ content: "Please enter a number between 2 and 100." });
    }

    const filterMap = {
      "--bots": (m) => m.author.bot && !m.pinned,
      "--humans": (m) => !m.author.bot && !m.pinned,
      "--embeds": (m) => m.embeds.length && !m.pinned,
      "--files": (m) => m.attachments.size > 0 && !m.pinned,
      "--text": (m) => !m.attachments.size && !m.embeds.length && !m.pinned,
      "--mentions": (m) =>
        (m.mentions.users.size || m.mentions.members.size || m.mentions.channels.size || m.mentions.roles.size) && !m.pinned,
      "--pins": (m) => m.pinned,
      "--match": (m) => args[2] && m.content.includes(args.slice(2).join(" ")) && !m.pinned,
      "--not": (m) => args[2] && !m.content.includes(args.slice(2).join(" ")) && !m.pinned,
      "--startswith": (m) => args[2] && m.content.startsWith(args.slice(2).join(" ")) && !m.pinned,
      "--endswith": (m) => args[2] && m.content.endsWith(args.slice(2).join(" ")) && !m.pinned,
    };

    const filterType = args[1];
    const applyFilter = filterMap[filterType];

    try {
      await message.delete();

      let messages = await message.channel.messages.fetch({ limit: amount });
      let filtered = applyFilter ? messages.filter(applyFilter) : messages;

      await message.channel.bulkDelete(filtered.size ? filtered : 1, true).then(async (m) => {
        const resultEmbed = new Discord.MessageEmbed()
          .setColor("0x00ffff")
          .setDescription(`✅ Cleared **${m.size}**/**${amount}** messages!`);

        const resultMsg = await message.channel.send({ embeds: [resultEmbed] });
        await sleep(50000);
        resultMsg.delete();
      });
    } catch (e) {
      console.error(e);
      message.channel.send({
        content: `❌ You can only delete messages not older than 14 days.`,
      });
    }
  },
};
