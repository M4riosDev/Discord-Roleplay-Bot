const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const moment = require("moment-timezone");

// 🔒 Safe reply function
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

const sendAbsence = async (client, context) => {
    try {
        const isInteraction = context.isCommand?.();

        if (!context.guild) {
            return await sendReply(context, {
                content: "❌ Λειτουργεί μόνο σε servers!",
                ephemeral: true
            });
        }

        const allowedRoles = client.config?.off?.roles || [];
        if (allowedRoles.length > 0 && !context.member.roles.cache.some(r => allowedRoles.includes(r.id))) {
            return await sendReply(context, {
                content: "❌ Δεν έχετε δικαίωμα!",
                ephemeral: true
            });
        }

        // Πάρε τιμές
        const name = isInteraction
            ? context.options.getString("όνομα")
            : context.content.split(" ")[1];
        const rank = isInteraction
            ? context.options.getString("βαθμίδα")
            : context.content.split(" ")[2];
        const startDate = isInteraction
            ? context.options.getString("έναρξη")
            : context.content.split(" ")[3];
        const endDate = isInteraction
            ? context.options.getString("λήξη")
            : context.content.split(" ")[4];
        const reason = isInteraction
            ? context.options.getString("λόγος")
            : context.content.split(" ").slice(5).join(" ");

        if (!name || !rank || !startDate || !endDate || !reason) {
            const embed = new MessageEmbed()
                .setColor("RED")
                .setDescription("⚠️ Λείπουν πληροφορίες! Παράδειγμα: `/απουσία όνομα:Γιάννης βαθμίδα:G Leader έναρξη:01/01/2023 λήξη:05/01/2023 λόγος:ασθένεια`");
            return await sendReply(context, {
                embeds: [embed],
                ephemeral: true
            });
        }

        // 🕒 Format Greek time
        const formattedDate = moment().tz("Europe/Athens").format("DD/MM/YYYY HH:mm");

        // Embed
        const embed = new MessageEmbed()
            .setColor("#FF9900")
            .setTitle("Mostwanted RP-MC | Καταγραφή Απουσίας")
            .setThumbnail(client.config.server.image)
            .addFields(
                { name: "Όνομα", value: name, inline: true },
                { name: "Βαθμίδα", value: rank, inline: true },
                { name: "Έναρξη", value: startDate, inline: true },
                { name: "Λήξη", value: endDate, inline: true },
                { name: "Λόγος", value: reason, inline: false }
            )
            .setFooter({ text: `Ημερομηνία Καταγραφής: ${formattedDate}` });

        // Στείλε embed
        await sendReply(context, { embeds: [embed] });

        // Log σε κανάλι (αν υπάρχει)
        const logChannel = client.config?.off?.logChannel;
        if (logChannel) {
            const channel = await context.guild.channels.fetch(logChannel).catch(() => null);
            if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
        }
    } catch (err) {
        console.error("❌ Error in absence command:", err);
    }
};

module.exports = {
    name: "off",
    description: "📝 Καταχώρηση απουσίας",
    aliases: ["absence"],
    data: new SlashCommandBuilder()
        .setName("απουσία")
        .setDescription("📝 Καταχώρηση απουσίας")
        .addStringOption(option =>
            option.setName("όνομα").setDescription("Το όνομα του χρήστη").setRequired(true))
        .addStringOption(option =>
            option.setName("βαθμίδα").setDescription("Η βαθμίδα του χρήστη").setRequired(true))
        .addStringOption(option =>
            option.setName("έναρξη").setDescription("Ημερομηνία έναρξης (π.χ. 01/01/2023)").setRequired(true))
        .addStringOption(option =>
            option.setName("λήξη").setDescription("Ημερομηνία λήξης (π.χ. 05/01/2023)").setRequired(true))
        .addStringOption(option =>
            option.setName("λόγος").setDescription("Λόγος απουσίας").setRequired(true)),
    run: async (client, message) => await sendAbsence(client, message),
    execute: async (interaction) => await sendAbsence(interaction.client, interaction)
};
