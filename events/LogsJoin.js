const client = require("../index");
const Discord = require("discord.js");
const moment = require("moment");
const Invite = require("../models/invite");

client.on("guildMemberAdd", async (member) => {
    if (member.user.bot) return;

    const { guild } = member;
    const roleID = client.config.server.roles.members;
    const logChannel = guild.channels.cache.get(client.config.logs.member);
    const oldInvites = client.invites.get(guild.id) || new Map();
    const newInvites = await guild.invites.fetch().catch(() => new Map());

    let usedInvite = newInvites.find(inv => {
    const previousUses = oldInvites.get(inv.code) || 0;
    return inv.uses > previousUses;
});
    const vanity = await guild.fetchVanityData().catch(() => null);
    let inviter = null;

    if (!usedInvite && vanity) {
        if (vanity.uses > (client.vanityUses?.get(guild.id) || 0)) {
            usedInvite = { code: vanity.code, inviter: { id: "vanity" }, isVanity: true };
        }
    }

    if (usedInvite && usedInvite.inviter?.id !== "vanity") {
        inviter = await client.users.fetch(usedInvite.inviter.id).catch(() => null);
    }

    const accountAge = Date.now() - member.user.createdTimestamp;
    const isFake = accountAge < 1000 * 60 * 60 * 24 * 3;

    await Invite.create({
        guildId: guild.id,
        invited_id: member.user.id,
        inviter_id: usedInvite?.inviter?.id || "vanity",
        fake: isFake
    });

    if (logChannel?.permissionsFor(guild.me).has(["SEND_MESSAGES", "EMBED_LINKS"])) {
        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setColor("GREEN")
            .setDescription([
                `**📥 Join:** <@${member.user.id}>`,
                `**Register:** ${moment(member.user.createdAt).format("MMM Do YYYY")}\n`,
                `**🧑‍🤝‍🧑 Invited by:** ${inviter ? `<@${inviter.id}>` : usedInvite?.isVanity ? "Vanity URL" : "Unknown"}`,
                `**🔗 Invite Used:** ${usedInvite?.code ? `[${usedInvite.code}](https://discord.gg/${usedInvite.code})` : "Unknown"}`,
                isFake ? "⚠️ **Possible fake account**" : ""
            ].filter(Boolean).join("\n"))
            .setFooter({ text: 'Made by m4r1os' });

        logChannel.send({ embeds: [embed] });
    }

    const role = guild.roles.cache.get(roleID);
    if (role) {
        member.roles.add(role).catch(console.error);
    }

    client.invites.set(guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));
    if (vanity) {
        client.vanityUses ??= new Map();
        client.vanityUses.set(guild.id, vanity.uses);
    }
});