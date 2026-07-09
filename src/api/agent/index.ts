import type { SnailOpenApiUser } from './model';

import { alovaInstance } from '@/utils/http';

export function registerSnailUser() {
  return alovaInstance.post<SnailOpenApiUser>('/snail-ai/user/register');
}
