const Invite = require("../../models/invite");

module.exports = {
    name: "removeinvites",
    description: "❌ Αφαιρεί bonus invites από έναν χρήστη",
    run: async (client, message, args) => {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply("❌ Δεν έχεις άδεια να χρησιμοποιήσεις αυτή την εντολή.");
        }

        const member = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!member || isNaN(amount)) {
            return message.reply("Χρήση: `removebonus @user ποσό`");
        }

        const invite = await Invite.findOne({ guildId: message.guild.id, inviter_id: member.id });

        if (!invite) {
            return message.reply("Ο χρήστης δεν έχει καταγεγραμμένες προσκλήσεις.");
        }

        invite.bonus = Math.max((invite.bonus || 0) - amount, 0);
        await invite.save();

        message.reply(`🧹 Αφαίρεσες **${amount}** bonus invites από τον χρήστη <@${member.id}>.`);
    }
};
