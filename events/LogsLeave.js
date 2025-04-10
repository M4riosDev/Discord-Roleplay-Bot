const client = require("../index");
const Discord = require("discord.js");
const moment = require("moment");
const Invite = require("../models/invite");

client.on("guildMemberRemove", async (member) => {
    if (member.user.bot) return;

    const { guild } = member;
    const logChannel = guild.channels.cache.get(client.config.logs.member);
    const inviteEntry = await Invite.findOne({ invited_id: member.id, guildId: guild.id });

    let inviterMention = "Unknown";
    let statsText = "";

    if (inviteEntry) {
        inviteEntry.left = true;
        await inviteEntry.save();

        if (inviteEntry.inviter_id === "vanity") {
            inviterMention = "Vanity URL";
        } else {
            const inviter = await client.users.fetch(inviteEntry.inviter_id).catch(() => null);
            if (inviter) inviterMention = `<@${inviter.id}>`;

            const invites = await Invite.find({ guildId: guild.id, inviter_id: inviteEntry.inviter_id });

            const total = invites.length;
            const fake = invites.filter(i => i.fake).length;
            const left = invites.filter(i => i.left && !i.fake).length;
            const bonus = invites.reduce((acc, i) => acc + (i.bonus || 0), 0);
            const real = invites.filter(i => !i.fake && !i.left).length;

            statsText = `\n> ✅ Real: **${real}** | ❌ Fake: **${fake}** | 🚪 Leaves: **${left}** | 🎁 Bonus: **${bonus}**`;
        }
    }

    const embed = new Discord.MessageEmbed()
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL(), url: "https://discord.com/users/" + member.user.id })
        .setDescription(
            `**📤 Leave:** <@${member.user.id}>\n` +
            `**Register**: \`${moment(member.user.createdAt).format("MMM Do YYYY")}\`\n` +
            `**Join:** \`${moment(member.user.joinedAt).format("MMM Do YYYY")}\`\n` +
            `**🧑‍🤝‍🧑 Invited by:** ${inviterMention}` +
            statsText
        )
        .setFooter({ text: 'Made by m4r1os' })
        .setColor("RED");

    if (logChannel?.permissionsFor(guild.me).has(["SEND_MESSAGES", "EMBED_LINKS"])) {
        logChannel.send({ embeds: [embed] });
    }
});
