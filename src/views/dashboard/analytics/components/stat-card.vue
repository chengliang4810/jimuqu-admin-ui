<script setup lang="ts">
import { computed } from 'vue';

import { VbenCountToAnimator } from '@/core/ui/adapter';

interface Props {
  color?: 'destructive' | 'primary' | 'success' | 'warning';
  desc: string;
  icon: string;
  prefix?: string;
  suffix?: string;
  title: string;
  trend: number;
  value: number;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  prefix: '',
  suffix: '',
});

// 显式声明完整的类名，以便 Tailwind 能够扫描生成
const COLOR_MAP: Record<
  NonNullable<Props['color']>,
  { bg: string; dot: string }
> = {
  primary: {
    bg: 'bg-primary',
    dot: 'bg-primary',
  },
  success: {
    bg: 'bg-success',
    dot: 'bg-success',
  },
  warning: {
    bg: 'bg-warning',
    dot: 'bg-warning',
  },
  destructive: {
    bg: 'bg-destructive',
    dot: 'bg-destructive',
  },
};

const colorClasses = computed(() => COLOR_MAP[props.color]);
</script>

<template>
  <div
    class="card-box group relative overflow-hidden p-5 transition-all duration-300 hover:shadow-float"
  >
    <!-- 背景装饰 -->
    <div
      class="absolute -top-8 -right-8 size-28 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150"
      :class="colorClasses.dot"
    ></div>

    <div class="relative flex items-start justify-between">
      <div class="min-w-0 flex-1">
        <p class="text-muted-foreground mb-2 text-sm">{{ title }}</p>
        <div class="flex items-baseline gap-1">
          <VbenCountToAnimator
            class="text-2xl font-bold tabular-nums"
            :end-val="value"
            :prefix="prefix"
            :suffix="suffix"
            :duration="2000"
            transition="easeOutCubic"
          />
        </div>
        <div class="mt-3 flex items-center gap-2 text-xs">
          <span
            class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium"
            :class="
              trend >= 0
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            "
          >
            <span
              class="icon-[lucide--trending-up] size-3"
              :class="trend < 0 ? 'hidden' : ''"
            ></span>
            <span
              class="icon-[lucide--trending-down] size-3"
              :class="trend >= 0 ? 'hidden' : ''"
            ></span>
            {{ Math.abs(trend) }}%
          </span>
          <span class="text-muted-foreground">{{ desc }}</span>
        </div>
      </div>

      <div
        class="flex-center size-12 shrink-0 rounded-xl text-white shadow-sm"
        :class="colorClasses.bg"
      >
        <span :class="`${icon} size-6`"></span>
      </div>
    </div>
  </div>
</template>
