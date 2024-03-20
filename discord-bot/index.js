// require the discord.js module
const fs = require('fs');
const Discord = require('discord.js');
const { token } = require('./config.json');
const { REST } = require('@discordjs/rest');
const { Routes, InteractionType } = require('discord-api-types/v9');
const _ = require('lodash');
const db = require('./db.js');

// create a new Discord client and give it some variables
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, 
    GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages], partials: [Partials.Channel, Partials.Message, Partials.Reaction] });
client.commands = new Discord.Collection();
const mainCommands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Place your client and guild ids here
const mainClientId = '1210774357224194129';

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    if (command.data.name.includes('admin')) {
        adminCommands.push(command.data.toJSON());
    } else {
        mainCommands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(mainClientId),
            { body: mainCommands },
        );

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

client.once('ready', async () => {
    console.log('Ready!');
    const date = new Date().toLocaleTimeString().replace("/.*(d{2}:d{2}:d{2}).*/", "$1");
    console.log(date);
});

// Listen for interactions (INTERACTION COMMAND HANDLER)
client.on('interactionCreate', async interaction => {

    if (interaction.type === InteractionType.MessageComponent) {
        let type, changeType = 1;
        switch (interaction.customId) {
            case '0': type = 'likes'; break;
            case '1': type = 'retweets'; break;
            case '2': type = 'dislikes'; break;
        }

        let tweetData = db.tweets.get(interaction.message.id);
        let tweetInteractionData = tweetData[`${type}`];
        if (tweetInteractionData.includes(interaction.user.id)) {
            changeType = -1;
            tweetInteractionData = tweetInteractionData.filter(v => v !== interaction.user.id);
        } else {
            tweetInteractionData.push(interaction.user.id);
        }
        tweetData[`${type}`] = tweetInteractionData;
        db.tweets.set(interaction.message.id, tweetData);

        let buttonNum = interaction.message.components[0].components[parseInt(interaction.customId)].data.label;
        buttonNum = parseInt(buttonNum.replace(/\,/g, '')) + (1 * changeType);
        interaction.message.components[0].components[parseInt(interaction.customId)].data.label = `${buttonNum.toLocaleString()}`;
        interaction.update({ embeds: [interaction.message.embeds[0]], components: [interaction.message.components[0]]})
    }

	if (interaction.type !== InteractionType.ApplicationCommand) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        await console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {
            interaction.editReply('There was an error while executing this command!');
        });
    }
});

client.on('messageCreate', async message => {
    if (message.channel.id == '1214447527785529424' && message.author.bot == false) {
        let tweetButtons = new Discord.ActionRowBuilder();
        let memberData = await message.guild.members.fetch(message.author.id);
        let memberRoles = message.member.roles.cache.map(r => r.name);
        let circleName = memberData.displayName;
        memberRoles = memberRoles.filter(r => r.includes('Circle_'))
        if (memberRoles.length != 0) {
            circleName = `@${memberRoles[0]}`
        }

        let tweetEmbed = new Discord.EmbedBuilder()
            .setAuthor({ name: circleName, iconURL: message.author.avatarURL({ extension: "png" }) })
            .setDescription(message.content);

        let randomLikes = (_.random(200, 2_000_000)).toLocaleString()
        let randomRetweets = (_.random(200, 2_000_000)).toLocaleString()
        let randomComments = (_.random(200, 2_000_000)).toLocaleString()

        tweetButtons.addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('0').setLabel(`${randomLikes}`)
                .setStyle(Discord.ButtonStyle.Primary).setEmoji('⬆️'),
            new Discord.ButtonBuilder()
                .setCustomId('1').setLabel(`${randomRetweets}`)
                .setStyle(Discord.ButtonStyle.Primary).setEmoji('🔁'),
            new Discord.ButtonBuilder()
                .setCustomId('2').setLabel(`${randomComments}`)
                .setStyle(Discord.ButtonStyle.Primary).setEmoji('⬇️'),
        );

        let sentMsg = await message.channel.send({ embeds: [tweetEmbed], components: [tweetButtons] })
        await db.tweets.set(sentMsg.id, {content: message.content, author_id: message.author.id, likes: [], retweets: [], dislikes: [], message_id: sentMsg.id })
        await message.delete();
    }
});



// login to Discord
client.login(token);
