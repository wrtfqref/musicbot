const Discord = require('discord.js');
const { Client, Util} = require('discord.js');
const config = require("./config.json");
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true});

const youtube = new YouTube(config.GOOGLE_API_KEY);
const PREFIX = config.prefix;

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => console.log('I am ready!'));

client.on('disconnect', () => console.log('I disconnected!'));

client.on('reconnecting', () => console.log('I am disconnecting!'));

client.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel
  let oldUserChannel = oldMember.voiceChannel
  const serverQueue = queue.get(oldMember.guild.id);


  if(oldUserChannel === undefined && newUserChannel !== undefined) {
      // User joines a voice channel
  } else if(newUserChannel === undefined){

    // User leaves a voice channel
      if(oldMember.id === '498378677512437762'){
          return console.log("BOT");
      }
      else{
          if(client.guilds.get(oldMember.guild.id).voiceConnection != null){
              if(client.guilds.get(oldMember.guild.id).voiceConnection.channel.id === oldUserChannel.id){
                    if(oldUserChannel.members.size < 2){
                        serverQueue.songs = [];
                        serverQueue.connection.dispatcher.end('No members left in the channel!')
                    }    
              }else{
                  return console.log('not in the same voice channel');
              }
          }else{
              return undefined;
          }
      }
         

  }
})


