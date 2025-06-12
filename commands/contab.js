import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import fs from 'fs';
import path from 'path';

const filePath = path.resolve('data/categorie.json');
const CATEGORIE_PERMESSE = fs.existsSync(filePath)
  ? JSON.parse(fs.readFileSync(filePath, 'utf-8')).categorie
  : [];


export default {
  data: new SlashCommandBuilder()
    .setName('contab')
    .setDescription('Crea canali privati duplicati per un utente basati su alcune categorie accessibili al ruolo')
    .addUserOption(option =>
      option.setName('utente')
        .setDescription('Utente a cui assegnare il ruolo')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('ruolo')
        .setDescription('Ruolo da assegnare')
        .setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const utente = interaction.options.getMember('utente');
      const ruolo = interaction.options.getRole('ruolo');
      const username = utente.user.username.toLowerCase();

      await utente.roles.add(ruolo);

      let duplicatiCreati = 0;

      const categorie = interaction.guild.channels.cache
        .filter(c =>
          c.type === ChannelType.GuildCategory &&
          CATEGORIE_PERMESSE.includes(c.id) // ✅ Filtro per categorie permesse
        );

      for (const [, categoria] of categorie) {
        const permessoRuolo = categoria.permissionsFor(ruolo);
        if (!permessoRuolo || !permessoRuolo.has(PermissionFlagsBits.ViewChannel)) {
          continue;
        }

        const canaliTestuali = interaction.guild.channels.cache.filter(
          c => c.parentId === categoria.id && c.type === ChannelType.GuildText
        );

        for (const [, canale] of canaliTestuali) {
          const nuovoNome = `${canale.name}-${username}`;
          const esiste = interaction.guild.channels.cache.find(c => c.name === nuovoNome);
          if (esiste) continue;

          await interaction.guild.channels.create({
            name: nuovoNome,
            type: ChannelType.GuildText,
            parent: categoria,
            topic: canale.topic || null,
            permissionOverwrites: [
              {
                id: interaction.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: utente.id,
                allow: [PermissionFlagsBits.ViewChannel]
              }
            ]
          });

          duplicatiCreati++;
        }
        await nuovoCanale.send({
          content: `Benvenuto ${utente}, scegli un'opzione:`,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('apri_modal_aggiungi')
                .setLabel('💸 Inserisci Spesa/Incasso')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('apri_modal_saldo')
                .setLabel('📊 Visualizza Saldo')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('apri_modal_aiuto')
                .setLabel('ℹ️ Aiuto')
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
        
      }

      await interaction.editReply({
        content: duplicatiCreati === 0
          ? `✅ Nessun canale duplicato necessario per ${utente.user.tag}.`
          : `✅ Creati ${duplicatiCreati} canali privati per ${utente.user.tag} basati sul ruolo ${ruolo.name}.`
      });

    } catch (err) {
      console.error('Errore comando contab:', err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ Errore durante l\'esecuzione del comando.' });
      } else {
        await interaction.reply({ content: '❌ Errore durante l\'esecuzione del comando.', ephemeral: true });
      }
    }
  }
};
