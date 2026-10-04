import nodemailer from 'nodemailer'

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

export async function enviarEmail(
  to: string,
  subject: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await getTransporter().sendMail({
      from: `vaikeuvou <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
