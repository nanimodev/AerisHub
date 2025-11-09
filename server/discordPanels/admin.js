const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { createKey, checkKey, deleteKey, getAllKeys } = require("../database/keyManager");

const ADMIN_CHANNEL_ID = "1437116467614318682";

// Duration options in minutes
const DURATION_OPTIONS = {
    "8h": { label: "8 Hours", minutes: 8 * 60 },
    "1d": { label: "1 Day", minutes: 24 * 60 },
    "1w": { label: "1 Week", minutes: 7 * 24 * 60 },
    "1m": { label: "1 Month", minutes: 30 * 24 * 60 },
    "permanent": { label: "Permanent", minutes: -1 }
};

async function setupAdminPanel(client) {
    try {
        const channel = await client.channels.fetch(ADMIN_CHANNEL_ID);
        if (!channel) {
            console.error(`[Discord Bot] Channel ${ADMIN_CHANNEL_ID} not found`);
            return;
        }

        // Check if panel already exists
        const messages = await channel.messages.fetch({ limit: 10 });
        const existingPanel = messages.find(msg => 
            msg.author.id === client.user.id && 
            msg.embeds.length > 0 &&
            msg.embeds[0].title === "Aeris Hub | Admin Panel"
        );

        if (existingPanel) {
            console.log(`[Discord Bot] Admin panel already exists in channel`);
            return;
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle("Aeris Hub | Admin Panel")
            .setDescription("Administrative control panel for key management")
            .setColor(0xFF5733);

        // Create buttons - Row 1
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("check_key")
                    .setLabel("Check Key")
                    .setEmoji("🔍")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("generate_key")
                    .setLabel("Generate Key")
                    .setEmoji("✨")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("delete_key")
                    .setLabel("Delete Key")
                    .setEmoji("🗑️")
                    .setStyle(ButtonStyle.Danger)
            );

        // Create buttons - Row 2
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("get_keys")
                    .setLabel("Get Keys")
                    .setEmoji("📋")
                    .setStyle(ButtonStyle.Secondary)
            );

        // Send panel
        await channel.send({
            embeds: [embed],
            components: [row1, row2]
        });

        console.log(`[Discord Bot] Admin panel created successfully in channel ${ADMIN_CHANNEL_ID}`);
    } catch (error) {
        console.error(`[Discord Bot] Error setting up admin panel:`, error);
    }
}

// Function to format duration
function formatDuration(minutes) {
    if (minutes === -1) return "Permanent";
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${minutes / 60}h`;
    if (minutes < 10080) return `${minutes / 1440}d`;
    if (minutes < 43200) return `${Math.round(minutes / 10080)}w`;
    return `${Math.round(minutes / 43200)}mo`;
}

// Function to send keys page with pagination
async function sendKeysPage(interaction, keys, page, isUpdate = false) {
    const KEYS_PER_PAGE = 10;
    const totalPages = Math.ceil(keys.length / KEYS_PER_PAGE);
    const startIndex = page * KEYS_PER_PAGE;
    const endIndex = startIndex + KEYS_PER_PAGE;
    const keysToShow = keys.slice(startIndex, endIndex);

    // Build keys list
    let keysList = "";
    for (const keyData of keysToShow) {
        const createdDate = new Date(keyData.created_at).toLocaleDateString();
        keysList += `\`${formatDuration(keyData.duration_minutes)} | ${createdDate}\` ||${keyData.key}||\n`;
    }

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle("📋 All Keys")
        .setDescription(`Total: **${keys.length}** keys | Page **${page + 1}** of **${totalPages}**\n\n${keysList}`)
        .setColor(0xFF5733)
        .setTimestamp();

    // Create pagination buttons
    const buttons = [];
    
    if (page > 0) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`keys_page_${page - 1}`)
                .setLabel("◀ Previous")
                .setStyle(ButtonStyle.Primary)
        );
    }

    if (page < totalPages - 1) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`keys_page_${page + 1}`)
                .setLabel("Next ▶")
                .setStyle(ButtonStyle.Primary)
        );
    }

    const row = buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons) : null;

    const response = {
        embeds: [embed],
        components: row ? [row] : [],
        ephemeral: true
    };

    if (isUpdate) {
        await interaction.update(response);
    } else {
        await interaction.reply(response);
    }
}

