import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('deletecanali')
    .setDescription('Elimina i canali duplicati privati di un utente')
    .addUserOption(option =>
      option.setName('utente')
        .setDescription('Utente a cui appartengono i canali duplicati')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }); // 👈 questa è la chiave

    const utente = interaction.options.getMember('utente');
    const username = utente.user.username.toLowerCase();

    let canaliEliminati = 0;

    const canaliTestuali = interaction.guild.channels.cache.filter(
      c =>
        c.type === ChannelType.GuildText &&
        c.name.endsWith(`-${username}`)
    );

    for (const [, canale] of canaliTestuali) {
      const permessi = canale.permissionOverwrites.cache;

      const soloUtente = permessi.size === 2 &&
        permessi.has(utente.id) &&
        permessi.has(interaction.guild.roles.everyone.id);

      if (soloUtente) {
        await canale.delete(`Cancellazione canale duplicato di ${username}`);
        canaliEliminati++;
      }
    }

    await interaction.editReply({
      content: canaliEliminati === 0
        ? `❌ Nessun canale duplicato trovato per ${utente.user.tag}.`
        : `✅ Eliminati ${canaliEliminati} canali duplicati per ${utente.user.tag}.`
    });
  }
};
