import { siteConfig } from '../lib/site';

export default function sitemap() {
  const base = siteConfig.url;
  const routes = ['', '/demo', '/sign-in', '/privacy', '/terms'];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.6,
  }));
}
