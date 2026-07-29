<script setup lang="ts">
import type {
  ThemePresetDefinition,
  ThemePresetType,
} from '@/core/preferences';

import { computed } from 'vue';

import { THEME_PRESETS, usePreferences } from '@/core/preferences';
import { $t } from '@/locales';
import { TinyColor } from '@/utils';
import { ColorPicker } from 'antdv-next';

defineOptions({
  name: 'PreferenceThemePreset',
});

const modelValue = defineModel<ThemePresetType>({ default: 'default' });
const customColor = defineModel<string>('customColor', {
  default: '#1476ff',
});
const { isDark } = usePreferences();

/** 规范化后的自定义主色。 */
const customColorValue = computed(() => {
  return new TinyColor(customColor.value || '').toHexString();
});

/**
 * 获取预设在当前亮暗模式下的预览色。
 * @param option 主题预设选项。
 */
function getPreviewColor(option: ThemePresetDefinition): string {
  return isDark.value ? option.darkColor : option.lightColor;
}

/**
 * 选择主题预设。
 * @param preset 主题预设标识。
 */
function selectPreset(preset: ThemePresetType) {
  modelValue.value = preset;
}

/**
 * 保存自定义主色并切换到自定义预设。
 * @param _value antdv-next 颜色对象。
 * @param css 当前颜色的 CSS 字符串。
 */
function handleCustomColorChange(_value: unknown, css: string) {
  customColor.value = new TinyColor(css).toHexString();
  modelValue.value = 'custom';
}
</script>

<template>
  <div class="px-2 pt-1">
    <div
      :aria-label="$t('preferences.theme.preset.title')"
      class="grid grid-cols-4 gap-x-2 gap-y-3"
      role="radiogroup"
    >
      <button
        v-for="option in THEME_PRESETS"
        :key="option.value"
        :aria-checked="modelValue === option.value"
        :aria-label="$t(option.labelKey)"
        :data-theme-preset="option.value"
        :title="$t(option.labelKey)"
        class="group flex min-w-0 flex-col items-center gap-1.5"
        role="radio"
        type="button"
        @click="selectPreset(option.value)"
      >
        <span
          :class="
            modelValue === option.value
              ? 'border-foreground ring-foreground ring-offset-background ring-2 ring-offset-2'
              : 'border-border group-hover:border-foreground/50'
          "
          class="bg-background flex size-9 items-center justify-center rounded-md border p-1 transition-colors"
        >
          <span
            v-if="option.value === 'default'"
            class="flex size-full overflow-hidden rounded-sm"
          >
            <span class="h-full w-1/2 bg-[#171717]"></span>
            <span class="h-full w-1/2 bg-[#e5e5e5]"></span>
          </span>
          <span
            v-else
            :style="{ backgroundColor: getPreviewColor(option) }"
            class="size-full rounded-sm"
          ></span>
        </span>
        <span
          :class="
            modelValue === option.value
              ? 'text-foreground font-medium'
              : 'text-muted-foreground'
          "
          class="flex min-h-7 items-start justify-center text-center text-xs leading-tight"
        >
          {{ $t(option.labelKey) }}
        </span>
      </button>
      <ColorPicker
        :value="customColorValue"
        disabled-alpha
        disabled-format
        placement="bottomRight"
        @change="handleCustomColorChange"
      >
        <button
          :aria-checked="modelValue === 'custom'"
          :aria-label="$t('preferences.theme.preset.custom')"
          :title="$t('preferences.theme.preset.custom')"
          class="group flex min-w-0 flex-col items-center gap-1.5"
          data-testid="theme-color-primary"
          data-theme-preset="custom"
          role="radio"
          type="button"
          @click="selectPreset('custom')"
        >
          <span
            :class="
              modelValue === 'custom'
                ? 'border-foreground ring-foreground ring-offset-background ring-2 ring-offset-2'
                : 'border-border group-hover:border-foreground/50'
            "
            class="bg-background flex size-9 items-center justify-center rounded-md border p-1 transition-colors"
          >
            <span
              :style="{ backgroundColor: customColorValue }"
              class="size-full rounded-sm"
            ></span>
          </span>
          <span
            :class="
              modelValue === 'custom'
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            "
            class="flex min-h-7 items-start justify-center text-center text-xs leading-tight"
          >
            {{ $t('preferences.theme.preset.custom') }}
          </span>
        </button>
      </ColorPicker>
    </div>
  </div>
</template>
