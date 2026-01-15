import { acceptHMRUpdate, defineStore } from 'pinia';

interface ErrorState {
  /**
   * 500错误时的原始请求路径，用于重试
   */
  failedRequestPath: string;
}

/**
 * @zh_CN 错误处理相关
 */
export const useErrorStore = defineStore('core-error', {
  actions: {
    /**
     * 清除失败的请求路径
     */
    clearFailedRequestPath() {
      this.failedRequestPath = '/';
    },
    /**
     * 设置失败的请求路径
     */
    setFailedRequestPath(path: string) {
      this.failedRequestPath = path;
    },
  },
  persist: {
    // 持久化失败路径，刷新页面后可重试
    pick: ['failedRequestPath'],
  },
  state: (): ErrorState => ({
    failedRequestPath: '/',
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useErrorStore, hot));
}
