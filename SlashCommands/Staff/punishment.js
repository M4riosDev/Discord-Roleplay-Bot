const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const moment = require("moment-timezone"); // ✅ για Greek time

// 🔒 Ασφαλές reply handler
const sendReply = async (ctx, payload) => {
    try {
        if (ctx.deferred) {
            await ctx.editReply(payload);
        } else if (ctx.replied) {
            await ctx.followUp(payload);
        } else {
            await ctx.reply(payload);
        }
    } catch (err) {
        console.error("❌ Failed to send reply:", err);
    }
};

const sendPunishment = async (client, context) => {
    try {
        const isInteraction = context.isCommand?.();

        if (!context.guild) {
            const response = { content: "❌ Λειτουργεί μόνο σε servers!", ephemeral: true };
            return await sendReply(context, response);
        }

        const allowedRoles = client.config?.punish?.roles || [];
        if (allowedRoles.length > 0 && !context.member.roles.cache.some(r => allowedRoles.includes(r.id))) {
            const response = { content: "❌ Δεν έχετε δικαίωμα!", ephemeral: true };
            return await sendReply(context, response);
        }

        // ➕ Λήψη στοιχείων
        const name = isInteraction ? context.options.getString("όνομα") : context.content.split(" ")[1];
        const fromUser = isInteraction ? context.options.getUser("από") : context.mentions.users.first();
        const punishment = isInteraction ? context.options.getString("ποινή") : context.content.split(" ")[3];
        const amount = isInteraction ? context.options.getInteger("πόσο") : parseInt(context.content.split(" ")[4]);
        const reason = isInteraction ? context.options.getString("reason") : context.content.split(" ").slice(5).join(" ");
        const proof = isInteraction ? context.options.getAttachment("proof") : null;

        if (!name || !fromUser || !punishment || isNaN(amount) || !reason) {
            const embed = new MessageEmbed()
                .setColor("RED")
                .setDescription("⚠️ Λείπουν πληροφορίες! Παράδειγμα: `/punishment όνομα:Γιάννης από:@User ποινή:σκούπες πόσο:250 reason:εξύβριση`");
            return await sendReply(context, { embeds: [embed], ephemeral: true });
        }

        // 🕒 Ελληνική ώρα με moment-timezone
        const formattedDate = moment().tz("Europe/Athens").format("DD/MM/YYYY HH:mm");

        // 📌 Embed τιμωρίας
        const embed = new MessageEmbed()
            .setColor("#FF0000")
            .setTitle("Mostwanted RP-MC Punishment System")
            .setThumbnail(client.config.server.image)
            .addFields(
                { name: "Όνομα", value: name, inline: true },
                { name: "Από", value: fromUser.toString(), inline: true },
                { name: "Ποινή", value: punishment, inline: true },
                { name: "Πόσο", value: amount.toString(), inline: true },
                { name: "Λόγος", value: reason, inline: false }
            )
            .setFooter({ text: `Ημερομηνία: ${formattedDate}` });

        if (proof) embed.setImage(proof.url);

        // ✅ Στείλε embed στο interaction
        await sendReply(context, { embeds: [embed] });

        // 🔁 Logging channel
        const logChannel = client.config?.punish?.logChannel;
        if (logChannel) {
            const channel = await context.guild.channels.fetch(logChannel).catch(() => null);
            if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
        }

    } catch (error) {
        console.error("❌ Error in punishment command:", error);
    }
};

module.exports = {
    name: "punishment",
    description: "🔨 Εφαρμόζει ποινή",
    aliases: ["punish"],
    data: new SlashCommandBuilder()
        .setName("punishment")
        .setDescription("🔨 Εφαρμόζει ποινή σε χρήστη")
        .addStringOption(option =>
            option.setName("όνομα")
                .setDescription("Το όνομα του χρήστη (κείμενο)")
                .setRequired(true))
        .addUserOption(option =>
            option.setName("από")
                .setDescription("Ποιος έδωσε την ποινή (@mention)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("ποινή")
                .setDescription("Τύπος ποινής (π.χ. σκούπες)")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("πόσο")
                .setDescription("Ποσό (π.χ. 250)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Λόγος ποινής")
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName("proof")
                .setDescription("Αποδεικτικό (εικόνα)")
                .setRequired(false)),
    run: async (client, message) => await sendPunishment(client, message),
    execute: async (interaction) => await sendPunishment(interaction.client, interaction)
};
