import { Router, Request, Response } from 'express';
import { createLink, listLinks } from '../services/linkService';
import { getBasicStats } from '../services/analyticsService';
import { generateQRCode } from '../services/qrService';
import { CreateLinkRequest } from '../types';

const router = Router();

/**
 * POST /api/links
 * Create a new short link.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, customAlias, expiresIn } = req.body as CreateLinkRequest;

    if (!url) {
      res.status(400).json({ success: false, error: 'url is required' });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      res.status(400).json({ success: false, error: 'Invalid URL format' });
      return;
    }

    const link = await createLink({ url, customAlias, expiresIn });
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

    res.status(201).json({
      success: true,
      data: {
        ...link,
        shortUrl: `${baseUrl}/${link.shortId}`,
      },
    });
  } catch (err: any) {
    const status = err.message === 'Custom alias is already taken' ? 409 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/links
 * List all tracked short links.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const links = await listLinks();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

    const data = links.map((l) => ({
      ...l,
      shortUrl: `${baseUrl}/${l.shortId}`,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/links/:shortId/stats
 * Return basic click stats for a link.
 */
router.get('/:shortId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getBasicStats(req.params.shortId);
    if (!stats) {
      res.status(404).json({ success: false, error: 'Link not found' });
      return;
    }
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/links/:shortId/qr
 * Generate and return a QR code PNG image for the short URL.
 */
router.get('/:shortId/qr', async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const shortUrl = `${baseUrl}/${req.params.shortId}`;

    const buffer = await generateQRCode(shortUrl);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.shortId}.png"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
