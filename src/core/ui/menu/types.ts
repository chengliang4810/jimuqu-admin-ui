import type { ThemeModeType } from '@/types';

interface MenuProps {
  /**
   * @zh_CN 是否开启手风琴模式
   * @default true
   */
  accordion?: boolean;
  /**
   * @zh_CN 菜单是否折叠
   * @default false
   */
  collapse?: boolean;

  /**
   * @zh_CN 默认激活的菜单
   */
  defaultActive?: string;

  /**
   * @zh_CN 默认展开的菜单
   */
  defaultOpeneds?: string[];

  /**
   * @zh_CN 菜单模式
   * @default vertical
   */
  mode?: 'horizontal' | 'vertical';

  /**
   * @zh_CN 是否圆润风格
   * @default true
   */
  rounded?: boolean;

  /**
   * @zh_CN 是否自动滚动到激活的菜单项
   * @default false
   */
  scrollToActive?: boolean;

  /**
   * @zh_CN 菜单主题
   * @default dark
   */
  theme?: ThemeModeType;
}

export type { MenuProps };
