import type { Component } from 'vue';

export interface VbenPluginsModalOptions {
  useVbenModal?: () => any;
}

export interface VbenPluginsMessageOptions {
  useMessage?: () => any;
}

export interface VbenPluginsComponentsOptions {
  [key: string]: Component;
}

export interface VbenPluginsOptions {
  modal?: VbenPluginsModalOptions;
  message?: VbenPluginsMessageOptions;
  components?: VbenPluginsComponentsOptions;
}
