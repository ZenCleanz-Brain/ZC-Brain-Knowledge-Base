// n8n webhook integration for ElevenLabs KB sync

export interface WebhookPayload {
  action: 'update' | 'delete' | 'revert';
  files: Array<{
    path: string;
    name: string;
  }>;
  content?: string;
  approvedBy: string;
  approvedAt: string;
}

export async function triggerN8nWebhook(payload: WebhookPayload): Promise<boolean> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL not configured, skipping webhook trigger');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && {
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('n8n webhook failed:', response.status, await response.text());
      return false;
    }

    console.log('n8n webhook triggered successfully');
    return true;
  } catch (error) {
    console.error('n8n webhook error:', error);
    return false;
  }
}

// Trigger notification webhook for new pending edits
export async function triggerNotificationWebhook(edit: {
  id: string;
  filePath: string;
  submittedBy: string;
}): Promise<boolean> {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

  if (!webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'new_pending_edit',
        edit,
        timestamp: new Date().toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Notification webhook error:', error);
    return false;
  }
}
