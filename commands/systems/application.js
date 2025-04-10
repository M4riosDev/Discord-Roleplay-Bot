const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const client = require("../../index");

module.exports = {
  name: 'application',
  description: 'Αποστολή αίτησης για την υποστήριξη',
  run: async (client, message, args) => {
    if (message.member.roles.cache.some(r => r.name === client.config.server.perms)) {
      const embedtest = new MessageEmbed()
        .setAuthor({ name: client.config.server.name, iconURL: client.config.server.image })
        .setColor(client.config.server.color)
        .setTitle('Συμπληρώστε την αίτηση ώστε να πάρετε το Criminal Job της επιλογής σας πατώντας το παρακάτω κουμπί.')
        .setFooter({ text: 'Made by m4r1os' })
        .setThumbnail(client.user.displayAvatarURL())

      return message.channel.send({
        embeds: [embedtest],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setStyle('SECONDARY')
              .setCustomId('submit_a_support_rank_button')
              .setEmoji("💼")
          ),
        ],
      });
    } else {
      message.delete().catch(err => console.log(err));
    }
  },
};
