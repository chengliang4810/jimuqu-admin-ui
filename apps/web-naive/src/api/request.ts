/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type {
  DownloadRequestConfig,
  RequestClientOptions,
  RequestResponse,
} from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore, useErrorStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import { message } from '#/adapter/naive';
import { router } from '#/router';
import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// 500错误已处理的特殊标记
const HANDLED_500_RESPONSE = Object.freeze({
  __isHandled500Error: true,
  config: { responseReturn: 'raw' },
  data: null,
  status: 500,
} as RequestResponse<null>);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 200,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 500错误处理，priority: -10 确保在 errorMessageResponseInterceptor 之前执行
  client.addResponseInterceptor({
    priority: -10,
    rejected: (error: any) => {
      const status = error?.response?.status;

      if (status === 500) {
        // 避免在500页面时重复跳转导致死循环
        const currentPath = router.currentRoute.value.path;
        if (currentPath !== '/500') {
          const errorStore = useErrorStore();

          // 防抖：检查是否应该处理此500错误
          // 只有第一个500错误会触发跳转，其他的500错误会被静默处理
          if (!errorStore.tryHandle500Error()) {
            // 已有其他请求在处理500错误，返回特殊响应对象
            return Promise.resolve(HANDLED_500_RESPONSE);
          }

          // 记录原始页面路径，用于重试时跳转
          const fullPath = router.currentRoute.value.fullPath;
          errorStore.setFailedRequestPath(fullPath);

          // 跳转到500错误页面
          router.push({
            path: '/500',
            query: { redirect: fullPath },
          });
        }

        // 返回特殊响应对象，避免组件中的 Promise rejection 警告
        // 同时让后续拦截器能正常处理
        return Promise.resolve(HANDLED_500_RESPONSE);
      }

      // 非500错误，继续传递给下一个拦截器
      return Promise.reject(error);
    },
  });

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor({
    fulfilled: (response: any) => {
      // 检查是否是已处理的500错误响应
      if (response && response.__isHandled500Error) {
        return null; // 返回null给调用者
      }
      return response;
    },
    rejected: (error: any) => {
      // 跳过500错误，已在上面专门处理
      if (error?.response?.status === 500) {
        return Promise.reject(error);
      }

      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.msg ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || error.message || '请求失败');
      return Promise.reject(error);
    },
  });

  // 刷新拦截器队列，按优先级注册到 axios
  client.flushInterceptors();

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
  paramsSerializer: 'comma',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });

export const downloadFile = async (
  url: string,
  fileName?: string,
  config?: DownloadRequestConfig,
) => {
  const response = await requestClient.download<RequestResponse<Blob>>(url, {
    responseReturn: 'raw',
    ...config,
  });
  await downloadFileFromBlob({
    source: response.data,
    fileName:
      fileName ||
      decodeURIComponent(
        response.headers['content-disposition'].split('filename=')[1],
      ).replaceAll('"', ''),
  });
};
