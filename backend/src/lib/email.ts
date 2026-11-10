import nodemailer from 'nodemailer';
import config from '../config';
import logger from './logger';

// ─── Transporter ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  professionalName: string;
  serviceName: string;
  startAt: Date;
  businessName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const baseTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f8; color: #1a1a2e; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f97316, #fb923c); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 4px; }
    .body { padding: 32px; }
    .card { background: #f8f8fc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e8e8f0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8e8f0; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-row .label { color: #6b7280; }
    .card-row .value { color: #1a1a2e; font-weight: 600; }
    .footer { padding: 24px 32px; background: #f8f8fc; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e8e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">${content}</div>
</body>
</html>
`;

// ─── Email Templates ──────────────────────────────────────────────────────────

const confirmationTemplate = (data: AppointmentEmailData): string =>
  baseTemplate(`
    <div class="header">
      <h1>✅ Cita Confirmada</h1>
      <p>${data.businessName}</p>
    </div>
    <div class="body">
      <p>Hola <strong>${data.clientName}</strong>, tu cita ha sido registrada exitosamente.</p>
      <div class="card">
        <div class="card-row"><span class="label">Servicio</span><span class="value">${data.serviceName}</span></div>
        <div class="card-row"><span class="label">Profesional</span><span class="value">${data.professionalName}</span></div>
        <div class="card-row"><span class="label">Fecha y hora</span><span class="value">${formatDate(data.startAt)}</span></div>
      </div>
      <p style="font-size:14px;color:#6b7280;margin-top:16px;">Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} ${data.businessName} — Powered by eTambó</div>
  `);

const reminderTemplate = (
  data: AppointmentEmailData,
  timeLabel: string
): string =>
  baseTemplate(`
    <div class="header">
      <h1>⏰ Recordatorio de Cita</h1>
      <p>${data.businessName}</p>
    </div>
    <div class="body">
      <p>Hola <strong>${data.clientName}</strong>, te recordamos que tienes una cita <strong>${timeLabel}</strong>.</p>
      <div class="card">
        <div class="card-row"><span class="label">Servicio</span><span class="value">${data.serviceName}</span></div>
        <div class="card-row"><span class="label">Profesional</span><span class="value">${data.professionalName}</span></div>
        <div class="card-row"><span class="label">Fecha y hora</span><span class="value">${formatDate(data.startAt)}</span></div>
      </div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} ${data.businessName} — Powered by eTambó</div>
  `);

// ─── Send Functions ───────────────────────────────────────────────────────────

export const sendConfirmationEmail = async (
  data: AppointmentEmailData
): Promise<void> => {
  if (config.nodeEnv === 'development' && !config.email.user) {
    logger.info('[Email DEV] Confirmation email would be sent', {
      to: data.clientEmail,
      subject: `Confirmación de cita — ${data.serviceName}`,
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: data.clientEmail,
      subject: `✅ Cita confirmada — ${data.serviceName}`,
      html: confirmationTemplate(data),
    });
    logger.info('Confirmation email sent', { to: data.clientEmail });
  } catch (error) {
    logger.error('Failed to send confirmation email', { error, to: data.clientEmail });
    throw error;
  }
};

export const sendReminderEmail = async (
  data: AppointmentEmailData,
  type: '24h' | '2h'
): Promise<void> => {
  const timeLabel = type === '24h' ? 'en las próximas 24 horas' : 'en 2 horas';

  if (config.nodeEnv === 'development' && !config.email.user) {
    logger.info(`[Email DEV] Reminder ${type} email would be sent`, {
      to: data.clientEmail,
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: data.clientEmail,
      subject: `⏰ Recordatorio de cita — ${data.serviceName}`,
      html: reminderTemplate(data, timeLabel),
    });
    logger.info(`Reminder ${type} email sent`, { to: data.clientEmail });
  } catch (error) {
    logger.error(`Failed to send reminder ${type} email`, { error, to: data.clientEmail });
    throw error;
  }
};
