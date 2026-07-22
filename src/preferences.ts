import { defineOverridesPreferences } from '@/core/preferences';
import jimuquLogo from '@/icons/svg/icons/jimuqu-logo.svg';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * 为了防止有人看不懂 这里用各国语言加了注释
 *
 * !!! 更改配置后请清空缓存 localStorage
 * !!! Please clear the localStorage cache after changing the configuration
 * !!! 更改配置後請清空緩存 localStorage
 * !!! 設定を変更した後は、localStorageキャッシュをクリアしてください
 * !!! 구성을 변경한 후에는 localStorage 캐시를 지우십시오
 * !!! Por favor, borre la caché de localStorage después de cambiar la configuración
 * !!! Veuillez effacer le cache localStorage après avoir modifié la configuration
 * !!! Bitte leeren Sie den localStorage-Cache nach Änderung der Konfiguration
 * !!! Si prega di cancellare la cache di localStorage dopo aver modificato la configurazione
 * !!! Пожалуйста, очистите кэш localStorage после изменения конфигурации
 * !!! Por favor, limpe o cache do localStorage após alterar a configuração
 * !!! Vui lòng xóa bộ nhớ cache localStorage sau khi thay đổi cấu hình
 * !!! โปรดล้างแคช localStorage หลังจากเปลี่ยนการกำหนดค่า
 * !!! Harap bersihkan cache localStorage setelah mengubah konfigurasi
 * !!! يرجى مسح ذاكرة التخزين المؤقت localStorage بعد تغيير التكوين
 * !!! Yapılandırmayı değiştirdikten sonra lütfen localStorage önbelleğini temizleyin
 * !!! Wis de localStorage-cache na het wijzigen van de configuratie
 * !!! Proszę wyczyścić pamięć podręczną localStorage po zmianie konfiguracji
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    /**
     * 这里可以设置默认头像 url链接或vite导入的图片链接
     */
    // defaultAvatar: '',
    /**
     * 在这里设置应用标题
     */
    name: import.meta.env.VITE_APP_TITLE,
    /**
     * 不支持modal模式 需要改动的地方太多
     * 1. 正常重新登录后不会再触发接口请求 即触发登录超时的页面为空数据
     * 2. 切换租户登录后不会重新加载菜单
     */
    // loginExpiredMode: 'modal',
  },
  tabbar: {
    /**
     * 标签tab 持久化 关闭
     */
    persist: false,
    // styleType: 'card',
  },
  theme: {
    /** 默认主题模式 */
    mode: 'light',
    /**
     * 浅色sidebar
     */
    semiDarkSidebar: false,
    /**
     * 圆角大小，直接使用 px(与 antd borderRadius 一致)
     */
    borderRadius: 6,
    // 这些颜色与 antd 默认色保持一致(hex)
    // 错误色
    colorError: '#ff4d4f',
    // 主题色
    colorPrimary: '#1476ff',
    // 成功色
    colorSuccess: '#53c71a',
    // 警告色
    colorWarning: '#faae14',
  },
  /**
   * !!! 更改配置后请清空浏览器缓存
   * 在这里更换logo
   * source可选值：
   * 1. 本地public目录下的图片 需要加上/ 比如：/logo.png
   * 2. 网络图片链接
   * 3. vite导入的图片 import xxx from 'xxx.png'
   *
   * !!! 更改配置后请清空浏览器缓存
   */
  logo: {
    enable: true,
    source: jimuquLogo,
  },
});
