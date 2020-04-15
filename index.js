const Discord = require('discord.js');
const client = new Discord.Client();

const cv = require('opencv4nodejs');
const https = require('https');
const Stream = require('stream').Transform;
const fs = require('fs');
const { prefix, token } = require('./config.json');

const frontFaceClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_DEFAULT);
const eyeClassifier = new cv.CascadeClassifier(cv.HAAR_EYE);

const mentionedRegex = /<@!?\d{18}>/;
const userIDRegex = /\d{18}/;

client.once('ready', () => {
    console.log('Logged in');
    client.user.setPresence({
        status: 'online',
        activity: { name: `${prefix}help`, type: 'PLAYING' },
    });
});

// fix file type
function newFaceDet(imageIn, channel) {
    let totalFacesDetected, totalEyesDetected = 0;
    https.request(imageIn, (response) => {
        console.log(imageIn);
        const data = new Stream();
        let totalbytes = 0;
        response.on('data', (d) => {
            console.log(`Received ${d.length} bytes of data.`);
            totalbytes += d.length;
            data.push(d);
        });
        // once or on?
        response.once('end', ()=> {
            console.log(`total bytes: ${totalbytes}`);
            fs.writeFileSync('temp/image.png', data.read());
            const mat = cv.imread('temp/image.png');
            const matGray = mat.bgrToGray();
            const faceObjs = frontFaceClassifier.detectMultiScale(matGray).objects;
            console.log(`Number of faces detected is ${faceObjs.length}`);
            totalFacesDetected = faceObjs.length;
            faceObjs.forEach(rect =>{
                // draw face rectangles
                const point1 = new cv.Point2(rect.x, rect.y);
                const point2 = new cv.Point2(rect.x + rect.width, rect.y + rect.height);
                mat.drawRectangle(point1, point2, new cv.Vec3(0, 0, 255));
                // eye detection
                const sectionForEyes = matGray.getRegion(rect);
                const eyesDetected = eyeClassifier.detectMultiScale(sectionForEyes).objects;
                console.log(`eyeObjects has ${eyesDetected.length}`);
                totalEyesDetected += eyesDetected.length;
                let eyeCnt = 0;
                eyesDetected.forEach((eye) => {
                    if(eyeCnt++ < 2) {
                        const ePoint1 = new cv.Point2(eye.x, eye.y);
                        const ePoint2 = new cv.Point2(eye.x + eye.width, eye.y + eye.height);
                        mat.getRegion(rect).drawRectangle(ePoint1, ePoint2, new cv.Vec3(255, 0, 0));
                    }
                });
            });
            cv.imwrite('temp/img.png', mat);
            const attachment = new Discord.MessageAttachment('temp/img.png');
            channel.send(new Discord.MessageEmbed()
                .setColor('#fc03c2')
                .setTitle('FaceDetection Output')
                .setAuthor('@PipeCruz', 'https://avatars0.githubusercontent.com/u/43627567?s=460&v=4', 'https://github.com/pipecruz')
                .attachFiles(attachment)
                .setImage('attachment://img.png')
                .addField('Faces Detected', `${totalFacesDetected}`)
                .addField('Eyes Detected', `${totalEyesDetected}`)
            );
        });
    }).end();
}

client.on('message', m => {
    if(!m.content.startsWith(prefix) || m.author.bot)return;
    const args = m.content.split(' ');
    const passesIDTest = mentionedRegex.test(args[1]) || userIDRegex.test(args[1]);
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
        // fixme since it looks for 18 characters in url
        if(args[1].substr(0, 5) === 'https') {
            newFaceDet(args[1], m.channel);
        }else if(passesIDTest) {
            const id = args[1].match(userIDRegex)[0];
            m.guild.members.fetch(id).then(gMember=>{
                newFaceDet(gMember.user.displayAvatarURL(), m.channel);
            });
        }else if(args.length === 1) {
            newFaceDet(m.author.displayAvatarURL(), m.channel);
        }
    }else if(args[0] === `${prefix}ping`) {
        m.channel.send('Pong!.. I dont want to find the delay so this is what you\'re going to deal with');
    }else if(args[0] === `${prefix}help`) {
        m.channel.send(new Discord.MessageEmbed()
            .setColor('#00ffd5')
            .setTitle('Commands')
            .setAuthor('@PipeCruz', 'https://avatars0.githubusercontent.com/u/43627567?s=460&v=4', 'https://github.com/pipecruz')
            .setThumbnail('https://avatars0.githubusercontent.com/u/43627567?s=64&v=4')
            .addFields(
                {
                    name: `${prefix}help`,
                    value: 'displays the list of available commands',
                    inline: false
                },
                {
                    name: `${prefix}pfp, ${prefix}pfp <mention>, ${prefix}pfp <userID>`,
                    value: 'displays specified user profile picture',
                    inline: false
                },
                {
                    name: `${prefix}facedet, ${prefix}facedet <mention>, ${prefix}facedet <link>`,
                    value: 'detects faces/eyes in user profile picture',
                    inline: false
                },
                {
                    name: `${prefix}github`,
                    value: 'sends link to bots source code',
                    inline: false
                }
            )
        );
    }
});

client.login(token);
