import { emailLayout } from './layout';

export function securityAlertEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = typeof data.name === 'string' && data.name ? data.name : 'Admin';
  const severity = (data.severity as string) || 'medium';
  const message = (data.message as string) || 'A security-related event was detected on your AfriLaunch Hub workspace.';

  const subject = severity === 'critical' ? 'CRITICAL security alert - AfriLaunch Hub' : 'Security alert - AfriLaunch Hub';
  const preheader = 'Unusual activity was detected. Review details in your Security Dashboard.';

  const severityLabel =
    severity === 'critical'
      ? 'Critical'
      : severity === 'high'
      ? 'High'
      : severity === 'low'
      ? 'Low'
      : 'Medium';

  const content = `
    <p>Hi ${name},</p>
    <p>${message}</p>
    <p><strong>Severity:</strong> ${severityLabel}</p>
    <p>You can review this event and other recent activity in your Security Dashboard inside AfriLaunch Hub.</p>
    <p>If you do not recognise this activity, we recommend:</p>
    <ul>
      <li>Reviewing recent admin logins and sessions</li>
      <li>Rotating any sensitive API keys or credentials</li>
      <li>Enforcing strong passwords and 2FA for your team</li>
    </ul>
    <p>Stay safe,<br/>AfriLaunch Hub Security</p>
  `;

  return {
    subject,
    html: emailLayout(content, preheader),
  };
}

