import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    // 不需要刷新token的功能
    enableRefreshToken: false,
    // 后端权限
    accessMode: 'backend',
    // 水印
    watermark: false,
  },
  breadcrumb: {
    // 显示首页
    showHome: true,
  },
  // 版权信息
  copyright: {
    companyName: 'jimuqu.com',
    companySiteLink: 'https://doc.jimuqu.com',
    date: '2025',
  },
  // 主题配置
  theme: {
    builtinType: 'violet',
    colorPrimary: 'hsl(245 82% 67%)',
    mode: 'auto',
    radius: '0.75',
  },
});