async function handleAdminInteraction(interaction) {
    if (interaction.customId === "check_key") {
        // Show modal to input key
        const modal = new ModalBuilder()
            .setCustomId("check_key_modal")
            .setTitle("Check Key");

        const keyInput = new TextInputBuilder()
            .setCustomId("key_input")
            .setLabel("Enter the key to check")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("AERIS-KEY-XXXXXXXXXXXX")
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(keyInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    } else if (interaction.customId === "generate_key") {
        // Create select menu for duration
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("select_duration")
            .setPlaceholder("Select key duration")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("⏰ 8 Hours")
                    .setValue("8h")
                    .setDescription("Key valid for 8 hours"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("📅 1 Day")
                    .setValue("1d")
                    .setDescription("Key valid for 1 day"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("📆 1 Week")
                    .setValue("1w")
                    .setDescription("Key valid for 1 week"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("🗓️ 1 Month")
                    .setValue("1m")
                    .setDescription("Key valid for 1 month"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("♾️ Permanent")
                    .setValue("permanent")
                    .setDescription("Key never expires")
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: "✨ **Generate New Key**\nPlease select the duration for the new key:",
            components: [row],
            ephemeral: true
        });
    } else if (interaction.customId === "delete_key") {
        // Show modal to input key
        const modal = new ModalBuilder()
            .setCustomId("delete_key_modal")
            .setTitle("Delete Key");

        const keyInput = new TextInputBuilder()
            .setCustomId("key_input")
            .setLabel("Enter the key to delete")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("AERIS-KEY-XXXXXXXXXXXX")
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(keyInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    } else if (interaction.customId === "get_keys") {
        const keys = getAllKeys();
        
        if (keys.length === 0) {
            await interaction.reply({
                content: "📋 No keys found in the database.",
                ephemeral: true
            });
            return;
        }

        // Start at page 1
        await sendKeysPage(interaction, keys, 0);
        console.log(`[Admin] ${interaction.user.tag} viewed all keys`);
    } else if (interaction.customId.startsWith("keys_page_")) {
        // Handle pagination
        const page = parseInt(interaction.customId.split("_")[2]);
        const keys = getAllKeys();
        await sendKeysPage(interaction, keys, page, true);
    }
}

async function handleAdminSelectMenu(interaction) {
    if (interaction.customId === "select_duration") {
        const selectedDuration = interaction.values[0];
        const durationInfo = DURATION_OPTIONS[selectedDuration];
        
        // Generate the key
        const result = createKey(durationInfo.minutes);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setTitle("✅ Key Generated Successfully")
                .setDescription("A new key has been created")
                .setColor(0x00FF00)
                .addFields(
                    { name: "🔑 Key", value: `\`${result.key}\``, inline: false },
                    { name: "⏱️ Duration", value: durationInfo.label, inline: false }
                )
                .setTimestamp();

            await interaction.update({
                content: null,
                embeds: [embed],
                components: []
            });

            console.log(`[Admin] ${interaction.user.tag} generated key: ${result.key} (${durationInfo.label})`);
        } else {
            await interaction.update({
                content: `❌ Error generating key: ${result.error}`,
                components: []
            });
        }
    }
}

async function handleAdminModal(interaction) {
    if (interaction.customId === "check_key_modal") {
        const keyToCheck = interaction.fields.getTextInputValue("key_input").trim();
        
        const keyData = checkKey(keyToCheck);
        
        if (!keyData) {
            await interaction.reply({
                content: `❌ Key not found: \`${keyToCheck}\``,
                ephemeral: true
            });
            return;
        }

        const createdDate = new Date(keyData.created_at).toLocaleString();
        
        const embed = new EmbedBuilder()
            .setTitle("🔍 Key Information")
            .setColor(0x00AE86)
            .addFields(
                { name: "Key", value: `\`${keyData.key}\``, inline: false },
                { name: "Duration", value: formatDuration(keyData.duration_minutes), inline: true },
                { name: "Created", value: createdDate, inline: true }
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

        console.log(`[Admin] ${interaction.user.tag} checked key: ${keyToCheck}`);
        
    } else if (interaction.customId === "delete_key_modal") {
        const keyToDelete = interaction.fields.getTextInputValue("key_input").trim();
        
        const success = deleteKey(keyToDelete);
        
        if (success) {
            await interaction.reply({
                content: `✅ Key successfully deleted: \`${keyToDelete}\``,
                ephemeral: true
            });
            console.log(`[Admin] ${interaction.user.tag} deleted key: ${keyToDelete}`);
        } else {
            await interaction.reply({
                content: `❌ Key not found or already deleted: \`${keyToDelete}\``,
                ephemeral: true
            });
        }
    }
}

module.exports = { setupAdminPanel, handleAdminInteraction, handleAdminSelectMenu, handleAdminModal };
