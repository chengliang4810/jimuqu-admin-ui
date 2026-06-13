<script setup lang="ts">
import type { BuiltinThemePreset } from '@/core/preferences';
import type { BuiltinThemeType } from '@/types';

import { computed, watch } from 'vue';

import { $t } from '@/locales';
import { BUILT_IN_THEME_PRESETS } from '@/core/preferences';
import { convertToHsl, TinyColor } from '@/utils';

import { useThrottleFn } from '@vueuse/core';
import { ColorPicker } from 'antdv-next';

defineOptions({
  name: 'PreferenceBuiltinTheme',
});

const props = defineProps<{ isDark: boolean }>();

const modelValue = defineModel<BuiltinThemeType>({ default: 'default' });
const themeColorPrimary = defineModel<string>('themeColorPrimary');

const updateThemeColorPrimary = useThrottleFn(
  (value: string) => {
    themeColorPrimary.value = value;
  },
  300,
  true,
  true,
);

const customColorValue = computed(() => {
  return new TinyColor(themeColorPrimary.value || '').toHexString();
});

const builtinThemePresets = computed(() => {
  return [...BUILT_IN_THEME_PRESETS];
});

function typeView(name: BuiltinThemeType) {
  switch (name) {
    case 'custom': {
      return $t('preferences.theme.builtin.custom');
    }
    case 'deep-blue': {
      return $t('preferences.theme.builtin.deepBlue');
    }
    case 'deep-green': {
      return $t('preferences.theme.builtin.deepGreen');
    }
    case 'default': {
      return $t('preferences.theme.builtin.default');
    }
    case 'gray': {
      return $t('preferences.theme.builtin.gray');
    }
    case 'green': {
      return $t('preferences.theme.builtin.green');
    }
    case 'neutral': {
      return $t('preferences.theme.builtin.neutral');
    }
    case 'orange': {
      return $t('preferences.theme.builtin.orange');
    }
    case 'pink': {
      return $t('preferences.theme.builtin.pink');
    }
    case 'rose': {
      return $t('preferences.theme.builtin.rose');
    }
    case 'sky-blue': {
      return $t('preferences.theme.builtin.skyBlue');
    }
    case 'slate': {
      return $t('preferences.theme.builtin.slate');
    }
    case 'violet': {
      return $t('preferences.theme.builtin.violet');
    }
    case 'yellow': {
      return $t('preferences.theme.builtin.yellow');
    }
    case 'zinc': {
      return $t('preferences.theme.builtin.zinc');
    }
  }
}

function handleSelect(theme: BuiltinThemePreset) {
  modelValue.value = theme.type;
}

function handleCustomColorChange(_value: unknown, css: string) {
  modelValue.value = 'custom';
  updateThemeColorPrimary(convertToHsl(css));
}

watch(
  () => [modelValue.value, props.isDark] as [BuiltinThemeType, boolean],
  ([themeType, isDark]) => {
    const theme = builtinThemePresets.value.find(
      (item) => item.type === themeType,
    );
    if (theme) {
      if (theme.type === 'custom') {
        return;
      }

      const primaryColor = isDark
        ? theme.darkPrimaryColor || theme.primaryColor
        : theme.primaryColor;

      themeColorPrimary.value = primaryColor || theme.color;
    }
  },
);
</script>

<template>
  <div class="flex w-full flex-wrap justify-between">
    <template v-for="theme in builtinThemePresets" :key="theme.type">
      <div class="flex cursor-pointer flex-col" @click="handleSelect(theme)">
        <div
          :class="{
            'outline-box-active': theme.type === modelValue,
          }"
          class="group outline-box flex-center cursor-pointer"
        >
          <template v-if="theme.type !== 'custom'">
            <div
              :style="{ backgroundColor: theme.color }"
              class="mx-9 my-2 size-5 rounded-md"
            ></div>
          </template>
          <template v-else>
            <div class="flex-center size-full px-9 py-2" @click.stop>
              <ColorPicker
                :value="customColorValue"
                disabled-alpha
                disabled-format
                size="small"
                @change="handleCustomColorChange"
              />
            </div>
          </template>
        </div>
        <div class="text-muted-foreground my-2 text-center text-xs">
          {{ typeView(theme.type) }}
        </div>
      </div>
    </template>
  </div>
</template>
