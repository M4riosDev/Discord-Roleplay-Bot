const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
  name: 'forms',
  description: 'Εμφανίζει τις διαθέσιμες αιτήσεις.',
  run: async (client, message, args) => {
    const embed = new MessageEmbed()
      .setAuthor({ name: client.config.server.name, iconURL: client.config.server.image })
      .setColor(client.config.server.color)
      .setDescription(
        '**```Παρακάτω μπορείτε να επιλέξετε και να ενταχθείτε σε ένα από τα σώματα του MostWanted Mincraft ώστε να βοηθήσετε εκεί που επιθυμείτε!```**'
      )
      .setFooter({ text: 'Made by m4r1os' });

    const buttons = [];

    if (client.config.forms.enable1) {
      buttons.push(
        new MessageButton()
          .setLabel(client.config.forms.text1)
          .setStyle('LINK')
          .setEmoji(client.config.forms.emoji1)
          .setURL(client.config.forms.link1)
      );
    }

    if (client.config.forms.enable2) {
      buttons.push(
        new MessageButton()
          .setLabel(client.config.forms.text2)
          .setStyle('LINK')
          .setEmoji(client.config.forms.emoji2)
          .setURL(client.config.forms.link2) // Πρόσεξε, είχες δύο φορές `link1`
      );
    }

    if (buttons.length === 0) {
      return message.channel.send('❌ Δεν υπάρχουν διαθέσιμες αιτήσεις αυτή τη στιγμή.');
    }

    const row = new MessageActionRow().addComponents(buttons);

    await message.channel.send({ embeds: [embed], components: [row] });
  },
};
