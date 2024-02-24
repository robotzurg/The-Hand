const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { decks } = require('cards');
const _ = require('lodash');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('drawcard')
        .setDescription('Draw a card')
        .setDMPermission(true),
	async execute(interaction) {
        // Create a standard 52 card deck + 1 joker
        const deck = new decks.StandardDeck({ jokers: 1 });
        deck.shuffleAll();

        let cardChosen = deck.draw(1)[0];
        let cardDisplay, cardFileName;
        if (cardChosen.rank.name != 'Joker') {
            cardDisplay = `${cardChosen.rank.name} of ${_.capitalize(cardChosen.suit.name)}`;
            cardFileName = `${cardChosen.rank.abbrn}_of_${cardChosen.suit.name}.png`;
        } else {
            cardDisplay = `Joker`;
            cardFileName = 'joker.png';
        }
        const cardFile = new AttachmentBuilder(`./card_images/${cardFileName}`, { name: cardFileName })

        const cardDisplayEmbed = new EmbedBuilder()
        .setTitle(`Card Drawn`)
        .setDescription(`**${cardDisplay}**`)
        .setImage(`attachment://${cardFileName}`);
        interaction.reply({ embeds: [cardDisplayEmbed], files: [cardFile] });
    },
};