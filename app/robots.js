import { siteConfig } from '../lib/site';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/workspace', '/api/'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
