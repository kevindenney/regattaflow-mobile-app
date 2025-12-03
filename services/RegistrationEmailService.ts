/**
 * Registration Email Service
 * Send beautiful confirmation emails when sailors register for events
 * Better than SAILTI's plain text emails
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface RegistrationEmailData {
  // Sailor info
  sailor_name: string;
  sailor_email: string;
  sailor_phone?: string;
  
  // Registration details
  registration_id: string;
  entry_number?: string;
  sail_number: string;
  boat_name?: string;
  boat_class?: string;
  division?: string;
  
  // Regatta info
  regatta_id: string;
  regatta_name: string;
  regatta_dates: string;
  regatta_location: string;
  regatta_venue?: string;
  
  // Club/organizer info
  club_name: string;
  club_logo_url?: string;
  club_email?: string;
  club_website?: string;
  
  // URLs
  sailor_portal_url: string;
  regatta_url: string;
  nor_url?: string;
  si_url?: string;
  
  // Payment
  payment_status: 'pending' | 'paid' | 'waived';
  entry_fee?: string;
  receipt_url?: string;
  
  // Credentials (if creating new account)
  temp_password?: string;
  is_new_account?: boolean;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// ============================================================================
// EMAIL SERVICE CLASS
// ============================================================================

class RegistrationEmailService {

  /**
   * Send registration confirmation email
   */
  async sendConfirmationEmail(data: RegistrationEmailData): Promise<boolean> {
    try {
      const template = this.generateConfirmationEmail(data);
      
      // Send via Supabase Edge Function or email provider
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: data.sailor_email,
          subject: template.subject,
          html: template.html,
          text: template.text,
          replyTo: data.club_email,
        },
      });

      if (error) {
        console.error('Error sending confirmation email:', error);
        return false;
      }

      // Log the email sent
      await this.logEmailSent(data.registration_id, 'confirmation', data.sailor_email);
      
      return true;
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return false;
    }
  }

  /**
   * Generate beautiful HTML confirmation email
   */
  generateConfirmationEmail(data: RegistrationEmailData): EmailTemplate {
    const subject = `✅ Registration Confirmed - ${data.regatta_name}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header-logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      margin-bottom: 16px;
      background: white;
    }
    .header h1 {
      color: white;
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
      margin: 0;
    }
    .success-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 16px;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .intro {
      color: #64748b;
      margin-bottom: 24px;
    }
    .detail-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .detail-card h3 {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 16px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #64748b;
      font-size: 14px;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 600;
      font-size: 14px;
    }
    .sail-number {
      font-family: 'Monaco', 'Consolas', monospace;
      background: #1e293b;
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 14px;
    }
    .action-button {
      display: inline-block;
      background: #0ea5e9;
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      margin: 8px 4px;
    }
    .action-button.secondary {
      background: #f1f5f9;
      color: #1e293b !important;
    }
    .button-row {
      text-align: center;
      margin: 24px 0;
    }
    .features-section {
      margin: 32px 0;
    }
    .features-section h3 {
      font-size: 16px;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .feature-icon {
      width: 24px;
      height: 24px;
      background: #dbeafe;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
      color: #0ea5e9;
      font-size: 12px;
    }
    .feature-text {
      color: #64748b;
      font-size: 14px;
    }
    .checklist {
      background: #fef3c7;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .checklist h3 {
      color: #92400e;
      font-size: 15px;
      margin: 0 0 12px 0;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      color: #78350f;
      font-size: 14px;
    }
    .checklist-item:last-child {
      margin-bottom: 0;
    }
    .checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid #d97706;
      border-radius: 4px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .documents-section {
      background: #f0fdf4;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .documents-section h3 {
      color: #166534;
      font-size: 15px;
      margin: 0 0 12px 0;
    }
    .doc-link {
      display: flex;
      align-items: center;
      color: #15803d;
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .doc-link:hover {
      text-decoration: underline;
    }
    .credentials-box {
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .credentials-box h3 {
      color: #dc2626;
      font-size: 15px;
      margin: 0 0 12px 0;
    }
    .credential-row {
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }
    .credential-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .credential-value {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 16px;
      color: #0f172a;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #64748b;
      font-size: 13px;
      margin: 4px 0;
    }
    .footer a {
      color: #0ea5e9;
      text-decoration: none;
    }
    .social-links {
      margin-top: 16px;
    }
    .social-link {
      display: inline-block;
      width: 36px;
      height: 36px;
      background: #e2e8f0;
      border-radius: 50%;
      margin: 0 4px;
      line-height: 36px;
      text-align: center;
      color: #64748b;
      text-decoration: none;
    }
    .calendar-add {
      background: #8b5cf6;
      color: white !important;
    }
    @media (max-width: 600px) {
      .wrapper {
        padding: 12px;
      }
      .content {
        padding: 24px 16px;
      }
      .action-button {
        display: block;
        margin: 8px 0;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        ${data.club_logo_url ? `<img src="${data.club_logo_url}" alt="${data.club_name}" class="header-logo">` : ''}
        <h1>${data.regatta_name}</h1>
        <p>${data.regatta_dates} • ${data.regatta_location}</p>
        <div class="success-badge">✓ Registration Confirmed</div>
      </div>
      
      <!-- Content -->
      <div class="content">
        <p class="greeting">Hi ${data.sailor_name.split(' ')[0]}! 👋</p>
        
        <p class="intro">
          Great news - you're officially registered for <strong>${data.regatta_name}</strong>! 
          We're excited to see you on the water in ${data.regatta_location}.
        </p>
        
        <!-- Registration Details -->
        <div class="detail-card">
          <h3>📋 Your Registration</h3>
          <div class="detail-row">
            <span class="detail-label">Entry #</span>
            <span class="detail-value">${data.entry_number || 'TBD'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sail Number</span>
            <span class="sail-number">${data.sail_number}</span>
          </div>
          ${data.boat_name ? `
          <div class="detail-row">
            <span class="detail-label">Boat Name</span>
            <span class="detail-value">${data.boat_name}</span>
          </div>
          ` : ''}
          ${data.boat_class ? `
          <div class="detail-row">
            <span class="detail-label">Class</span>
            <span class="detail-value">${data.boat_class}</span>
          </div>
          ` : ''}
          ${data.division ? `
          <div class="detail-row">
            <span class="detail-label">Division</span>
            <span class="detail-value">${data.division}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Payment</span>
            <span class="detail-value" style="color: ${data.payment_status === 'paid' ? '#10b981' : '#f59e0b'}">
              ${data.payment_status === 'paid' ? '✓ Paid' : data.payment_status === 'waived' ? 'Waived' : '⏳ Pending'}
              ${data.entry_fee ? ` (${data.entry_fee})` : ''}
            </span>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="button-row">
          <a href="${data.sailor_portal_url}" class="action-button">Open My Portal</a>
          <a href="${data.regatta_url}" class="action-button secondary">View Regatta</a>
        </div>
        
        ${data.is_new_account && data.temp_password ? `
        <!-- Credentials -->
        <div class="credentials-box">
          <h3>🔐 Your Login Credentials</h3>
          <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 12px;">
            Save these - you'll need them to access your Sailor Portal
          </p>
          <div class="credential-row">
            <div class="credential-label">Email (Username)</div>
            <div class="credential-value">${data.sailor_email}</div>
          </div>
          <div class="credential-row">
            <div class="credential-label">Temporary Password</div>
            <div class="credential-value">${data.temp_password}</div>
          </div>
          <p style="color: #7f1d1d; font-size: 12px; margin-top: 12px; margin-bottom: 0;">
            ⚠️ Please change your password after first login
          </p>
        </div>
        ` : ''}
        
        <!-- Sailor Portal Features -->
        <div class="features-section">
          <h3>🎯 Your Sailor Portal</h3>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
            Access your personal dashboard before, during, and after the regatta:
          </p>
          
          <div class="feature-item">
            <div class="feature-icon">📄</div>
            <span class="feature-text">View registration details & download receipts</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <span class="feature-text">Track your results and series standings</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚠️</div>
            <span class="feature-text">Check Rule 42 infractions</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚖️</div>
            <span class="feature-text">File protests & view hearing schedule</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📡</div>
            <span class="feature-text">Get live race signals & announcements</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">💬</div>
            <span class="feature-text">Message the race committee</span>
          </div>
        </div>
        
        ${(data.nor_url || data.si_url) ? `
        <!-- Documents -->
        <div class="documents-section">
          <h3>📚 Important Documents</h3>
          ${data.nor_url ? `
          <a href="${data.nor_url}" class="doc-link">
            📄 Notice of Race (NOR)
          </a>
          ` : ''}
          ${data.si_url ? `
          <a href="${data.si_url}" class="doc-link">
            📄 Sailing Instructions (SI)
          </a>
          ` : ''}
        </div>
        ` : ''}
        
        <!-- Checklist -->
        <div class="checklist">
          <h3>📝 Before the Regatta</h3>
          <div class="checklist-item">
            <div class="checkbox"></div>
            <span>Read the Notice of Race carefully</span>
          </div>
          <div class="checklist-item">
            <div class="checkbox"></div>
            <span>Check your measurement certificate is valid</span>
          </div>
          <div class="checklist-item">
            <div class="checkbox"></div>
            <span>Confirm your insurance coverage</span>
          </div>
          <div class="checklist-item">
            <div class="checkbox"></div>
            <span>Book accommodation if needed</span>
          </div>
          <div class="checklist-item">
            <div class="checkbox"></div>
            <span>Plan your travel to ${data.regatta_location}</span>
          </div>
        </div>
        
        <!-- Add to Calendar -->
        <div class="button-row">
          <a href="${this.generateCalendarUrl(data)}" class="action-button calendar-add">
            📅 Add to Calendar
          </a>
        </div>
        
        <div class="divider"></div>
        
        <!-- Contact Info -->
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          Questions? Contact the race office at<br>
          <a href="mailto:${data.club_email}">${data.club_email}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p><strong>${data.club_name}</strong></p>
        ${data.club_website ? `<p><a href="${data.club_website}">${data.club_website.replace('https://', '')}</a></p>` : ''}
        <p style="margin-top: 16px; font-size: 12px;">
          Powered by <a href="https://regattaflow.com">RegattaFlow</a>
        </p>
      </div>
    </div>
    
    <!-- Unsubscribe -->
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      This is a transactional email for your registration at ${data.regatta_name}.
    </p>
  </div>
</body>
</html>
    `.trim();

    const text = `
Registration Confirmed - ${data.regatta_name}

Hi ${data.sailor_name.split(' ')[0]}!

Great news - you're officially registered for ${data.regatta_name}!

📋 YOUR REGISTRATION
Entry #: ${data.entry_number || 'TBD'}
Sail Number: ${data.sail_number}
${data.boat_name ? `Boat Name: ${data.boat_name}` : ''}
${data.boat_class ? `Class: ${data.boat_class}` : ''}
${data.division ? `Division: ${data.division}` : ''}
Payment: ${data.payment_status === 'paid' ? 'Paid' : data.payment_status === 'waived' ? 'Waived' : 'Pending'}

📅 EVENT DETAILS
${data.regatta_name}
${data.regatta_dates}
${data.regatta_location}

🔗 IMPORTANT LINKS
Sailor Portal: ${data.sailor_portal_url}
Regatta Page: ${data.regatta_url}
${data.nor_url ? `Notice of Race: ${data.nor_url}` : ''}
${data.si_url ? `Sailing Instructions: ${data.si_url}` : ''}

${data.is_new_account && data.temp_password ? `
🔐 YOUR LOGIN CREDENTIALS
Email: ${data.sailor_email}
Temporary Password: ${data.temp_password}
Please change your password after first login.
` : ''}

Questions? Contact: ${data.club_email}

---
${data.club_name}
Powered by RegattaFlow
    `.trim();

    return { subject, html, text };
  }

  /**
   * Generate Google Calendar URL
   */
  private generateCalendarUrl(data: RegistrationEmailData): string {
    const title = encodeURIComponent(data.regatta_name);
    const location = encodeURIComponent(data.regatta_venue || data.regatta_location);
    const details = encodeURIComponent(
      `Sail #: ${data.sail_number}\n` +
      `Portal: ${data.sailor_portal_url}\n` +
      `Regatta: ${data.regatta_url}`
    );
    
    // Parse dates (assumes format like "March 15-20, 2026")
    // For now, use placeholder dates
    const startDate = '20260315';
    const endDate = '20260321';
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${location}&details=${details}&dates=${startDate}/${endDate}`;
  }

  /**
   * Log email sent for tracking
   */
  private async logEmailSent(
    registrationId: string,
    emailType: string,
    recipientEmail: string
  ): Promise<void> {
    await supabase.from('email_logs').insert({
      registration_id: registrationId,
      email_type: emailType,
      recipient_email: recipientEmail,
      sent_at: new Date().toISOString(),
    });
  }

  /**
   * Send registration update email
   */
  async sendUpdateEmail(
    registrationId: string,
    updateType: 'status_change' | 'payment_confirmed' | 'entry_number_assigned',
    details: Record<string, any>
  ): Promise<boolean> {
    // Get registration data
    const { data: registration } = await supabase
      .from('race_entries')
      .select(`
        *,
        sailor:sailor_id (*),
        regatta:regatta_id (
          *,
          club:club_id (*)
        )
      `)
      .eq('id', registrationId)
      .single();

    if (!registration) return false;

    let subject = '';
    let message = '';

    switch (updateType) {
      case 'status_change':
        subject = `Registration Update - ${registration.regatta.name}`;
        message = `Your registration status has been updated to: ${details.new_status}`;
        break;
      case 'payment_confirmed':
        subject = `Payment Confirmed - ${registration.regatta.name}`;
        message = 'Your payment has been received. You\'re all set!';
        break;
      case 'entry_number_assigned':
        subject = `Entry Number Assigned - ${registration.regatta.name}`;
        message = `You have been assigned entry number: ${details.entry_number}`;
        break;
    }

    // Send simplified update email
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: registration.sailor.email,
        subject,
        html: this.generateUpdateEmailHtml(registration, subject, message),
        text: `${subject}\n\n${message}`,
      },
    });

    return !error;
  }

  private generateUpdateEmailHtml(registration: any, subject: string, message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #1e293b; }
    .card { max-width: 500px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #0ea5e9; padding: 24px; color: white; text-align: center; }
    .content { padding: 24px; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0">${registration.regatta.name}</h2>
    </div>
    <div class="content">
      <p>Hi ${registration.sailor.full_name?.split(' ')[0] || 'Sailor'},</p>
      <p>${message}</p>
      <a href="${process.env.EXPO_PUBLIC_APP_URL}/my-events" class="button">View My Events</a>
    </div>
  </div>
</body>
</html>
    `;
  }
}

// Export singleton
export const registrationEmailService = new RegistrationEmailService();
export default RegistrationEmailService;

