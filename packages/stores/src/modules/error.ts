import { acceptHMRUpdate, defineStore } from 'pinia';

interface ErrorState {
  /**
   * 500错误时的原始请求路径，用于重试
   */
  failedRequestPath: string;
  /**
   * 500错误处理开始时间戳，用于判断是否重置防抖状态
   * 不持久化，每次页面刷新重置
   */
  handleErrorStartTime: number;
  /**
   * 是否正在处理500错误（防抖标志位）
   * 不持久化，每次页面刷新重置
   */
  isHandling500Error: boolean;
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
    /**
     * 检查并设置500错误处理状态
     * @returns 是否应该处理此500错误（false表示已被其他请求处理）
     */
    tryHandle500Error(): boolean {
      const now = Date.now();
      // 如果距离上次错误处理超过5秒，重置状态
      if (this.isHandling500Error && now - this.handleErrorStartTime > 5000) {
        this.isHandling500Error = false;
      }

      // 如果已经在处理500错误，返回false
      if (this.isHandling500Error) {
        return false;
      }

      // 设置处理状态
      this.isHandling500Error = true;
      this.handleErrorStartTime = now;
      return true;
    },
    /**
     * 重置500错误处理状态（用于从500页面返回后重置）
     */
    reset500ErrorState() {
      this.isHandling500Error = false;
      this.handleErrorStartTime = 0;
    },
  },
  persist: {
    // 持久化失败路径，刷新页面后可重试
    // 不持久化 isHandling500Error 和 handleErrorStartTime，每次刷新重置
    pick: ['failedRequestPath'],
  },
  state: (): ErrorState => ({
    failedRequestPath: '/',
    isHandling500Error: false,
    handleErrorStartTime: 0,
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useErrorStore, hot));
}
