import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('deployment nginx config', () => {
  const config = readFileSync(
    resolve(process.cwd(), 'scripts/deploy/nginx.conf'),
    'utf8',
  );

  it('proxies uploaded files to the backend without stripping the file prefix', () => {
    const fileLocation = config.slice(config.indexOf('location ^~ /file/'));
    const block = fileLocation.slice(
      0,
      fileLocation.indexOf('\n        }') + 10,
    );

    expect(block).toContain('proxy_set_header Host $http_host;');
    expect(block).toContain('proxy_set_header X-Real-IP $remote_addr;');
    expect(block).toContain(
      'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    );
    expect(block).toContain('proxy_pass http://server;');
    expect(block).not.toContain('proxy_pass http://server/;');
  });

  it('does not expose excluded module locations', () => {
    for (const module of [
      'ai',
      'demo',
      'gen',
      'job',
      'monitor-admin',
      'snailai',
      'snailjob',
      'workflow',
    ]) {
      expect(config).not.toMatch(
        new RegExp(`location\\s+(?:[=^~*]+\\s*)?/${module}(?:/|\\s)`),
      );
    }
  });
});
