const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const Giveaway = require('../../models/giveaways');

module.exports = {
    name: 'end',
    description: 'Τερματίζει χειροκίνητα ένα ενεργό giveaway',
    async run(client, message, args) {
        if (!message || !message.channel) {
            return console.error("❌ Το message ή το κανάλι είναι undefined!");
        }

        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
            return message.channel.send({ content: "❌ Δεν έχεις δικαιώματα να εκτελέσεις αυτή την εντολή!" });
        }

        if (!args[0]) {
            return message.channel.send({ content: '❌ Χρήση: `!end <message_id>`' });
        }

        const messageId = args[0];

        try {
            const giveaway = await Giveaway.findOne({ message_id: messageId });
            if (!giveaway) {
                return message.channel.send({ content: '❌ Δεν βρέθηκε giveaway με αυτό το ID.' });
            }

            const channel = await client.channels.fetch(giveaway.channel_id);
            const msg = await channel.messages.fetch(giveaway.message_id);

            if (!msg) {
                return message.channel.send({ content: '❌ Δεν βρέθηκε το μήνυμα του giveaway.' });
            }

            const participants = giveaway.participants || [];

            let winners = [];
            if (participants.length > 0) {
                winners = selectWinners(participants, giveaway.winners);
            }

            let winnerMentions = winners.length > 0
                ? winners.map(id => `<@${id}>`).join(', ')
                : "❌ Δεν υπήρχαν αρκετοί συμμετέχοντες.";

            const endEmbed = new MessageEmbed()
                .setTitle(`🎉 Giveaway END: ${giveaway.prize}`)
                .setDescription(`\n\n📢 **Hosted by:** <@${giveaway.host_id}>\n\n⏳ **EVENT ENDED:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n🏆 **BIG WINNERS:** ${winnerMentions}`)
                .setColor(client.config.server.color)
                .setFooter({ text: 'Made by m4r1os' })
                .setImage(client.config.server.banner);

            const disabledRow = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('ended_giveaway')
                    .setLabel('Giveaway Ended')
                    .setStyle('SECONDARY')
                    .setDisabled(true)
            );

            await msg.edit({ embeds: [endEmbed], components: [disabledRow] });

            await Giveaway.deleteOne({ message_id: messageId });

            channel.send(`🎉 Το giveaway για **${giveaway.prize}** έληξε! ${winners.length > 0 ? `Συγχαρητήρια στους νικητές: ${winnerMentions}` : "Δεν υπήρχαν συμμετέχοντες."}`);
        } catch (err) {
            console.error("❌ Σφάλμα κατά το τερματισμό του giveaway:", err);
            return message.channel.send({ content: "❌ Κάτι πήγε στραβά κατά τον τερματισμό!" });
        }
    }
};

function selectWinners(participants, count) {
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
