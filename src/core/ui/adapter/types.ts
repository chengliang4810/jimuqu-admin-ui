import type { Component } from 'vue';

export interface IContextMenuItem {
  disabled?: boolean;
  handler?: (data: any) => void;
  hidden?: boolean;
  icon?: Component;
  inset?: boolean;
  key: string;
  separator?: boolean;
  shortcut?: string;
  text: string;
}

export interface VbenDropdownMenuItem {
  disabled?: boolean;
  handler?: (data: any) => void;
  icon?: Component;
  label: string;
  separator?: boolean;
  value: string;
}

export interface DropdownMenuProps {
  menus: VbenDropdownMenuItem[];
}

export interface SegmentedItem {
  label: string;
  value: string;
}

export interface IBreadcrumb {
  icon?: Component | string;
  items?: IBreadcrumb[];
  path?: string;
  title?: string;
}

export interface BreadcrumbProps {
  breadcrumbs: IBreadcrumb[];
  showIcon?: boolean;
}
