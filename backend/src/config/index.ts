import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      'calenbaq_access_default_CHANGE_IN_PRODUCTION',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'calenbaq_refresh_default_CHANGE_IN_PRODUCTION',
    accessExpiresIn: '12h',
    refreshExpiresIn: '7d',
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'CalenBaq <noreply@calenbaq.com>',
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0),
  },
} as const;

export default config;
