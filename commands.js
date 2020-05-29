//imports
const Discord = require('discord.js');
const Stream = require('stream').Transform;
const cv = require('opencv4nodejs');
const frontFaceClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_DEFAULT);
const eyeClassifier = new cv.CascadeClassifier(cv.HAAR_EYE);
const fs = require('fs');
const { prefix } = require('./config.json');
const https = require('https');

//the facial recognition function
//this function will download the image and save it to temp/image.png
//the function will then create a 'mat' using opencv imread function and then a gray mat will be made from that
//the gray mat will then be searched for faces and for each face in the mat, a red box will be drawn
//for each face in the mat, a sub mat will be created and searched for eyes, where each eye will have a blue box drawn around it\
//the new file will be saved as temp/img.png and sent as so

function faceDet(imageIn, channel) {
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
        response.once('end', ()=> {
            console.log(`total bytes: ${totalbytes}`);
            fs.writeFileSync('temp/image.png', data.read());
            const mat = cv.imread('temp/image.png');
            if(mat == null){ return; }
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
                eyesDetected.forEach((eye) => {
                        const ePoint1 = new cv.Point2(eye.x, eye.y);
                        const ePoint2 = new cv.Point2(eye.x + eye.width, eye.y + eye.height);
                        mat.getRegion(rect).drawRectangle(ePoint1, ePoint2, new cv.Vec3(255, 0, 0));
                });
            });
            cv.imwrite('temp/img.png', mat);
            console.log(`size of file: ${fs.statSync('temp/img.png')['size']}`);
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
//sends an embed linking to my github
//replace the fields with yours if you'd like
function sendGitHub(message){
    message.channel.send(new Discord.MessageEmbed()
        .setColor('#00ffd5')
        .setTitle('Github')
        .setAuthor('@PipeCruz', 'https://avatars0.githubusercontent.com/u/43627567?s=460&v=4', 'https://github.com/pipecruz')
        .setThumbnail('https://avatars0.githubusercontent.com/u/43627567?s=64&v=4')
        .addFields(
            {
                 name: `My github`,
                 value: `https://github.com/PipeCruz`,
                 inline: false
            })
       );
}
//this function sends an Embed containing potentially helpful fields, like commands, how to use them, and what they do
function sendHelp(message){
    message.channel.send(new Discord.MessageEmbed()
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
//export the functions to use in index.js
module.exports = {
    faceDet:faceDet,
    sendGitHub:sendGitHub,
    sendHelp:sendHelp
}