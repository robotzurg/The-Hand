const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping!')
        .setDMPermission(true),
	async execute(interaction) {
        interaction.reply('Hello!');
    },
};