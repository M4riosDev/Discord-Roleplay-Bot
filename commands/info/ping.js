const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { version: nodeVersion } = require('process');
const { version: discordJSVersion } = require('discord.js');

module.exports = {
  name: 'bot',
  description: 'Εμφανίζει πληροφορίες για το bot.',
  run: async (client, message) => {
    const uptime = formatUptime(client.uptime);
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const apiPing = `${client.ws.ping}ms`;

    const embed = new MessageEmbed()
      .setColor('#00b0f4')
      .setTitle('🤖 Πληροφορίες Bot')
      .addField('⏱️ Uptime', uptime, true)
      .addField('📡 API Ping', apiPing, true)
      .addField('👨‍💻 Developer', 'm4r1os', true)
      .addField('🟢 Node.js Version', nodeVersion, true)
      .addField('🔷 Discord.js Version', discordJSVersion, true)
      .setFooter({ text: 'Made by m4r1os' })
      .setTimestamp();

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('🔗 GitHub')
        .setStyle('LINK')
        .setURL('https://github.com/M4riosDev/Discord-Roleplay-Bot')
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  },
};

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
