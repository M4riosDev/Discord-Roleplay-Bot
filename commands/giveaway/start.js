const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Giveaway = require('../../models/giveaways');

module.exports = {
    name: 'start',
    description: 'Ξεκινά ένα giveaway',
    async run(client, message, args) { 

        args = message.content.split(" ").slice(1);
        if (args.length < 4) {
            return message.reply('Χρήση: !start <διάρκεια> <νικητές> <έπαθλο> <#κανάλι>');
        }

        let duration = args[0];
        let winnersCount = parseInt(args[1]);
        let prize = args.slice(2, -1).join(' ');
        let channel = message.mentions.channels.first();

        if (!channel) return message.reply('Πρέπει να αναφέρεις ένα κανάλι!');
        if (isNaN(winnersCount) || winnersCount < 1) return message.reply('Ο αριθμός νικητών πρέπει να είναι έγκυρος!');

        let timeMs = parseDuration(duration);
        if (!timeMs) return message.reply('Μη έγκυρη διάρκεια! Χρησιμοποίησε π.χ. 1h, 30m, 10s, 6d, 2w.');

        let endTime = Date.now() + timeMs;

        let embed = new MessageEmbed()
            .setTitle(`🎉 Prize: ${prize}`)
            .setDescription(`\n\n📢 **Hosted by:** <@${message.author.id}>\n\n⏳ **EVENT ENDS:** <t:${Math.floor(endTime / 1000)}:R>\n\n🏆 **BIG WINNERS:** ${winnersCount}`)
            .setColor(client.config.server.color)
            .setFooter({ text: 'Made by m4r1os' })
            .setImage(client.config.server.banner);

        let row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('enter_giveaway')
                .setLabel('Enter Giveaway (0)')
                .setStyle('PRIMARY')
        );

        let msg = await channel.send({ embeds: [embed], components: [row] });

        const giveaway = new Giveaway({
            channel_id: channel.id,
            message_id: msg.id,
            prize: prize,
            winners: winnersCount,
            end_time: endTime,
            participants: [],
            host_id: message.author.id
        });

        await giveaway.save();
        message.reply(`Το giveaway ξεκίνησε επιτυχώς! με ID: ${giveaway._id}`);

        scheduleGiveaway(client, msg.id, timeMs, channel, prize, winnersCount, message.author.id);
    }
};

async function scheduleGiveaway(client, messageId, timeMs, channel, prize, winnersCount, hostId) {
    setTimeout(async () => {
        let giveawayData = await Giveaway.findOne({ message_id: messageId });
        if (!giveawayData) return;

        let participants = giveawayData.participants;
        if (participants.length === 0) {
            return channel.send(`🎉 Το giveaway για **${prize}** έληξε αλλά δεν υπήρχαν συμμετέχοντες! 😢`);
        }

        let winners = selectWinners(participants, winnersCount);
        let winnerMentions = winners.map(winner => `<@${winner}>`).join(', ');

        let endEmbed = new MessageEmbed()
            .setTitle(`🎉 Giveaway END: ${prize}`)
            .setDescription(`\n\n📢 **Hosted by:** <@${hostId}>\n\n⏳ **EVENT ENDED:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n🏆 **BIG WINNERS:** ${winnerMentions}`)
            .setColor(client.config.server.colour)
            .setFooter({ text: 'Made by m4r1os' })
            .setImage(client.config.server.banner);

        let disabledRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('ended_giveaway')
                .setLabel('Giveaway Ended')
                .setStyle('SECONDARY')
                .setDisabled(true)
        );

        try {
            let msg = await channel.messages.fetch(messageId);
            if (msg) await msg.edit({ embeds: [endEmbed], components: [disabledRow] });
        } catch (err) {
            console.error("❌ Δεν μπόρεσα να επεξεργαστώ το μήνυμα του giveaway:", err);
        }

        channel.send(`**Συγχαρητήρια στους νικητές:** ${winnerMentions}! Κερδίσατε **${prize}**!`);

        await Giveaway.deleteOne({ message_id: messageId });
    }, timeMs);
}

function selectWinners(participants, count) {
    let shuffled = participants.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function parseDuration(str) {
    let match = str.match(/^(\d+)(s|m|h|d|w)$/);
    if (!match) return null;

    let value = parseInt(match[1]);
    let unit = match[2];

    if (unit === 's') return value * 1000;
    if (unit === 'm') return value * 60000;
    if (unit === 'h') return value * 3600000;
    if (unit === 'd') return value * 86400000;
    if (unit === 'w') return value * 604800000;
    return null;
}
