const { MessageEmbed } = require("discord.js");
const client = require("../../index");

module.exports = {
  name: "dm",
  description: "Στείλε ένα προσωπικό μήνυμα σε συγκεκριμένο χρήστη, ρόλο ή σε όλους τους χρήστες του διακομιστή.",
  category: "misc",
  aliases: ["dmuser", "dmall", "dmrole"],
  run: async (client, message, args) => {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("❌ Δεν έχετε τα απαραίτητα δικαιώματα για να χρησιμοποιήσετε αυτή την εντολή.");
    }

    if (!args.length) {
      return message.reply("❌ Χρήση: `!dm @user/@role/all μήνυμα`");
    }

    let target = args[0];
    let dmMessage = args.slice(1).join(" ");

    if (!dmMessage) {
      return message.reply("❌ Παρακαλώ, εισάγετε το μήνυμα που θέλετε να στείλετε.");
    }

    if (target === "all") {
      const members = await message.guild.members.fetch();
      const filteredMembers = members.filter(member => !member.user.bot);

      await sendBulkDM(filteredMembers, dmMessage, message);
      return;
    }

    const role = message.mentions.roles.first();
    if (role) {
      const members = await message.guild.members.fetch();
      const roleMembers = members.filter(member => member.roles.cache.has(role.id) && !member.user.bot);

      if (!roleMembers.size) {
        return message.reply(`❌ Δεν βρέθηκαν μέλη με τον ρόλο ${role.name}.`);
      }

      await sendBulkDM(roleMembers, dmMessage, message);
      return;
    }

    const user = message.mentions.users.first();
    if (user) {
      try {
        await user.send(dmMessage);
        return message.reply(`✅ Το DM στάλθηκε επιτυχώς στον **${user.tag}**.`);
      } catch (error) {
        return message.reply(`❌ Απέτυχα να στείλω DM στον **${user.tag}**.`);
      }
    }

    return message.reply("❌ Δεν βρέθηκε ο χρήστης ή ο ρόλος. Χρήση: `!dm @user/@role/all μήνυμα`");
  },
};

async function sendBulkDM(members, dmMessage, message) {
  let successCount = 0;
  let failureCount = 0;
  let processedCount = 0;
  let totalMembers = members.size;

  const progressEmbed = new MessageEmbed()
    .setColor(client.config.server.color)
    .setTitle("📨 Αποστολή DM σε εξέλιξη")
    .setDescription(`🔄 Αποστολή μηνυμάτων...\n\n✅ Επιτυχίες: ${successCount}\n❌ Αποτυχίες: ${failureCount}\n📊 Πρόοδος: ${processedCount}/${totalMembers}`)
    .setFooter({ text: 'Made by m4r1os' })
    .setTimestamp();

  const progressMessage = await message.channel.send({ embeds: [progressEmbed] });

  for (const member of members.values()) {
    try {
      await member.send(dmMessage);
      successCount++;
    } catch (error) {
      console.error(`Δεν μπόρεσα να στείλω DM στον ${member.user.tag}:`, error);
      failureCount++;
    }
    processedCount++;

    progressEmbed.setDescription(`🔄 Αποστολή μηνυμάτων...\n\n✅ Επιτυχίες: ${successCount}\n❌ Αποτυχίες: ${failureCount}\n📊 Πρόοδος: ${processedCount}/${totalMembers}`);
    await progressMessage.edit({ embeds: [progressEmbed] });

    await new Promise(res => setTimeout(res, 1000));
  }

  progressEmbed
    .setColor("#2ecc71")
    .setTitle("✅ Αποστολή DM Ολοκληρώθηκε")
    .setDescription(`📨 Η αποστολή ολοκληρώθηκε!\n\n✅ Επιτυχίες: ${successCount}\n❌ Αποτυχίες: ${failureCount}\n📊 Συνολικά μέλη: ${totalMembers}`);
  await progressMessage.edit({ embeds: [progressEmbed] });
}