client.on('message', async msg => { // eslint-disable-line
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1];
    const serverQueue = queue.get(msg.guild.id);
    
    if(msg.content.startsWith(`${PREFIX}play`)){
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel){
            var embedplay1 = new Discord.RichEmbed()
                .setTitle(`Please Connect To A Voice Channel To Play Something!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedplay1);
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has('CONNECT')){
            var embedplay2 = new Discord.RichEmbed()
                .setTitle(`I lack the right CONNECT to connect in these Voice Channel!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedplay2);
        }
        if (!permissions.has('SPEAK')){
            var embedplay3 = new Discord.RichEmbed()
                .setTitle(`I do not have the right to SPEAK to connect in these Voice Channel!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedplay3);
        }
        
    
                      
        if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)){
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for(const video of Object.values(videos)){
                const video2 = await youtube.getVideoByID(video.id);
                await handleVideo(video2, msg, voiceChannel, true);
            }
            var embedplay4 = new Discord.RichEmbed()
                .setTitle(`Playlist: ${playlist.title} queued!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedplay4);
        }else{
            try{
                var video = await youtube.getVideo(url);
            }catch(error){
                try{
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    var embedqueue5 = new Discord.RichEmbed()
                        .setTitle(`Song Play list`)
                        .setDescription(`
${videos.map(video2 => `${++index}- ${video2.title}`).join('\n')}

Please enter a number between 1-10 on,a Song select!`)
                .setColor(['#f9fcfc'])
                    msg.channel.sendEmbed(embedqueue5);
                    
                    try{
                       var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                           maxMatches: 1,
                           time: 100000,
                           errors: ['time']
                       }); 
                    }catch(err){
                        console.error(err);
                        var embedplay6 = new Discord.RichEmbed()
                            .setTitle(`no or invalid number was entered. Demolition of the song selection!`)
                            .setColor(['#f9fcfc'])
                        return msg.channel.sendEmbed(embedplay6);
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                }catch(err){
                    console.error(err);
                    var embedplay7 = new Discord.RichEmbed()
                        .setTitle(`I could find no video!`)
                        .setColor(['#f9fcfc'])
                    return msg.channel.sendEmbed(embedplay7);
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
    
    } else if(msg.content.startsWith(`${PREFIX}skip`)) {
        if(!msg.member.voiceChannel){
           var embedskip1 = new Discord.RichEmbed()
                .setTitle(`You are in not in the Voice Channel!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedskip1); 
        }
        if(!serverQueue){
            var embedskip2 = new Discord.RichEmbed()
                .setTitle(`There is nothing to Skip!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedskip2);
        }
        serverQueue.connection.dispatcher.end('Skip command has been used!');
        var embedskip3 = new Discord.RichEmbed()
            .setTitle(`⏩Skipped👍`)
            .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedskip3);
    }   
        
     else if (msg.content.startsWith(`${PREFIX}stop`)){
        if(!msg.member.voiceChannel){
           var embedstop1 = new Discord.RichEmbed()
                .setTitle(`you're not in the voice channel!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedstop1); 
        }
        if(!serverQueue){
            var embedstop2 = new Discord.RichEmbed()
                .setTitle(`There is nothing to stop!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedstop2);
        }
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        var embedstop3 = new Discord.RichEmbed()
            .setTitle(`⏩Skipped👍`)
            .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedstop3);
    }
    else if(msg.content.startsWith(`${PREFIX}song`)){
        if(!serverQueue){
            var embedsong1 = new Discord.RichEmbed()
                .setTitle(`It does nothing at the moment!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedsong1);
                 }
            var embedsong2 = new Discord.RichEmbed()
                .setTitle(`${serverQueue.songs[0].title}`)
                .setThumbnail(serverQueue.songs[0].thumbnail)
                .setDescription(`
Von: ${serverQueue.songs[0].channel}
Dauer: ${serverQueue.songs[0].duration}
Link: ${serverQueue.songs[0].url}
`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedsong2); 
    }
    else if(msg.content.startsWith(`${PREFIX}volume`)){
        if(!serverQueue){
            var embedvolume1 = new Discord.RichEmbed()
                .setTitle(`It does nothing at the moment!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedvolume1);}
        if(!args[1]){
             var embedvolume2 = new Discord.RichEmbed()
                .setTitle(`The current volume is: ${serverQueue.volume}`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedvolume2);
        }
        
        if(args[1]>0){
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 2000);
        serverQueue.mute = false;
        var embedvolume3 = new Discord.RichEmbed()
                .setTitle(`The volume is on ${args[1]} set`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedvolume3);
        } else{
            var embedvolume4 = new Discord.RichEmbed()
                .setTitle(`Please enter a number >0 on!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedvolume4);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}queue`)){
        if(!serverQueue){
            var embedqueue1 = new Discord.RichEmbed()
                .setTitle(`It does nothing at the moment!`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedqueue1);
        }
        var embedqueue2 = new Discord.RichEmbed()
                .setTitle(`Song Queue`)
                .setDescription(`
${serverQueue.songs.map(song => `- ${song.title}`).join('\n')}

Playing: ${serverQueue.songs[0].title}`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedqueue2);
    }
    else if(msg.content.startsWith(`${PREFIX}pause`)){
        if(serverQueue && serverQueue.playing) {
        serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        var embedpause1 = new Discord.RichEmbed()
                .setTitle(`The song is stopped!`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedpause1);
        }
        var embedpause2 = new Discord.RichEmbed()
            .setTitle(`It does nothing at the moment!`)
            .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedpause2);
    }
    else if(msg.content.startsWith(`${PREFIX}resume`)){
        if(serverQueue && !serverQueue.playing){
        serverQueue.playing = true;
        serverQueue.connection.dispatcher.resume();
        var embedresume1 = new Discord.RichEmbed()
                .setTitle(`The song keeps playing on!`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedresume1);           
        }
        var embedresume2 = new Discord.RichEmbed()
            .setTitle(`It does nothing at the moment!`)
            .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedresume2);
    }   
    else if(msg.content.startsWith(`${PREFIX}mute`)){
        if(!serverQueue){
        var embedmute1 = new Discord.RichEmbed()
                .setTitle(`It does nothing at the moment!`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedmute1);     
        }
        if(serverQueue.mute){
        var embedmute2 = new Discord.RichEmbed()
                .setTitle(`The music Bot is already muted!`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedmute2);     
        }
        else{
            serverQueue.mute = true;
            serverQueue.connection.dispatcher.setVolume(0 / 2000);
            var embedmute3 = new Discord.RichEmbed()
                .setTitle(`The music Bot was muted!`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedmute3);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}unmute`)){
        if(!serverQueue){
            var embedunmute1 = new Discord.RichEmbed()
                .setTitle(`It does nothing at the moment!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedunmute1);     
        }
        if(!serverQueue.mute){
            var embedunmute2 = new Discord.RichEmbed()
                .setTitle(`The Music Bot is already unmuted!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedunmute2);     
        }   
        else{
            serverQueue.mute = false;
            serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 2000);
            var embedunmute3 = new Discord.RichEmbed()
                .setTitle(`The Music Bot has been unmuted!`)
                .setColor(['#f9fcfc'])
        return msg.channel.sendEmbed(embedunmute3);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}helpmusic`)){
        var embedhelp = new Discord.RichEmbed()
            .setTitle(`marcos-MusicBot Commands`)
            .addField("play [YouTube Link/Playlist]", "Usage: `!!play` Description: To play See The YouTube Linke And playlist.", false)
            .addField("play [Suchbegriff(e)]", "Usage: `!!play`<song name> Description: To play Music.", false)
            .addField("skip", "Usage: `!!skip` Description: To skip music.", false)
            .addField("stop", "Usage: `!!stop` Description: To Bot disconnected.", false)
            .addField("song", "Usage: `!!song` Description: To Check The Current playing song.", false)
            .addField("queue", "Usage: `!!queue` Description: To Check The Queue List.", false)
            .addField("volume", "Usage: `!!volume` Description: To See Volume.", false)
            .addField("volume [Wert]", "Usage: `!!volume` Description: To Changes the volume level to the specified value.", false)
            .addField("pause", "Usage: `!!pause` Description: To pause The Current Playing Song.", false)
            .addField("resume", "Usage: `!!resume` Description: To Resume The Paused Song.", false)
            .addField("mute", "Usage: `!!mute` Description: To mute Bot.", false)
            .addField("unmute", "Usage: `!!unmute` Description: To unmute Bot.", false)
            .setColor(['#f9fcfc'])
            .setThumbnail(client.user.avatarURL)
            return msg.channel.sendEmbed(embedhelp);
    }
    return undefined;
});


