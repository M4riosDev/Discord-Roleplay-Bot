const { MessageEmbed } = require("discord.js");
const client = require("../../index");
const DMCampaign = require("../../models/modeldmall");

module.exports = {
  name: "dm",
  description: "Στείλε ένα προσωπικό μήνυμα σε συγκεκριμένο χρήστη, ρόλο ή σε όλους τους χρήστες του διακομιστή.",
  category: "misc",
  aliases: ["dmuser", "dmall", "dmrole"],
  run: async (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("❌ Δεν έχετε τα απαραίτητα δικαιώματα για να χρησιμοποιήσετε αυτή την εντολή.");
    }

    if (!args.length) return message.reply("❌ Χρήση: `!dm @user/@role/all μήνυμα`");

    const target = args[0];
    const dmMessage = args.slice(1).join(" ");
    if (!dmMessage) return message.reply("❌ Παρακαλώ, εισάγετε το μήνυμα που θέλετε να στείλετε.");

    let members;
    const guild = message.guild;

    if (target === "all") {
      members = (await guild.members.fetch()).filter(m => !m.user.bot);
    } else {
      const role = message.mentions.roles.first();
      if (!role) return message.reply("❌ Δεν βρέθηκε αυτός ο ρόλος.");
      members = role.members.filter(m => !m.user.bot);
    }

    const memberIds = members.map(m => m.id);

    const campaign = await DMCampaign.create({
      guildId: guild.id,
      channelId: message.channel.id,
      authorId: message.author.id,
      target: target === "all" ? "all" : message.mentions.roles.first().id,
      message: dmMessage,
      members: memberIds,
      lastSentIndex: 0,
      isRunning: true
    });

    let successCount = 0;
    let failureCount = 0;
    const total = memberIds.length;

    const progressEmbed = new MessageEmbed()
      .setColor("BLUE")
      .setTitle("📨 Αποστολή DM σε εξέλιξη")
      .setDescription(`🔄 Αποστολή μηνυμάτων...\n\n✅ Επιτυχίες: ${successCount}\n❌ Αποτυχίες: ${failureCount}\n📊 Πρόοδος: 0/${total}`)
      .setFooter({ text: `Από ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    const progressMsg = await message.channel.send({ embeds: [progressEmbed] });

    for (let i = campaign.lastSentIndex; i < memberIds.length; i++) {
      const memberId = memberIds[i];
      try {
        const user = await client.users.fetch(memberId);
        await user.send(dmMessage);
        successCount++;
      } catch (err) {
        console.error(`DM Fail για ${memberId}`, err);
        failureCount++;
      }

      await DMCampaign.updateOne(
        { _id: campaign._id },
        { lastSentIndex: i + 1 }
      );

      progressEmbed.setDescription(`🔄 Αποστολή μηνυμάτων...\n\n✅ Επιτυχίες: ${successCount}\n❌ Αποτυχίες: ${failureCount}\n📊 Πρόοδος: ${i + 1}/${total}`);
      await progressMsg.edit({ embeds: [progressEmbed] });

      await new Promise(res => setTimeout(res, 1000));
    }

    await DMCampaign.updateOne({ _id: campaign._id }, { isRunning: false });

    progressEmbed
      .setColor("GREEN")
      .setTitle("✅ Αποστολή DM Ολοκληρώθηκε")
      .setDescription(`📨 Η αποστολή ολοκληρώθηκε!\n\n✅ Επιτυχίες: ${successCount}\n❌ Αποτυχίες: ${failureCount}\n📊 Συνολικά μέλη: ${total}`);
    await progressMsg.edit({ embeds: [progressEmbed] });
  },
};
