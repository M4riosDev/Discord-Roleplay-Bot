const {
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    Permissions,
} = require("discord.js");
const client = require("../index");

client.on("guildMemberAdd", async (member) => {
    const { antialt } = client.config;
    const logsChannelID = antialt.logs;
    const notifyRoleID = antialt.notifyRole;
    const quarantineRoleID = antialt.quarantineRole;

    try {
        const accountAgeInDays = Math.floor((Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24 * 3));
        const hasDefaultAvatar = !member.user.avatar;
        const isSuspiciousName = member.user.username.length < 3 ||
            member.user.username.length > 20 ||
            /[^\w-]/.test(member.user.username);

        if (accountAgeInDays <= 50 && (hasDefaultAvatar || isSuspiciousName)) {
            const logsChannel = await member.guild.channels.fetch(logsChannelID).catch(() => null);
            if (!logsChannel) return console.warn("⚠️ Logs channel not found.");

            const notifyRole = member.guild.roles.cache.get(notifyRoleID);
            const quarantineRole = member.guild.roles.cache.get(quarantineRoleID);

            const embed = new MessageEmbed()
                .setAuthor({
                    name: member.user.tag,
                    iconURL: member.user.displayAvatarURL({ dynamic: true }),
                })
                .setTitle("🛑 Suspicious Account Detected")
                .setColor("ORANGE")
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Username", value: member.user.tag, inline: true },
                    { name: "User ID", value: member.user.id, inline: true },
                    { name: "Account Age", value: `${accountAgeInDays} days`, inline: true },
                    { name: "Created At", value: `<t:${Math.floor(member.user.createdAt / 1000)}:F>`, inline: false }
                )
                .setFooter({
                    text: 'Made by m4r1os',
                    iconURL: member.guild.iconURL({ dynamic: true }),
                })
                .setTimestamp();

            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("kick_user")
                    .setLabel("Kick")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("quarantine_user")
                    .setLabel("Quarantine")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("timeout_user")
                    .setLabel("Timeout (1h)")
                    .setStyle("PRIMARY")
            );

            const messagePayload = {
                content: notifyRole ? `<@&${notifyRole.id}> Suspicious account detected.` : null,
                embeds: [embed],
                components: [row],
            };

            const message = await logsChannel.send(messagePayload);

            const collector = message.createMessageComponentCollector({
                filter: (i) => i.isButton() && i.message.id === message.id,
                time: 15 * 60 * 1000,
            });

            collector.on("collect", async (interaction) => {
                if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                    return interaction.reply({
                        content: "🚫 You don't have permission to do this.",
                        ephemeral: true,
                    });
                }

                await interaction.deferUpdate();

                switch (interaction.customId) {
                    case "kick_user":
                        await member.kick("Flagged as possible alt").catch((err) => {
                            console.error("Kick failed:", err);
                        });
                        message.edit({
                            content: `✅ **${member.user.tag}** has been kicked.`,
                            components: [],
                        });
                        break;

                    case "quarantine_user":
                        if (!quarantineRole) {
                            return interaction.followUp({
                                content: "⚠️ Quarantine role not found.",
                                ephemeral: true,
                            });
                        }
                        await member.roles.add(quarantineRole).catch((err) => console.error("Quarantine failed:", err));
                        message.edit({
                            content: `✅ **${member.user.tag}** has been quarantined.`,
                            components: [],
                        });
                        break;

                    case "timeout_user":
                        if (!member.manageable || !member.moderatable) {
                            return interaction.followUp({
                                content: "⚠️ Unable to timeout this user.",
                                ephemeral: true,
                            });
                        }
                        await member.timeout(60 * 60 * 1000, "Suspicious alt account").catch((err) => console.error("Timeout failed:", err));
                        message.edit({
                            content: `✅ **${member.user.tag}** has been timed out for 1 hour.`,
                            components: [],
                        });
                        break;
                }
            });

            collector.on("end", () => {
                message.edit({ components: [] }).catch(() => {});
            });
        }
    } catch (err) {
        console.error("❌ Anti-alt error:", err);
    }
});
