import { Router } from 'express';
import Expert from '../models/Expert.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

const APP_URL = () => (process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');

router.get('/robots.txt', (req, res) => {
  const base = APP_URL() || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /dashboard',
      'Disallow: /expert-dashboard',
      'Disallow: /messages',
      'Disallow: /settings',
      'Disallow: /expert-settings',
      'Disallow: /admin',
      '',
      `Sitemap: ${base}/sitemap.xml`,
      '',
    ].join('\n')
  );
});

router.get(
  '/sitemap.xml',
  asyncHandler(async (req, res) => {
    const base = APP_URL() || `${req.protocol}://${req.get('host')}`;

    const experts = await Expert.find({ isSuspended: { $ne: true } })
      .select('_id updatedAt')
      .lean();

    const urls = [
      { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${base}/contact`, priority: '0.3', changefreq: 'monthly' },
      { loc: `${base}/login`, priority: '0.2', changefreq: 'monthly' },
      { loc: `${base}/signup`, priority: '0.4', changefreq: 'monthly' },
      { loc: `${base}/become-expert`, priority: '0.6', changefreq: 'weekly' },
      ...experts.map((e) => ({
        loc: `${base}/experts/${e._id}`,
        lastmod: new Date(e.updatedAt).toISOString().split('T')[0],
        priority: '0.8',
        changefreq: 'daily',
      })),
    ];

    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((u) =>
        [
          '<url>',
          `<loc>${u.loc}</loc>`,
          u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '',
          `<changefreq>${u.changefreq}</changefreq>`,
          `<priority>${u.priority}</priority>`,
          '</url>',
        ].filter(Boolean).join('')
      ),
      '</urlset>',
    ].join('\n');

    res.set('Content-Type', 'application/xml').send(body);
  })
);

export default router;
