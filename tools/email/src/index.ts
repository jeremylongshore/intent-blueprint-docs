import { Resend } from 'resend';

// Lazy-initialize Resend to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * Send email using Resend
 *
 * @param options - Email options (to, subject, html, text, etc.)
 * @returns Promise with success status and message ID
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, replyTo, cc, bcc, tags } = options;

  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const from = process.env.EMAIL_FROM;
  if (!from) {
    console.error('[Email] EMAIL_FROM not configured');
    return { success: false, error: 'Email sender not configured' };
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
      replyTo,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      tags,
    });

    if (error) {
      console.error('[Email] Error sending email:', error);
      return { success: false, error: error.message };
    }

    const recipients = Array.isArray(to) ? to.join(', ') : to;
    console.log(`[Email] Sent to: ${recipients} - Subject: ${subject} - ID: ${data?.id}`);
    return { success: true, data: data ? { id: data.id } : undefined };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send batch emails using Resend
 *
 * @param emails - Array of email options
 * @returns Promise with array of results
 */
export async function sendBatchEmails(
  emails: EmailOptions[]
): Promise<EmailResult[]> {
  const results = await Promise.allSettled(emails.map(sendEmail));
  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      success: false,
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
    };
  });
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate email configuration
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const required = ['RESEND_API_KEY', 'EMAIL_FROM'];
  const missing = required.filter((key) => !process.env[key]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

export { Resend };
