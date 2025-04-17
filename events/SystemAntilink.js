const Discord = require("discord.js");
const client = require("../index");

const banCooldown = new Map();
const BAN_COOLDOWN_MS = 10 * 60 * 1000; 

client.on("messageCreate", async message => {
    if (!message.guild || !message.member || message.author.bot) return;

    const contentLower = message.content.toLowerCase();

    const urlRegex = /(?:https?:\/\/|www\.)[^\s]+|discord\.gg\/[^\s]+/gi;
    const containsLink = urlRegex.test(contentLower) ||
        contentLower.includes("discord.gg") ||
        contentLower.includes("discord.com/invite") ||
        message.embeds.length > 0;

    const suspiciousPatterns = [
        /look\s*what/i,
        /not\s*even\s*18/i,
        /only\s*fans?/i,
        /n(u|0|4)d(e|3)?z?/i,
        /n(\W|_|-|\\)*[0o]?[0o]dz?/i,
        /s[e3]x|s[\W_]*x|s\$x/i,
        /porn|p[o0]rn|pr[o0]n/i,
        /nsfw/i,
        /click\s*here/i,
        /free|fr[e3][e3]|fr\W*e\W*e/i,
        /steam\s*gift/i,
        /steamcommunity\.com/i,
        /steampowered\.com/i,
        /\$?50/i,
        /invite\s*reward/i,
        /claim\s*prize/i,
        /gift\s*for\s*you/i,
        /she'?s\s*not\s*even\s*18/i,
        /malware/i,
        /gr[a@4]bify/i,
        /would\s+(a|one)?\s*brother\s+.*(live|stay).*(older|younger).*(sister|one)/i
    ];

    const triggeredPattern = suspiciousPatterns.find(pattern => pattern.test(contentLower));
    const isScam = Boolean(triggeredPattern);

    const allowedRoles = client.config.antilink.allowedroles || [];
    const allowedCategories = client.config.antilink.allowedcategories || [];
    const allowedChannels = client.config.antilink.allowedchannels || [];
    const logsChannelID = client.config.antilink.channel;

    if (message.channel.parentId && allowedCategories.includes(message.channel.parentId)) return;
    if (allowedChannels.includes(message.channel.id)) return;

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
            {
                name: "**Message**",
                value: message.content && message.content.trim().length > 0
                    ? (message.content.length > 1024 ? message.content.slice(0, 1020) + "..." : message.content)
                    : "*No message content (likely an embed or attachment)*"
            }
        )
        .setTimestamp();

    if (containsLink) {
        await message.delete().catch(() => {});

        if (isScam) {
            const now = Date.now();
            const lastBan = banCooldown.get(message.author.id);

            if (!lastBan || now - lastBan > BAN_COOLDOWN_MS) {
                try {
                    await message.member.ban({ reason: "Scam link detected by Anti-Link system" });
                    banCooldown.set(message.author.id, now);

                    baseEmbed
                        .setTitle("🚨 User Banned - Scam Link Detected")
                        .setColor("DARK_RED")
                        .addField("🔍 Triggered Pattern", `\`\`\`${triggeredPattern}\`\`\``);

 
                    setTimeout(() => {
                        banCooldown.delete(message.author.id);
                    }, BAN_COOLDOWN_MS);
                } catch (err) {
                    console.error("Failed to ban scammer:", err);
                    baseEmbed
                        .setTitle("⚠️ Scam Link Detected - Ban Failed")
                        .setColor("RED")
                        .addFields(
                            { name: "🔍 Triggered Pattern", value: `\`\`\`${triggeredPattern}\`\`\`` },
                            { name: "Error", value: `\`\`\`${err.message}\`\`\`` }
                        );
                }
            } else {
                baseEmbed
                    .setTitle("⚠️ Scam Link Detected - Ban Cooldown Active")
                    .setColor("ORANGE")
                    .addFields(
                        { name: "🔍 Triggered Pattern", value: `\`\`\`${triggeredPattern}\`\`\`` },
                        {
                            name: "Cooldown",
                            value: `<t:${Math.floor((lastBan + BAN_COOLDOWN_MS) / 1000)}:R> (ban cooldown)`
                        }
                    );
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
