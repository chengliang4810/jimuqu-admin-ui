import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getGenCodeList(_params: any) {
  return requestClient.get<null>('/tool/gen-code/list');
}
