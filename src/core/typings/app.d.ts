type LayoutType =
  | 'full-content'
  | 'header-mixed-nav'
  | 'header-nav'
  | 'header-sidebar-nav'
  | 'mixed-nav'
  | 'sidebar-mixed-nav'
  | 'sidebar-nav';

type ThemeModeType = 'auto' | 'dark' | 'light';

/**
 * 按钮位置
 * user-dropdown 用户的下拉弹出框中
 * fixed 固定在右侧
 * header 顶栏
 * auto 自动
 */
type PreferencesButtonPositionType =
  | 'auto'
  | 'fixed'
  | 'header'
  | 'user-dropdown';

type BuiltinThemeType = 'default';

type ContentCompactType = 'compact' | 'wide';

type LayoutHeaderModeType = 'auto' | 'auto-scroll' | 'fixed' | 'static';
type LayoutHeaderMenuAlignType = 'center' | 'end' | 'start';

/**
 * 登录过期模式
 * modal 弹窗模式
 * page 页面模式
 */
type LoginExpiredModeType = 'modal' | 'page';

/**
 * 面包屑样式
 * background 背景
 * normal 默认
 */
type BreadcrumbStyleType = 'background' | 'normal';

/**
 * 标签栏风格
 * brisk 轻快
 * card 卡片
 * chrome 谷歌
 * plain 朴素
 */
type TabsStyleType = 'brisk' | 'card' | 'chrome' | 'plain';

/**
 * 页面切换动画
 */
type PageTransitionType = 'fade' | 'fade-down' | 'fade-slide' | 'fade-up';

/**
 * 页面切换动画
 * panel-center 居中布局
 * panel-left 居左布局
 * panel-right 居右布局
 */
type AuthPageLayoutType = 'panel-center' | 'panel-left' | 'panel-right';

export type {
  AuthPageLayoutType,
  BreadcrumbStyleType,
  BuiltinThemeType,
  ContentCompactType,
  LayoutHeaderMenuAlignType,
  LayoutHeaderModeType,
  LayoutType,
  LoginExpiredModeType,
  PageTransitionType,
  PreferencesButtonPositionType,
  TabsStyleType,
  ThemeModeType,
};
