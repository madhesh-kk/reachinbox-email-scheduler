import nodemailer from 'nodemailer';

interface Attachment {
  filename: string;
  content: string; // base64
  contentType: string;
}

export async function deliver(
  s: { fromEmail: string; smtpUser: string; smtpPass: string },
  to: string,
  subject: string,
  body: string,
  attachments?: Attachment[],
  useEthereal?: boolean
) {
  // Always use Ethereal Email (fake SMTP) as per assignment requirement
  console.log(`📧 Ethereal SMTP | From: ${s.fromEmail} | To: ${to}`);
  
  const transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: s.smtpUser,
      pass: s.smtpPass,
    },
  });

  // Prepare attachments for nodemailer
  const mailAttachments = attachments?.map(att => ({
    filename: att.filename,
    content: Buffer.from(att.content, 'base64'),
    contentType: att.contentType
  })) || [];

  const info = await transport.sendMail({
    from: s.fromEmail,
    to,
    subject,
    html: body,
    text: body.replace(/<[^>]+>/g, ''),
    attachments: mailAttachments,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  return `📧 Ethereal preview: ${previewUrl || 'Email queued'} ${mailAttachments.length > 0 ? `| ${mailAttachments.length} attachment(s)` : ''}`;
}
