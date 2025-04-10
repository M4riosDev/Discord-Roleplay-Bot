const client = require("../index");
const Discord = require('discord.js');

client.on('messageDelete', async message => {
  if (!message.guild || message.author?.bot) return;

  const logChannel = client.channels.cache.get(client.config.logs.message);
  if (!logChannel) return;

  let executor;

  try {
    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: 'MESSAGE_DELETE',
    });

    const deletionLog = fetchedLogs.entries.first();

    if (deletionLog) {
      const { executor: logExecutor, target, createdTimestamp } = deletionLog;
      const timeDifference = Date.now() - createdTimestamp;
      if (target.id === message.author?.id && timeDifference < 5000) {
        executor = logExecutor;
      }
    }

    const embed = new Discord.MessageEmbed()
      .setColor('#EC1C24')
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
        url: `https://discord.com/users/${message.author.id}`
      })
      .setDescription(
        `\u200B\n${message.content || "*[χωρίς περιεχόμενο]*"}\n\n` +
        `**Mention:** <@${message.author.id}>\n` +
        `**Κανάλι:** <#${message.channel.id}>` +
        (executor ? `\n**Διαγράφηκε από:** <@${executor.id}>` : "")
      )
      .setFooter({ text: 'Made by m4r1os' })
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Error logging deleted message:", err);
  }
});