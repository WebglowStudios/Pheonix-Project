import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface LeadEmailData {
  name: string;
  phone: string;
  email: string;
  services: string[];
  connect_time: string;
  message: string;
  source: string;
}

const CONNECT_TIME_MAP: Record<string, string> = {
  morning: "Morning (9:00 AM - 12:00 PM)",
  afternoon: "Afternoon (12:00 PM - 3:00 PM)",
  late_afternoon: "Late Afternoon (3:00 PM - 6:00 PM)",
  evening: "Evening (6:00 PM - 8:00 PM)",
  anytime: "Anytime during office hours (9:30 AM - 6:30 PM IST)",
};

export function formatConnectTime(rawTime?: string): string {
  if (!rawTime) return "Not specified";
  const key = rawTime.toLowerCase().trim();
  if (CONNECT_TIME_MAP[key]) {
    return CONNECT_TIME_MAP[key];
  }
  return rawTime.replace(/_/g, " ");
}

export async function sendLeadNotification(data: LeadEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "connect@phoenixfiserv.co.in";
  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "connect@phoenixfiserv.co.in";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://phoenixfiserv.co.in").replace(/\/$/, "");

  const sourceLabel = data.source === "home_page" ? "Homepage Form" : "Contact Page Form";
  const servicesLabel =
    data.services.length > 0
      ? data.services.map((s) => s.replace(/_/g, " ")).join(", ")
      : "Not specified";
  const connectTimeLabel = formatConnectTime(data.connect_time);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f5f7; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #333333; padding: 28px 32px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 1.2rem; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: #E8740C; margin: 4px 0 0; font-size: 0.85rem; }
    .badge { display: inline-block; background: #E8740C; color: white; font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .body { padding: 28px 32px; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 0.72rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .field-value { font-size: 0.95rem; color: #333; font-weight: 500; }
    .field-value a { color: #E8740C; text-decoration: none; }
    .divider { height: 1px; background: #eeeeee; margin: 20px 0; }
    .message-box { background: #f9f9f9; border-left: 3px solid #E8740C; border-radius: 0 6px 6px 0; padding: 14px 16px; font-size: 0.9rem; color: #444; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
    .footer { background: #f4f5f7; padding: 16px 32px; text-align: center; font-size: 0.75rem; color: #999; border-top: 1px solid #eee; }
    .cta { display: inline-block; margin-top: 20px; padding: 10px 24px; background: #E8740C; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Phoenix Financial Services</h1>
      <p>New Lead Notification</p>
    </div>
    <div class="body">
      <div class="badge">New Lead</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Full Name</div>
          <div class="field-value">${data.name}</div>
        </div>
        <div class="field">
          <div class="field-label">Source</div>
          <div class="field-value">${sourceLabel}</div>
        </div>
        <div class="field">
          <div class="field-label">Phone</div>
          <div class="field-value"><a href="tel:${data.phone}">${data.phone}</a></div>
        </div>
        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
        </div>
        <div class="field">
          <div class="field-label">Interested In</div>
          <div class="field-value">${servicesLabel}</div>
        </div>
        <div class="field">
          <div class="field-label">Best Time to Connect</div>
          <div class="field-value">${connectTimeLabel}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="field">
        <div class="field-label">Message / Goals</div>
        <div class="message-box">${data.message || "No message provided."}</div>
      </div>
      <div style="text-align:center">
        <a href="${siteUrl}/admin/leads" class="cta">
          View in Admin Dashboard →
        </a>
      </div>
    </div>
    <div class="footer">
      This is an automated notification from Phoenix Financial Services CMS.<br>
      Received on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
New Lead — Phoenix Financial Services

Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}
Services: ${servicesLabel}
Connect Time: ${connectTimeLabel}
Source: ${sourceLabel}

Message:
${data.message || "No message provided."}

View leads: ${siteUrl}/admin/leads
  `.trim();

  await transporter.sendMail({
    from: `"Phoenix Financial" <${fromEmail}>`,
    to: adminEmail,
    subject: `New Lead: ${data.name} (${servicesLabel})`,
    text,
    html,
  });
}

export async function sendUserThankYouEmail(data: LeadEmailData) {
  // Set to true when ready to enable auto-responder emails to visitors
  const ENABLE_USER_THANK_YOU_EMAIL = false;
  if (!ENABLE_USER_THANK_YOU_EMAIL) return;

  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "connect@phoenixfiserv.co.in";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://phoenixfiserv.co.in").replace(/\/$/, "");
  const connectTimeLabel = formatConnectTime(data.connect_time);

  if (!data.email || !data.email.includes("@")) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f5f7; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #333333; padding: 28px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: #E8740C; margin: 4px 0 0; font-size: 0.85rem; font-weight: 600; }
    .body { padding: 32px; }
    .greeting { font-size: 1.1rem; font-weight: 700; color: #333; margin-bottom: 14px; }
    .text { font-size: 0.95rem; color: #444; line-height: 1.65; margin-bottom: 20px; }
    .box { background: #FFF3EB; border-left: 4px solid #E8740C; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; }
    .box-title { font-size: 0.8rem; font-weight: 700; color: #E8740C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .box-desc { font-size: 0.9rem; color: #333; margin: 0; line-height: 1.5; }
    .footer { background: #f4f5f7; padding: 20px 32px; text-align: center; font-size: 0.8rem; color: #777; border-top: 1px solid #eee; }
    .footer a { color: #E8740C; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Phoenix Financial Services</h1>
      <p>Investing for the Future</p>
    </div>
    <div class="body">
      <div class="greeting">Dear ${data.name},</div>
      <div class="text">
        Thank you for getting in touch with <strong>Phoenix Financial Services</strong>. We have successfully received your message and your request has been logged.
      </div>
      <div class="box">
        <div class="box-title">What Happens Next?</div>
        <p class="box-desc">
          Our expert financial advisory team is reviewing your details and will connect with you during your preferred time window: <strong>${connectTimeLabel}</strong>.
        </p>
      </div>
      <div class="text">
        Should you need immediate assistance in the meantime, please feel free to call us or chat with us on WhatsApp.
      </div>
    </div>
    <div class="footer">
      <strong>Phoenix Financial Services</strong><br>
      Website: <a href="${siteUrl}">${siteUrl.replace(/^https?:\/\//, "")}</a> | Phone: +91 70212 10788
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Dear ${data.name},

Thank you for reaching out to Phoenix Financial Services. We have received your message and an expert advisor will get in touch with you during your preferred time window: ${connectTimeLabel}.

Website: ${siteUrl}
Phone: +91 70212 10788
  `.trim();

  try {
    await transporter.sendMail({
      from: `"Phoenix Financial Services" <${fromEmail}>`,
      to: data.email,
      subject: `Thank you for contacting Phoenix Financial Services`,
      text,
      html,
    });
  } catch (error) {
    console.error("Failed to send thank-you email to user:", error);
  }
}
