import { Router, Request, Response } from 'express';
import { getAnalytics } from '../services/analyticsService';

const router = Router();

/**
 * GET /api/analytics/:shortId
 * Return detailed analytics: clicks over time, referrers, devices, geo.
 */
router.get('/:shortId', async (req: Request, res: Response) => {
  try {
    const analytics = await getAnalytics(req.params.shortId);
    if (!analytics) {
      res.status(404).json({ success: false, error: 'Link not found' });
      return;
    }
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
