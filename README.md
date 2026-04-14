# NotifyAll GitHub Action

Send notifications to **Slack**, **Discord**, or **Microsoft Teams** via webhooks with a single unified interface. Auto-detects platform from the webhook URL.

## Inputs

| Input         | Required | Default | Description |
|---------------|----------|---------|-------------|
| `webhook_url` | **Yes**  | —       | Webhook URL (auto-detects platform) |
| `title`       | **Yes**  | —       | Notification title |
| `message`     | No       | —       | Notification body |
| `status`      | No       | `info`  | `success`, `failure`, `warning`, or `info` (affects color/emoji) |
| `fields`      | No       | `{}`    | JSON object of key-value fields to display |
| `footer`      | No       | —       | Footer text |
| `platform`    | No       | —       | Force: `slack`, `discord`, or `teams`. Auto-detected if empty. |

## Outputs

| Output     | Description |
|------------|-------------|
| `status`   | HTTP status code from webhook |
| `success`  | `true` if sent successfully |
| `platform` | Detected or configured platform |

## Examples

### Slack notification on deploy

```yaml
- name: Notify Slack
  uses: skgandikota/NotifyAll@v1
  with:
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    title: "Deploy Complete"
    message: "Version ${{ github.sha }} deployed to production"
    status: "success"
    fields: '{"Repo": "${{ github.repository }}", "Branch": "${{ github.ref_name }}", "Actor": "${{ github.actor }}"}'
    footer: "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

### Discord alert on failure

```yaml
- name: Notify Discord on failure
  if: failure()
  uses: skgandikota/NotifyAll@v1
  with:
    webhook_url: ${{ secrets.DISCORD_WEBHOOK }}
    title: "Build Failed"
    message: "CI build failed on `${{ github.ref_name }}`"
    status: "failure"
    fields: '{"Commit": "${{ github.sha }}", "Author": "${{ github.actor }}"}'
```

### Teams notification

```yaml
- name: Notify Teams
  uses: skgandikota/NotifyAll@v1
  with:
    webhook_url: ${{ secrets.TEAMS_WEBHOOK }}
    title: "Release Published"
    status: "success"
    fields: '{"Version": "v2.0.0", "Environment": "production"}'
```

## License

MIT
