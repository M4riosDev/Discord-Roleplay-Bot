const client = require("../index");

client.on('ready', async () => {
    const guild = client.guilds.cache.get(client.config.server.id);
    setInterval(() =>{
        const memberCount = guild.memberCount
        const channel = guild.channels.cache.get(client.config.counting.members);
        channel.setName(`👥 Civilians: ${memberCount.toLocaleString()}`).catch()
    }, 60000);

    setInterval(() =>{
      const serverBoostCounter = guild.premiumSubscriptionCount;
      const channel = guild.channels.cache.get(client.config.counting.boosts);
      channel.setName(`🚀 Boosts: ${serverBoostCounter.toLocaleString()}`);
    }, 60000);
  
  });