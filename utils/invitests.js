const Invite = require("../models/invite");

const getInviteStats = async (guildId, userId) => {
    const invites = await Invite.find({ guildId, inviter_id: userId });

    const real = invites.filter(i => !i.fake && !i.left).length;
    const fake = invites.filter(i => i.fake).length;
    const left = invites.filter(i => i.left && !i.fake).length;
    const bonus = invites.reduce((sum, i) => sum + (i.bonus || 0), 0);

    return { real, fake, left, bonus };
};

const getTopInviters = async (guildId, limit = 10) => {
    const invites = await Invite.find({ guildId });
    const statsMap = new Map();

    for (const invite of invites) {
        const id = invite.inviter_id;
        if (!statsMap.has(id)) {
            statsMap.set(id, { real: 0, fake: 0, left: 0, bonus: 0 });
        }

        const entry = statsMap.get(id);
        if (invite.fake) entry.fake += 1;
        if (invite.left && !invite.fake) entry.left += 1;
        if (invite.bonus) entry.bonus += invite.bonus;
        if (!invite.fake && !invite.left) entry.real += 1;
    }

    const leaderboard = [];
    for (const [userId, stats] of statsMap.entries()) {
        leaderboard.push({
            userId,
            total: stats.real + stats.bonus,
            ...stats
        });
    }

    return leaderboard
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
};

module.exports = { getInviteStats, getTopInviters };
