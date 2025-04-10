const Invite = require("../../models/invite");

module.exports = {
    name: "addinvites",
    description: "🎁 Προσθέτει bonus invites σε έναν χρήστη",
    run: async (client, message, args) => {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply("❌ Δεν έχεις άδεια να χρησιμοποιήσεις αυτή την εντολή.");
        }

        const member = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!member || isNaN(amount)) {
            return message.reply("Χρήση: `addinvites @user ποσό`");
        }

        let invite = await Invite.findOne({ guildId: message.guild.id, inviter_id: member.id });

        if (!invite) {
            invite = new Invite({
                guildId: message.guild.id,
                inviter_id: member.id,
                real: 0,
                fake: 0,
                leaves: 0,
                bonus: amount
            });
        } else {
            invite.bonus = (invite.bonus || 0) + amount;
        }

        await invite.save();

        message.reply(`🎁 Πρόσθεσες **${amount}** bonus invites στον χρήστη <@${member.id}>.`);
    }
};
