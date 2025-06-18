const Data = require('st.db');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const client = require("../index");
const apply_time_db = new Data({ path: "models/Database/applys_time.yml" });
const db = new Data({ path: "models/Database/applys.yml" });

const questions = [
  client.config.application.quest1,
  client.config.application.quest2,
  client.config.application.quest3,
  client.config.application.quest4,
  client.config.application.quest5,
  client.config.application.quest6,
];

const activeApplications = new Map();

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'submit_a_support_rank_button') {
    if (await db.has({ key: `submit_${interaction.user.id}` }) === true) {
      return await interaction.reply({
        content: ":x: Έχετε ήδη κάνει αίτηση για Criminal Job",
        ephemeral: true
      });
    }

    await apply_time_db.set({ key: `time_${interaction.user.id}`, value: new Date() });
    activeApplications.set(interaction.user.id, { answers: [], currentQuestion: 0 });

    try {
      await interaction.user.send("Παρακαλώ απαντήστε στις παρακάτω ερωτήσεις.");
      await interaction.user.send(questions[0]);

      await interaction.reply({
        content: `✔️ Οι ερωτήσεις έχουν σταλεί μέσω DM. Παρακαλώ απαντήστε εκεί.`,
        ephemeral: true
      });
    } catch (error) {
      console.error(`Δεν μπόρεσα να στείλω DM στον χρήστη: ${error}`);
      return await interaction.reply({
        content: "✖️ Δεν μπόρεσα να στείλω DM. Παρακαλώ βεβαιωθείτε ότι έχετε ενεργοποιημένα τα προσωπικά μηνύματα.",
        ephemeral: true
      });
    }
  } else if (interaction.customId.startsWith('accept_') || interaction.customId.startsWith('reject_')) {
    const [action, userId] = interaction.customId.split('_');
    if (!userId || isNaN(Number(userId))) return;

    try {
      const user = await client.users.fetch(userId);
      const message = interaction.message;
      const statusText = action === 'accept' 
        ? `✅ Εγκρίθηκε από ${interaction.user.tag}` 
        : `❌ Απορρίφθηκε από ${interaction.user.tag}`;

      const updatedEmbed = new MessageEmbed(message.embeds[0])
        .spliceFields(6, 1, { name: "Κατάσταση:", value: statusText });

      const updatedButtons = new MessageActionRow().addComponents(
        new MessageButton().setCustomId(`accept_${userId}`).setLabel("Αποδοχή").setStyle("SUCCESS").setDisabled(true),
        new MessageButton().setCustomId(`reject_${userId}`).setLabel("Απόρριψη").setStyle("DANGER").setDisabled(true)
      );

      await message.edit({ embeds: [updatedEmbed], components: [updatedButtons] });

      if (action === 'accept') {
        await user.send(`✔️ Η αίτησή σου εγκρίθηκε! Πρέπει να ανοίξεις ένα ticket για να προχωρήσεις στη διαδικασία.`);
        await interaction.reply({ content: `Η αίτηση του ${user.tag} έγινε αποδεκτή.`, ephemeral: true });
      } else {
        await user.send(`✖️ Η αίτησή σου απορρίφθηκε.`);
        await db.delete({ key: `submit_${userId}` });
        await interaction.reply({ content: `Η αίτηση του ${user.tag} απορρίφθηκε.`, ephemeral: true });
      }

      const logChannel = client.channels.cache.get("MAIN_LOG_CHANNEL_ID");
      if (logChannel) {
        logChannel.send(`📝 **Ενημέρωση Αίτησης**\n👤 **Χρήστης:** ${user.tag} (${user.id})\n🔄 **Κατάσταση:** ${statusText}`);
      }
    } catch (error) {
      console.error(`Error processing application: ${error}`);
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.channel.type === "DM" && !message.author.bot) {
    const userId = message.author.id;
    const application = activeApplications.get(userId);
    if (!application) return;

    const { answers, currentQuestion } = application;
    answers.push(message.content);

    if (currentQuestion + 1 < questions.length) {
      activeApplications.set(userId, { answers, currentQuestion: currentQuestion + 1 });
      await message.author.send(questions[currentQuestion + 1]);
    } else {
      activeApplications.delete(userId);
      const applicationChannel = client.channels.cache.get(client.config.application.transriptch);
      const roleIdToPing = client.config.application.pingrl;

      if (!applicationChannel) {
        console.error("❌ Δεν βρέθηκε το κανάλι καταγραφής αιτήσεων (transriptch).");
        return;
      }

      const embed = new MessageEmbed()
        .setColor(client.config.server.color)
        .setTitle(`${message.author.tag} Υποβλήθηκε`)
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(`Απαντήσεις χρήστη:`)
        .addField(client.config.application.quest1, answers[0] || "Δεν απαντήθηκε")
        .addField(client.config.application.quest2, answers[1] || "Δεν απαντήθηκε")
        .addField(client.config.application.quest3, answers[2] || "Δεν απαντήθηκε")
        .addField(client.config.application.quest4, answers[3] || "Δεν απαντήθηκε")
        .addField(client.config.application.quest5, answers[4] || "Δεν απαντήθηκε")
        .addField(client.config.application.quest6, answers[5] || "Δεν απαντήθηκε")
        .addField("Κατάσταση:", "❔ Σε εκκρεμότητα")
        .setTimestamp();

      const actionRow = new MessageActionRow().addComponents(
        new MessageButton().setCustomId(`accept_${userId}`).setLabel("Αποδοχή").setStyle("SUCCESS"),
        new MessageButton().setCustomId(`reject_${userId}`).setLabel("Απόρριψη").setStyle("DANGER")
      );

      try {
        await applicationChannel.send({
          content: roleIdToPing ? `<@&${roleIdToPing}> Νέα αίτηση υποβλήθηκε!` : "📝 Νέα αίτηση υποβλήθηκε!",
          embeds: [embed],
          components: [actionRow]
        });

        await message.author.send("✔️ Η αίτησή σας υποβλήθηκε με επιτυχία!");
        await db.set({ key: `submit_${userId}`, value: true });
      } catch (error) {
        console.error(`Σφάλμα κατά την αποστολή της αίτησης: ${error}`);
      }
    }
  }
});
