import type { AxiosInstance, AxiosResponse } from 'axios';

import type {
  RequestInterceptorConfig,
  ResponseInterceptorConfig,
} from '../types';

const defaultRequestInterceptorConfig: RequestInterceptorConfig = {
  fulfilled: (response) => response,
  rejected: (error) => Promise.reject(error),
};

const defaultResponseInterceptorConfig: ResponseInterceptorConfig = {
  fulfilled: (response: AxiosResponse) => response,
  rejected: (error) => Promise.reject(error),
};

interface QueuedInterceptor<T> {
  config: T;
  priority: number;
}

class InterceptorManager {
  private axiosInstance: AxiosInstance;
  private requestFlushed = false;
  private requestQueue: QueuedInterceptor<RequestInterceptorConfig>[] = [];
  private responseFlushed = false;
  private responseQueue: QueuedInterceptor<ResponseInterceptorConfig>[] = [];

  constructor(instance: AxiosInstance) {
    this.axiosInstance = instance;
  }

  addRequestInterceptor({
    fulfilled,
    rejected,
    priority = 0,
  }: RequestInterceptorConfig = defaultRequestInterceptorConfig) {
    this.requestQueue.push({ config: { fulfilled, rejected }, priority });
  }

  addResponseInterceptor<T = any>({
    fulfilled,
    rejected,
    priority = 0,
  }: ResponseInterceptorConfig<T> = defaultResponseInterceptorConfig) {
    this.responseQueue.push({ config: { fulfilled, rejected }, priority });
  }

  /**
   * 刷新拦截器队列，将所有已添加的拦截器按优先级注册到 axios
   * 应在所有拦截器添加完成后调用一次
   */
  flush() {
    this.flushRequestInterceptors();
    this.flushResponseInterceptors();
  }

  private flushRequestInterceptors() {
    if (this.requestFlushed) return;
    this.requestFlushed = true;

    // 按优先级排序后依次注册
    const sorted = this.requestQueue.toSorted(
      (a, b) => a.priority - b.priority,
    );
    for (const item of sorted) {
      const { fulfilled, rejected } = item.config;
      this.axiosInstance.interceptors.request.use(fulfilled, rejected);
    }
    this.requestQueue = [];
  }

  private flushResponseInterceptors() {
    if (this.responseFlushed) return;
    this.responseFlushed = true;

    // 按优先级排序后依次注册
    const sorted = this.responseQueue.toSorted(
      (a, b) => a.priority - b.priority,
    );
    for (const item of sorted) {
      const { fulfilled, rejected } = item.config;
      this.axiosInstance.interceptors.response.use(fulfilled, rejected);
    }
    this.responseQueue = [];
  }
}

export { InterceptorManager };
