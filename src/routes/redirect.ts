import { Router, Request, Response } from 'express';
import { getLinkByShortId, incrementClicks } from '../services/linkService';
import { recordClick } from '../services/analyticsService';

const router = Router();

/**
 * GET /:shortId
 * Redirect the user to the original URL and record the click.
 */
router.get('/:shortId', async (req: Request, res: Response) => {
  try {
    const { shortId } = req.params;
    const link = await getLinkByShortId(shortId);

    if (!link) {
      res.status(404).json({ success: false, error: 'Short link not found' });
      return;
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      res.status(410).json({ success: false, error: 'This link has expired' });
      return;
    }

    // Fire-and-forget analytics tracking so the redirect is not delayed
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const ua = req.headers['user-agent'] || '';
    const referrer = (req.headers['referer'] as string) || '';

    Promise.all([
      incrementClicks(shortId),
      recordClick(shortId, ip, ua, referrer),
    ]).catch((err) => console.error('[analytics] failed to record click:', err.message));

    res.redirect(302, link.originalUrl);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
