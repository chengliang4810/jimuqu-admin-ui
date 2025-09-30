import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getGenCodeList(params: any) {
  return requestClient.get<null>('/tool/gen-code/list', { params });
}

/**
 * 代码模板列表
 */
export async function getGenTemplateList(params: any) {
  return requestClient.get<null>('/tool/gen-template/list', { params });
}
