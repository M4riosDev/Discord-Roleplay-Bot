const Discord = require("discord.js");
const client = require("../index");

client.on("messageCreate", async message => {
    if (!message.guild || !message.member || message.author.bot) return;

    const contentLower = message.content.toLowerCase();

    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-z0-9\-]+\.[a-z]{2,}(\/\S*)?/gi;

    const containsLink = urlRegex.test(contentLower) ||
        contentLower.includes("discord.gg") ||
        contentLower.includes("discord.com/invite") ||
        message.embeds.length > 0;

    const suspiciousKeywords = [
        "look what", "not even 18", "onlyfans", "nude", "nudes", "+18",
        "free steam", "steam gift", "steamcommunity.com", "steampowered.com",
        "porn", "sexcam", "nsfw", "click here", "free giveaway", "free nitro", "50$",
        "invite reward", "claim prize", "gift for you", "she's not even 18", "malware", "grabify"
    ];

    const isScam = suspiciousKeywords.some(p => contentLower.includes(p));

    const allowedRoles = client.config.antilink.allowedroles || [];
    const whitelistedCategories = client.config.antilink.allowedcategories || [];
    const logsChannelID = client.config.antilink.channel;

    if (message.channel.parentId && whitelistedCategories.includes(message.channel.parentId)) return;

    const hasAllowedRole = message.member.roles.cache.some(role => allowedRoles.includes(role.id));
    if (message.member.permissions.has("ADMINISTRATOR") || hasAllowedRole) return;

    const logsChannel = message.guild.channels.cache.get(logsChannelID);

    const baseEmbed = new Discord.MessageEmbed()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .addFields(
            { name: "**User ID**", value: `\`${message.author.id}\``, inline: true },
            { name: "**Username**", value: `\`${message.author.username}\``, inline: true },
            { name: "**User**", value: `<@${message.author.id}>`, inline: true },
            { name: "**Channel**", value: `<#${message.channel.id}>`, inline: true },
            { name: "**Message**", value: message.content.length > 1024 ? message.content.slice(0, 1020) + "..." : message.content }
        )
        .setFooter({ text: 'Made by m4r1os' })
        .setTimestamp();

    if (containsLink) {
        await message.delete().catch(() => {});

        if (isScam) {
            try {
                await message.member.ban({ reason: "Scam link detected by Anti-Link system" });

                baseEmbed
                    .setTitle("🚨 User Banned - Scam Link Detected")
                    .setColor("DARK_RED");

            } catch (err) {
                console.error("Failed to ban scammer:", err);
                baseEmbed
                    .setTitle("⚠️ Scam Link Detected - Ban Failed")
                    .setColor("RED")
                    .addField("Error", `\`\`\`${err.message}\`\`\``);
            }
        } else {
            baseEmbed
                .setTitle("⚠️ Link Deleted")
                .setColor("#ffb600");
        }

        if (logsChannel) {
            logsChannel.send({ embeds: [baseEmbed] }).catch(err => {
                console.error("Could not send message to logs channel:", err);
            });
        }
    }
});
