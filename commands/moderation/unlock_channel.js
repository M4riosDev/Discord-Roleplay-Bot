const Discord = module.require("discord.js");

module.exports = {
  name: "unlock-channel",
  description: "Unlocks a Channel",
  category: "admin",
  P_user: ["MANAGE_CHANNELS"],
  P_bot: ["MANAGE_CHANNELS"],
  run: async (client, message, args) => {
    if(message.member.roles.cache.some(r => r.name === client.config.server.perms)){
    message.channel.permissionOverwrites.edit(message.guild.id, {
      SEND_MESSAGES: true
    });
    const embed = new Discord.MessageEmbed()
      .setTitle("Channel Updates")
      .setDescription(`🔒 ${message.channel} has been Unlocked`)
      .setColor("RANDOM");
    await message.channel.send({ embeds: [embed] });
    message.delete();
  }else{        
    message.delete().catch(err => console.log(err))
}}
};