async function handleVideo(video, msg, voiceChannel, playlist=false){
    const serverQueue = queue.get(msg.guild.id);
    
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnails.default.url,
        channel: video.channel.title,
        duration: `${video.duration.hours}hrs : ${video.duration.minutes}min : ${video.duration.seconds}sec`
    };
    if(!serverQueue){
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 2100,
            mute: false,
            playing: true
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try{
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        }catch(error){
            console.log(error);
            queue.delete(msg.guild.id);
            var embedfunc1 = new Discord.RichEmbed()
                .setTitle(`Bot could not VoiceChannel the join!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedfunc1);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if(playlist) return undefined;
        else{
            var embedfunc2 = new Discord.RichEmbed()
                .setTitle(`${song.title} queued!`)
                .setColor(['#f9fcfc'])
            return msg.channel.sendEmbed(embedfunc2);
        }
    }    
    return undefined;
}

function play(guild, song){
    const serverQueue = queue.get(guild.id);
    
    if(!song){
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);
    
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
            .on('end', reason => {
                if(reason === 'Stream is not generating quickly enough.') console.log('Song ended');
                else console.log(reason);
                serverQueue.songs.shift();
                setTimeout(() => {
                play(guild, serverQueue.songs[0]);
                }, 250);
            })
            .on('error', error => console.log(error)); 
            
    dispatcher.setVolume(serverQueue.volume / 2000);
    
    var messagefunction1 = new Discord.RichEmbed()
                .setTitle(`Playing 🎶 ${song.title} -now`)
                .setColor(['#f9fcfc'])
            return serverQueue.textChannel.sendEmbed(messagefunction1);
}






const devs = ["462949947680096257","530086791152140298"];
const adminprefix = ["%"];
client.on('message', message => {
    var argresult = message.content.split(` `).slice(1).join(' ');
      if (!devs.includes(message.author.id)) return;
      
  if (message.content.startsWith('%ply')) {
    client.user.setGame(argresult);
      message.channel.send(`**✅   ${argresult}**`)
  } else 
     if (message.content === ("leave")) {
    message.guild.leave();        
  } else  
  if (message.content.startsWith('%wt')) {
  client.user.setActivity(argresult, {type:'WATCHING'});
      message.channel.send(`**✅   ${argresult}**`)
  } else 
  if (message.content.startsWith('%ls')) {
  client.user.setActivity(argresult , {type:'LISTENING'});
      message.channel.send(`**✅   ${argresult}**`)
  } else 
  if (message.content.startsWith('%st')) {
    client.user.setGame(argresult, "https://www.twitch.tv/idk");
      message.channel.send(`**✅Done**`)
  }
  if (message.content.startsWith('%setname')) {
  client.user.setUsername(argresult).then
      message.channel.send(`Changing The Name To ..**${argresult}** `)
} else
if (message.content.startsWith('%setavatar')) {
  client.user.setAvatar(argresult);
    message.channel.send(`Changing The Avatar To :**${argresult}** `);
}
});








client.login(process.env.BOT_TOKEN);
