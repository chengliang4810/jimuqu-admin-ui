<script lang="ts" setup>
import type { FormInstance } from 'antdv-next';
import type { Rule } from 'antdv-next/dist/form/types';

import { computed, onUnmounted, reactive, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { sendSmsCode } from '@/api/core/captcha';
import { $t } from '@/locales';
import { useAuthStore } from '@/stores';
import { Alert, Button, Form, FormItem, Input, SpaceCompact } from 'antdv-next';

defineOptions({ name: 'CodeLogin' });

const CODE_LENGTH = 4;
const COUNTDOWN = 60;

const authStore = useAuthStore();
const router = useRouter();

const formRef = useTemplateRef<FormInstance>('formRef');

const formState = reactive({
  phoneNumber: '',
  code: '',
});

const rules: Record<keyof typeof formState, Rule[]> = {
  phoneNumber: [
    {
      required: true,
      message: $t('authentication.mobileTip'),
      trigger: 'blur',
    },
    {
      pattern: /^\d{11}$/,
      message: $t('authentication.mobileErrortip'),
      trigger: 'blur',
    },
  ],
  code: [
    {
      required: true,
      len: CODE_LENGTH,
      message: $t('authentication.codeTip', [CODE_LENGTH]),
      trigger: 'blur',
    },
  ],
};

// 发送验证码倒计时
const countdown = ref(0);
const sendLoading = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

const sendButtonText = computed(() =>
  countdown.value > 0
    ? $t('authentication.sendText', [countdown.value])
    : $t('authentication.sendCode'),
);

function startCountdown() {
  countdown.value = COUNTDOWN;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  }, 1000);
}

async function handleSendCode() {
  // 仅校验手机号
  try {
    await formRef.value?.validateFields(['phoneNumber']);
  } catch {
    return;
  }
  sendLoading.value = true;
  try {
    await sendSmsCode(formState.phoneNumber);
    window.message.success('验证码发送成功');
    startCountdown();
  } catch (error) {
    console.error(error);
  } finally {
    sendLoading.value = false;
  }
}

// 校验通过后(原生 Form 的 finish 仅在校验成功时触发)
async function handleLogin() {
  try {
    await authStore.authLogin({
      phoneNumber: formState.phoneNumber,
      smsCode: formState.code,
      grantType: 'sms',
    } as any);
  } catch (error) {
    console.error(error);
  }
}

function goToLogin() {
  router.push('/auth/login');
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <div>
    <Alert
      class="mb-4"
      show-icon
      message="测试手机号: 15888888888 正确验证码: 1234 演示使用 不会真的发送"
      type="info"
    />

    <!-- 标题 -->
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="text-foreground mb-3 text-3xl/9 font-bold tracking-tight lg:text-4xl"
      >
        {{ $t('authentication.welcomeBack') }} 📲
      </h2>
      <p class="lg:text-md text-muted-foreground text-sm">
        {{ $t('authentication.codeSubtitle') }}
      </p>
    </div>

    <Form
      ref="formRef"
      :model="formState"
      :rules="rules"
      class="mb-2"
      layout="vertical"
      @finish="handleLogin"
    >
      <FormItem name="phoneNumber">
        <Input
          v-model:value="formState.phoneNumber"
          :placeholder="$t('authentication.mobile')"
          size="large"
        />
      </FormItem>

      <FormItem name="code">
        <SpaceCompact class="w-full">
          <Input
            v-model:value="formState.code"
            :placeholder="$t('authentication.code')"
            size="large"
          />
          <Button
            :disabled="countdown > 0"
            :loading="sendLoading"
            size="large"
            @click="handleSendCode"
          >
            {{ sendButtonText }}
          </Button>
        </SpaceCompact>
      </FormItem>

      <Button
        :class="{ 'cursor-wait': authStore.loginLoading }"
        :loading="authStore.loginLoading"
        class="w-full"
        html-type="submit"
        size="large"
        type="primary"
      >
        {{ $t('common.login') }}
      </Button>

      <Button class="mt-4 w-full" size="large" @click="goToLogin">
        {{ $t('common.back') }}
      </Button>
    </Form>
  </div>
</template>
