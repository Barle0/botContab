// 📁 index.js
import { Client, Collection, GatewayIntentBits, Partials, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Errore durante il comando.', ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'apri_modal_aggiungi') {
      const modal = new ModalBuilder()
        .setCustomId('modal_aggiungi')
        .setTitle('Inserisci Spesa / Incasso')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('incasso')
              .setLabel('Incasso (€)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('spesa')
              .setLabel('Spesa (€)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('descrizione')
              .setLabel('Descrizione')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
        );

      await interaction.showModal(modal);
    } else if (interaction.customId === 'apri_modal_saldo') {
      const clientPg = await pool.connect();
      try {
        const res = await clientPg.query(
          `SELECT tipo, SUM(importo) as totale
           FROM movimenti
           WHERE user_id = $1 AND data >= NOW() - INTERVAL '1 month'
           GROUP BY tipo`,
          [interaction.user.id]
        );

        let incassi = 0;
        let spese = 0;
        res.rows.forEach(row => {
          if (row.tipo === 'incasso') incassi = parseFloat(row.totale);
          if (row.tipo === 'spesa') spese = parseFloat(row.totale);
        });

        const saldo = incassi - spese;

        await interaction.reply({
          content: `💰 Saldo attuale (ultimo mese): €${saldo.toFixed(2)}\n📈 Incassi: €${incassi}\n📉 Spese: €${spese}`,
          ephemeral: true
        });
      } finally {
        clientPg.release();
      }
    } else if (interaction.customId === 'apri_modal_aiuto') {
      await interaction.reply({
        ephemeral: true,
        content: `📘 **Guida al bot**\n\n- Usa \"💸 Inserisci Spesa/Incasso\" per aggiungere un movimento.\n- Usa \"📊 Visualizza Saldo\" per vedere il tuo bilancio mensile.\n- Tutti i dati sono salvati su database e accessibili solo a te.`
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_aggiungi') {
      const incasso = parseFloat(interaction.fields.getTextInputValue('incasso')) || 0;
      const spesa = parseFloat(interaction.fields.getTextInputValue('spesa')) || 0;
      const descrizione = interaction.fields.getTextInputValue('descrizione') || '';

      if (incasso === 0 && spesa === 0) {
        return await interaction.reply({ content: '⚠️ Inserisci almeno un valore.', ephemeral: true });
      }

      const clientPg = await pool.connect();
      try {
        if (incasso > 0) {
          await clientPg.query(
            'INSERT INTO movimenti (user_id, tipo, importo, descrizione) VALUES ($1, $2, $3, $4)',
            [interaction.user.id, 'incasso', incasso, descrizione]
          );
        }
        if (spesa > 0) {
          await clientPg.query(
            'INSERT INTO movimenti (user_id, tipo, importo, descrizione) VALUES ($1, $2, $3, $4)',
            [interaction.user.id, 'spesa', spesa, descrizione]
          );
        }
        await interaction.reply({ content: '✅ Voce registrata.', ephemeral: true });
      } finally {
        clientPg.release();
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
