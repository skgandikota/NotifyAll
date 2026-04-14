const core = require("@actions/core");

const STATUS_CONFIG = {
  success: { color: "#2ea44f", colorInt: 3066703, emoji: "\u2705" },
  failure: { color: "#d73a49", colorInt: 14109257, emoji: "\u274c" },
  warning: { color: "#f9a825", colorInt: 16361509, emoji: "\u26a0\ufe0f" },
  info: { color: "#0366d6", colorInt: 224982, emoji: "\u2139\ufe0f" },
};

function detectPlatform(url) {
  if (url.includes("hooks.slack.com")) return "slack";
  if (url.includes("discord.com/api/webhooks") || url.includes("discordapp.com/api/webhooks")) return "discord";
  if (url.includes("webhook.office.com") || url.includes("microsoft.webhook")) return "teams";
  return "";
}

function buildSlackPayload(title, message, status, fields, footer) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.info;
  const attachment = {
    color: cfg.color,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `${cfg.emoji} *${title}*${message ? "\n" + message : ""}` },
      },
    ],
  };

  const fieldEntries = Object.entries(fields);
  if (fieldEntries.length > 0) {
    attachment.blocks.push({
      type: "section",
      fields: fieldEntries.map(([k, v]) => ({ type: "mrkdwn", text: `*${k}:*\n${v}` })),
    });
  }

  if (footer) {
    attachment.blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: footer }],
    });
  }

  return { attachments: [attachment] };
}

function buildDiscordPayload(title, message, status, fields, footer) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.info;
  const embed = {
    title: `${cfg.emoji} ${title}`,
    color: cfg.colorInt,
  };
  if (message) embed.description = message;
  const fieldEntries = Object.entries(fields);
  if (fieldEntries.length > 0) {
    embed.fields = fieldEntries.map(([k, v]) => ({ name: k, value: String(v), inline: true }));
  }
  if (footer) embed.footer = { text: footer };
  embed.timestamp = new Date().toISOString();
  return { embeds: [embed] };
}

function buildTeamsPayload(title, message, status, fields, footer) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.info;
  const facts = Object.entries(fields).map(([k, v]) => ({ name: k, value: String(v) }));
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: cfg.color.replace("#", ""),
    summary: title,
    sections: [
      {
        activityTitle: `${cfg.emoji} ${title}`,
        activitySubtitle: message || "",
        facts: facts.length > 0 ? facts : undefined,
        text: footer || undefined,
      },
    ],
  };
}

async function run() {
  try {
    const webhookUrl = core.getInput("webhook_url", { required: true });
    const title = core.getInput("title", { required: true });
    const message = core.getInput("message") || "";
    const status = core.getInput("status") || "info";
    const fields = JSON.parse(core.getInput("fields") || "{}");
    const footer = core.getInput("footer") || "";
    let platform = core.getInput("platform") || detectPlatform(webhookUrl);

    if (!platform) {
      throw new Error("Could not auto-detect platform from webhook URL. Please set the 'platform' input to: slack, discord, or teams.");
    }

    core.setOutput("platform", platform);

    let payload;
    switch (platform) {
      case "slack":
        payload = buildSlackPayload(title, message, status, fields, footer);
        break;
      case "discord":
        payload = buildDiscordPayload(title, message, status, fields, footer);
        break;
      case "teams":
        payload = buildTeamsPayload(title, message, status, fields, footer);
        break;
      default:
        throw new Error(`Unknown platform: ${platform}. Supported: slack, discord, teams.`);
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    core.setOutput("status", response.status);
    core.setOutput("success", String(response.ok));

    if (!response.ok) {
      const body = await response.text();
      core.setFailed(`Webhook returned ${response.status}: ${body}`);
    } else {
      core.info(`Notification sent to ${platform} (${response.status})`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
