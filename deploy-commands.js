import { REST, Routes, SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName('contab')
    .setDescription('Crea canali privati duplicati per un utente basati su ruolo')
    .addUserOption(option =>
      option.setName('utente')
        .setDescription('Utente a cui assegnare il ruolo')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('ruolo')
        .setDescription('Ruolo da assegnare')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('deletecanali')
    .setDescription('Elimina i canali duplicati privati di un utente')
    .addUserOption(option =>
      option.setName('utente')
        .setDescription('Utente a cui appartengono i canali duplicati')
        .setRequired(true)),

  // Qui aggiungi il comando setcategorie
  new SlashCommandBuilder()
    .setName('setcategorie')
    .setDescription('Aggiunge o rimuove una categoria alla lista abilitata')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('categoria')
        .setDescription('Categoria da aggiungere o rimuovere')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true))
]
  .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registrazione comandi...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Comandi registrati con successo.');
  } catch (error) {
    console.error(error);
  }
})();
