import webpush from 'web-push';
import config from './../config';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY as string;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY as string;
const contactEmail = process.env.CONTACT_EMAIL || 'mailto:soporte@etambook.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    contactEmail,
    publicVapidKey,
    privateVapidKey
  );
  console.log('[System] Web Push VAPID Details Configured successfully.');
} else {
  console.warn('[System] Web Push VAPID keys are missing from environment variables.');
}

export default webpush;
