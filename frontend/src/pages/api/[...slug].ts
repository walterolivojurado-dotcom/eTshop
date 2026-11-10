import type { NextApiRequest, NextApiResponse } from 'next';
import app from '../../server/app';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    return app(req as any, res as any);
  } catch (err: any) {
    console.error('[API Route Error]', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal Server Error',
    });
  }
}
