<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { computed, nextTick, ref } from 'vue';

import { useScrollLock } from '@/core/composables';
import { VbenAvatar, VbenButton } from '@/core/ui/adapter';
import { LockKeyhole } from '@/icons-app';
import { $t, useI18n } from '@/locales';
import { storeToRefs, useAccessStore } from '@/stores';
import { Form, FormItem, InputPassword } from 'antdv-next';
import { useDateFormat, useNow } from '@vueuse/core';

interface Props {
  avatar?: string;
}

defineOptions({
  name: 'LockScreen',
});

withDefaults(defineProps<Props>(), {
  avatar: '',
});

defineEmits<{ toLogin: [] }>();

const { locale } = useI18n();
const accessStore = useAccessStore();

const now = useNow();
const meridiem = useDateFormat(now, 'A');
const hour = useDateFormat(now, 'HH');
const minute = useDateFormat(now, 'mm');
const date = useDateFormat(now, 'YYYY-MM-DD dddd', { locales: locale.value });

const showUnlockForm = ref(false);
const { lockScreenPassword } = storeToRefs(accessStore);

const formData = ref({
  password: '',
});
const formInstance = ref<FormInstance>();
const passwordInput = ref();

const formRules = computed(() => ({
  password: [
    {
      message: $t('authentication.passwordTip'),
      required: true,
    },
  ],
}));

const validPass = computed(
  () => lockScreenPassword?.value === formData.value.password,
);

async function handleSubmit() {
  await formInstance.value?.validate();
  if (validPass.value) {
    accessStore.unlockScreen();
  } else {
    formInstance.value?.setFields([
      {
        errors: [$t('authentication.passwordErrorTip')],
        name: 'password',
      },
    ]);
  }
}

function toggleUnlockForm() {
  showUnlockForm.value = !showUnlockForm.value;
  if (showUnlockForm.value) {
    nextTick(() => {
      passwordInput.value?.focus?.();
    });
  }
}

useScrollLock();
</script>

<template>
  <div class="bg-background fixed z-2000 size-full">
    <transition name="slide-left">
      <div v-show="!showUnlockForm" class="size-full">
        <div
          class="group flex-col-center text-foreground/80 hover:text-foreground fixed top-6 left-1/2 z-2001 -translate-x-1/2 cursor-pointer text-xl font-semibold"
          @click="toggleUnlockForm"
        >
          <LockKeyhole
            class="size-5 transition-all duration-300 group-hover:scale-125"
          />
          <span>{{ $t('ui.widgets.lockScreen.unlock') }}</span>
        </div>
        <div class="flex-center size-full">
          <div class="flex w-full justify-center gap-4 px-4 sm:gap-6 md:gap-8">
            <div
              class="flex-center bg-accent relative h-35 w-35 rounded-xl text-[36px] sm:h-40 sm:w-40 sm:text-[42px] md:h-50 md:w-50 md:text-[72px]"
            >
              <span
                class="absolute top-3 left-3 text-xs font-semibold sm:text-sm md:text-xl"
              >
                {{ meridiem }}
              </span>
              {{ hour }}
            </div>
            <div
              class="flex-center bg-accent h-35 w-35 rounded-xl text-[36px] sm:h-40 sm:w-40 sm:text-[42px] md:h-50 md:w-50 md:text-[72px]"
            >
              {{ minute }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="slide-right">
      <div
        v-if="showUnlockForm"
        class="flex-center size-full"
        @keydown.enter.prevent="handleSubmit"
      >
        <div class="flex-col-center mb-10 w-[90%] max-w-75 px-4">
          <VbenAvatar :src="avatar" class="enter-x mb-6 size-20" />
          <div class="enter-x mb-2 w-full items-center">
            <Form ref="formInstance" :model="formData">
              <FormItem name="password" :rules="formRules.password">
                <InputPassword
                  ref="passwordInput"
                  name="password"
                  :placeholder="$t('ui.widgets.lockScreen.placeholder')"
                  v-model:value="formData.password"
                />
              </FormItem>
            </Form>
          </div>
          <VbenButton class="enter-x w-full" @click="handleSubmit">
            {{ $t('ui.widgets.lockScreen.entry') }}
          </VbenButton>
          <VbenButton
            class="enter-x my-2 w-full"
            variant="ghost"
            @click="$emit('toLogin')"
          >
            {{ $t('ui.widgets.lockScreen.backToLogin') }}
          </VbenButton>
          <VbenButton
            class="enter-x mr-2 w-full"
            variant="ghost"
            @click="toggleUnlockForm"
          >
            {{ $t('common.back') }}
          </VbenButton>
        </div>
      </div>
    </transition>

    <div
      class="enter-y absolute bottom-5 w-full text-center text-xl md:text-2xl xl:text-xl 2xl:text-3xl"
    >
      <div v-if="showUnlockForm" class="enter-x mb-2 text-2xl md:text-3xl">
        {{ hour }}:{{ minute }}
        <span class="text-base md:text-lg">{{ meridiem }}</span>
      </div>
      <div class="text-xl md:text-3xl">{{ date }}</div>
    </div>
  </div>
</template>
