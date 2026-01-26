// n8n webhook integration for ElevenLabs KB sync

export interface WebhookPayload {
  action: 'update' | 'delete' | 'revert';
  files: Array<{
    path: string;
    name: string;
  }>;
  content?: string;
  approvedBy?: string;
  approvedAt?: string;
  revertedBy?: string;
  revertedAt?: string;
  originalEditBy?: string;
  isPartialApproval?: boolean;
}

// Response from n8n webhook (returned to webapp for UI feedback)
export interface WebhookResponse {
  success: boolean;
  reason?: 'not_found' | 'error' | 'skipped';
  document?: string;
  message: string;
}

export async function triggerN8nWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  // If webhook URL not configured, return success (don't block the commit)
  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL not configured, skipping webhook trigger');
    return {
      success: true,
      reason: 'skipped',
      message: 'ElevenLabs sync not configured'
    };
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
      const errorText = await response.text();
      console.error('n8n webhook failed:', response.status, errorText);
      return {
        success: false,
        reason: 'error',
        message: `Sync service error (${response.status})`
      };
    }

    // Parse the n8n response
    try {
      const result = await response.json();
      console.log('n8n webhook response:', result);

      // Return the structured response from n8n
      return {
        success: result.success ?? true,
        reason: result.reason,
        document: result.document,
        message: result.message || 'Synced to ElevenLabs'
      };
    } catch {
      // If response isn't JSON, assume success (backwards compatibility)
      console.log('n8n webhook triggered successfully (non-JSON response)');
      return {
        success: true,
        message: 'Synced to ElevenLabs'
      };
    }

  } catch (error) {
    console.error('n8n webhook error:', error);
    return {
      success: false,
      reason: 'error',
      message: 'Failed to connect to sync service'
    };
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
