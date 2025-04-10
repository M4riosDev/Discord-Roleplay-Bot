const { MessageEmbed } = require('discord.js');
const Giveaway = require('../../models/giveaways');

module.exports = {
    name: 'reroll',
    description: 'Ξαναδιαλέγει νικητές για ένα giveaway',
    async run(client, message, args) {
        console.log("Η εντολή reroll εκτελείται!");
        console.log("Arguments:", args);

        if (!message || !message.channel) {
            console.error("Error: Το message ή το κανάλι είναι undefined!");
            return;
        }

        if (!message.member.permissions.has("MANAGE_MESSAGES")) {
            return message.channel.send({ content: "❌ Δεν έχεις δικαιώματα να εκτελέσεις αυτή την εντολή!" });
        }

        if (args.length < 1) {
            return message.channel.send({ content: '❌ Χρήση: `!reroll <message_id>`' });
        }

        let messageId = args[0];

        let giveaway = await Giveaway.findOne({ message_id: messageId });
        if (!giveaway) {
            return message.channel.send({ content: '❌ Δεν βρέθηκε giveaway με αυτό το ID.' });
        }

        let participants = giveaway.participants;
        let winners = [];

        if (participants.length > 0) {
            let shuffled = participants.sort(() => 0.5 - Math.random());
            winners = shuffled.slice(0, giveaway.winners);
        }

        if (winners.length > 0) {
            message.channel.send(`🎉 **Νέοι νικητές:** ${winners.map(winner => `<@${winner}>`).join(', ')}`);
        } else {
            message.channel.send("❌ Δεν υπήρχαν αρκετές συμμετοχές για νέο νικητή.");
        }
    }
};
