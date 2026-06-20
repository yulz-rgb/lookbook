import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const routeSource = readFileSync(
  join(process.cwd(), 'app', 'api', 'tryon', 'route.js'),
  'utf8',
);

describe('/api/tryon security contract', () => {
  it('does not accept arbitrary imageUrl payloads from the browser', () => {
    expect(routeSource).not.toContain('body?.imageUrl');
    expect(routeSource).not.toContain('body?.garments');
    expect(routeSource).toContain('productIds');
    expect(routeSource).toContain('colours');
  });

  it('returns blob URL workflow fields instead of inline base64 image payloads', () => {
    expect(routeSource).toContain('imageUrl');
    expect(routeSource).toContain('renderId');
    expect(routeSource).not.toContain('data:image');
  });
});
