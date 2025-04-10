const client = require("../index");
const { MessageEmbed } = require("discord.js");

const config = client.config.antinuke;

const recentActions = new Map();

function isWhitelisted(userId) {
    return config.whitelist.includes(userId);
}

function logIncident(guild, actionType, executor, details) {
    const channel = guild.channels.cache.get(config.logs);
    if (!channel) return;

    const embed = new MessageEmbed()
        .setTitle(`🚨 Anti-Nuke Triggered: ${actionType}`)
        .addFields(
            { name: "User", value: `<@${executor.id}> (${executor.tag})`, inline: true },
            { name: "User ID", value: executor.id, inline: true },
            { name: "Details", value: details, inline: false }
        )
        .setColor("RED")
        .setFooter({ text: 'Made by m4r1os' })
        .setTimestamp();

    channel.send({ embeds: [embed] });
}

async function punishUser(guild, executor, reason) {
    try {
        const member = await guild.members.fetch(executor.id);
        if (!member.kickable) return;

        await member.kick(reason);
        console.log(`[ANTINUKE] Kicked ${executor.tag} for: ${reason}`);
    } catch (err) {
        console.error(`[ANTINUKE ERROR] Failed to punish ${executor.tag}:`, err);
    }
}

// Channel Create
client.on("channelCreate", async (channel) => {
    if (!config.enabled) return;

    const audit = await channel.guild.fetchAuditLogs({ type: "CHANNEL_CREATE", limit: 1 });
    const entry = audit.entries.first();
    if (!entry) return;

    const executor = entry.executor;
    if (isWhitelisted(executor.id)) return;

    const key = `${executor.id}_channelCreate`;
    const count = (recentActions.get(key) || 0) + 1;
    recentActions.set(key, count);

    setTimeout(() => recentActions.delete(key), 10000); // 10s window

    if (count > 3) {
        logIncident(channel.guild, "Mass Channel Creation", executor, `Created over 3 channels in 10 seconds.`);
        await punishUser(channel.guild, executor, "Mass channel creation (possible nuke)");
    }
});

// Channel Delete
client.on("channelDelete", async (channel) => {
    if (!config.enabled) return;

    const audit = await channel.guild.fetchAuditLogs({ type: "CHANNEL_DELETE", limit: 1 });
    const entry = audit.entries.first();
    if (!entry) return;

    const executor = entry.executor;
    if (isWhitelisted(executor.id)) return;

    const key = `${executor.id}_channelDelete`;
    const count = (recentActions.get(key) || 0) + 1;
    recentActions.set(key, count);

    setTimeout(() => recentActions.delete(key), 10000); // 10s window

    if (count > 2) {
        logIncident(channel.guild, "Mass Channel Deletion", executor, `Deleted over 2 channels in 10 seconds.`);
        await punishUser(channel.guild, executor, "Mass channel deletion (possible nuke)");
    }
});
