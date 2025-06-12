import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('data/categorie.json');

export default {
  data: new SlashCommandBuilder()
    .setName('setcategorie')
    .setDescription('Aggiunge o rimuove una categoria alla lista abilitata')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('categoria')
        .setDescription('Categoria da aggiungere o rimuovere')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)),

  async execute(interaction) {
    const categoria = interaction.options.getChannel('categoria');

    let data = { categorie: [] };
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(raw);
    }

    const index = data.categorie.indexOf(categoria.id);
    let action = '';

    if (index === -1) {
      data.categorie.push(categoria.id);
      action = 'aggiunta';
    } else {
      data.categorie.splice(index, 1);
      action = 'rimossa';
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    await interaction.reply({
      content: `✅ Categoria **${categoria.name}** ${action} alla lista.`,
      ephemeral: true
    });
  }
};
