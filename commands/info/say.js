const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "say",
    description: "Sends an embed message with optional image and deletes the command message.",
    run: async (client, message, args) => {
        const text = args.join(" ");
        const attachment = message.attachments.first();
        const imageUrl = attachment ? attachment.url : null;

        const embed = new MessageEmbed()
            .setAuthor(message.client.config.server.name, message.client.config.server.image)
            .setDescription(text)
            .setColor(message.client.config.server.color)
            .setFooter({ text: 'Made by m4r1os' })

        if (imageUrl) embed.setImage(imageUrl);

        message.channel.send({ embeds: [embed] }).then(() => {
            setTimeout(() => {
                if (message.deletable) message.delete().catch(err => console.error("Δεν μπορώ να διαγράψω το μήνυμα:", err));
            }, 1000);
        });
    }
};
