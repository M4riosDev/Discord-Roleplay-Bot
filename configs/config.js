module.exports = {
    server: {
        name: "",
        image: "",
        banner: "",
        id: "",
        color: "",
        perms: ".",
        emojis: {
            "sin ena": "",
            "plein ena": "",
            online: "🟢",
            offline: "🔴",
        },
        roles: {
            staff:     "",
            managment: "",
            dmanager:  "",
            members: ""
        }
    },
    
       forms: {
          enable1: true,
          text1: "",
          emoji1: "",
          link1: "",
   
          enable2: true,
          text2: "",
          emoji2: "",
          link2: ""
       },

    bot: {
        token: "",
        prefix: "!",
        id: ""
    },

    DB: {
        mongoURI: ""
    },

    counting: {
        members: "",
        boosts: ""
    },

    antilink: {
        channel: "",
        allowedroles: ["", ""],
        allowedcategories: ["", "",""]
    },
    
    antinuke: {
         enabled: true,
         logs: "",
         whitelist: ["", "","",""]
      },

    applications: {
        channel: ""
    },

    antialt: {
        logs: "",
        notify: "",
        quarantineRole: ""
    },

    suggestion: "",

    automove: {
        support: {
            channel: "",
            notification: ""
        },
        donate: {
            channel: "",
            notification: ""
        }
    },

    duty: {
        channel: "",
        logs: "",
        onduty: "",
        modifyduty: ['', '', '']
    },

    mc: {
        ServerName: "",
        ServerImage: "",
        ServerIP: "",
        ServerPort: ""
    },

     ticket: {
        categories: {
            support: "",
            bug: "",
            report: "",
            other: "",
            Criminalct: "",
            Civilianct: ""
               },
            emojis: {
            support: "",
            bug: "",
            report: "",
            other: "",
            Criminalrl: "",
            Civilianrl: ""
           },
          roles: {
            support: "",
            bug: "",
            report: "",
            other: "",
            Civilianrl: "",
            Criminalrl: "",
        },
            defaultCategory: "",
            closedCategory: "",
            transcriptChannel: ""
       },
    
    application: {
        quest1: "",
        quest2: "",
        quest3: "",
        quest4: "",
        quest5: "",
        quest6: "",
        transriptch: ""   
},  
    logs: {
        message: "",
        member: "",
        role: "",
        voice: "",
        moderation: "",
        channel: ""
    }
}