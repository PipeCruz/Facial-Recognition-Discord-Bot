// import statements
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client();
const commands = require('./commands.js');
//regular expressions to find the valid part of a message
const mentionedRegex = /<@!?\d{18}>/;
const userIDRegex = /\d{18}/;
//react to messages
//will parse message and try to find a valid command
//reacts to people only
client.on('message', m => {
    if(!m.content.startsWith(prefix) || m.author.bot)return;
    const args = m.content.split(' ');
    const passesIDTest = (mentionedRegex.test(args[1]) || userIDRegex.test(args[1]));
    if(args[0].toLowerCase() === `${prefix}pfp`) {
        if(passesIDTest) {
            const id = args[1].match(userIDRegex)[0];
            m.guild.members.fetch(id).then(gMember=>{
                m.channel.send({
                    files: [gMember.user.displayAvatarURL()]
                }).then().catch();
            });
        }else if(args.length === 1) {
            m.channel.send({
                files: [m.author.displayAvatarURL()]
            }).then().catch();
        }
    }else if(args[0].toLowerCase() === `${prefix}facedet`) {
        if(args.length == 1 && m.attachments.size == 0) {
            commands.faceDet(m.author.displayAvatarURL(), m.channel);
        }else if(m.attachments.size == 1) {
            try {
                let url;
                m.attachments.forEach(u => {
                    url = u.url;
                });
                commands.faceDet(url, m.channel);
            }catch(error) {
                console.log(error);
            }
        }else if(args.length == 2 && args[1].substr(0, 4) === 'http') {
            commands.faceDet(args[1], m.channel);
        }else if(passesIDTest) {
            const id = args[1].match(userIDRegex)[0];
            m.guild.members.fetch(id).then(gMember=>{
                commands.faceDet(gMember.user.displayAvatarURL(), m.channel);
            });
        }
    }else if(args[0] === `${prefix}github`) {
        commands.sendGitHub(m);
    }else if(args[0] === `${prefix}help`) {
        commands.sendHelp(m);
    }
});
//status of bot
client.once('ready', () => {
    console.log('Logged in');
    client.user.setPresence({
        status: 'online',
        activity: { name: `${prefix}help`, type: 'PLAYING' },
    });
});
//login
client.login(token);
