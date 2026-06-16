import type { Component } from 'vue';

interface WorkbenchProjectItem {
  color?: string;
  content: string;
  date: string;
  group: string;
  icon: Component | string;
  title: string;
  url?: string;
}

interface WorkbenchTrendItem {
  avatar: string;
  content: string;
  date: string;
  title: string;
}

interface WorkbenchTodoItem {
  completed: boolean;
  content: string;
  date: string;
  title: string;
}

interface WorkbenchQuickNavItem {
  color?: string;
  icon: Component | string;
  title: string;
  url?: string;
}

export type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
};
