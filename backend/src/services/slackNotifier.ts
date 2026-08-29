import { redis } from '../redis/client';

export async function notifyRateLimitHit(
  user: { slackAccessToken: string | null; slackWebhookUrl: string | null; slackChannel: string | null; email: string },
  sender: { id: string; fromEmail: string }
) {
  // Only notify if user has Slack webhook configured
  if (!user.slackWebhookUrl) {
    console.log(`⚠️  Rate limit hit for ${sender.fromEmail} but user ${user.email} has no Slack connected`);
    return;
  }

  const key = `slackNotified:${sender.id}:${new Date().toISOString().slice(0, 13)}`;
  if (!(await redis.set(key, '1', 'EX', 3600, 'NX'))) return;

  try {
    const message = {
      text: `🚨 Rate Limit Alert`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Email Rate Limit Reached',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Sender:* ${sender.fromEmail}\n*User:* ${user.email}\n*Status:* Hourly limit reached. Emails will be delayed to next hour window.`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏰ ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(user.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }

    console.log(`✅ Slack notification sent to ${user.email} for ${sender.fromEmail}`);
  } catch (error) {
    console.warn('Slack notification failed', error);
  }
}
