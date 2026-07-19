<script lang="ts" setup>
import type { CaptchaResponse } from '@/api/core/captcha';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { captchaImage } from '@/api/core/captcha';
import { $t } from '@/locales';
import { useAuthStore } from '@/stores';
import { cn } from '@/utils';
import {
  Button,
  Checkbox,
  Form,
  FormItem,
  Input,
  InputPassword,
} from 'antdv-next';

import InputCaptcha from './input-captcha.vue';
import OAuthLogin from './oauth-login.vue';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const router = useRouter();

const REMEMBER_ME_KEY = `REMEMBER_ME_USERNAME_${location.hostname}`;
const localUsername = localStorage.getItem(REMEMBER_ME_KEY) || '';
const rememberMe = ref(!!localUsername);

const formState = reactive({
  username: localUsername || 'admin',
  password: 'admin123',
  code: '',
});

const captchaInfo = ref<CaptchaResponse>({
  captchaEnabled: false,
  img: '',
  uuid: '',
});
// 验证码loading
const captchaLoading = ref(false);

const rules = computed(() => {
  const result: Record<string, any[]> = {
    username: [
      {
        required: true,
        message: $t('authentication.usernameTip'),
        trigger: 'blur',
      },
    ],
    password: [
      {
        required: true,
        message: $t('authentication.passwordTip'),
        trigger: 'blur',
      },
      { min: 5, message: $t('authentication.passwordTip'), trigger: 'blur' },
    ],
  };
  // 仅在开启验证码时校验
  if (captchaInfo.value.captchaEnabled) {
    result.code = [
      {
        required: true,
        message: $t('authentication.verifyRequiredTip'),
        trigger: 'blur',
      },
    ];
  }
  return result;
});

async function loadCaptcha() {
  // 防止请求过快产生闪烁问题
  const delayLoading = setTimeout(() => {
    captchaLoading.value = true;
  }, 300);
  try {
    const resp = await captchaImage();
    if (resp.captchaEnabled) {
      resp.img = `data:image/png;base64,${resp.img}`;
    }
    captchaInfo.value = resp;
  } catch (error) {
    console.error(error);
  } finally {
    captchaLoading.value = false;
    clearTimeout(delayLoading);
  }
}

// 校验通过后(原生 Form 的 finish 仅在校验成功时触发)
async function handleSubmit() {
  localStorage.setItem(
    REMEMBER_ME_KEY,
    rememberMe.value ? formState.username : '',
  );
  try {
    const requestParam: any = {
      username: formState.username,
      password: formState.password,
      grantType: 'password',
    };
    // 验证码
    if (captchaInfo.value.captchaEnabled) {
      requestParam.code = formState.code;
      requestParam.uuid = captchaInfo.value.uuid;
    }
    // 登录
    await authStore.authLogin(requestParam);
  } catch (error) {
    // 处理验证码错误
    if (error instanceof Error) {
      // 刷新验证码
      formState.code = '';
      await loadCaptcha();
    }
  }
}

function handleGo(path: string) {
  router.push(path);
}

onMounted(async () => {
  await loadCaptcha();
});
</script>

<template>
  <div>
    <!-- 标题 -->
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="text-foreground mb-3 text-3xl/9 font-bold tracking-tight lg:text-4xl"
      >
        {{ $t('authentication.welcomeBack') }} 👋🏻
      </h2>
      <p class="lg:text-md text-muted-foreground text-sm">
        {{ $t('authentication.loginSubtitle') }}
      </p>
    </div>

    <Form
      :model="formState"
      :rules="rules"
      class="mb-2"
      layout="vertical"
      @finish="handleSubmit"
    >
      <FormItem name="username">
        <Input
          v-model:value="formState.username"
          allow-clear
          :placeholder="$t('authentication.usernameTip')"
          size="large"
        />
      </FormItem>

      <FormItem name="password">
        <InputPassword
          v-model:value="formState.password"
          :placeholder="$t('authentication.passwordTip')"
          size="large"
        />
      </FormItem>

      <FormItem v-if="captchaInfo.captchaEnabled" name="code">
        <InputCaptcha
          v-model="formState.code"
          :captcha="captchaInfo.img"
          :loading="captchaLoading"
          :placeholder="$t('authentication.code')"
          class="focus:border-primary"
          @captcha-click="loadCaptcha"
        />
      </FormItem>

      <div class="mb-6 flex justify-between">
        <Checkbox v-model:checked="rememberMe" name="rememberMe">
          {{ $t('authentication.rememberMe') }}
        </Checkbox>
        <span
          class="vben-link text-sm font-normal"
          @click="handleGo('/auth/forget-password')"
        >
          {{ $t('authentication.forgetPassword') }}
        </span>
      </div>

      <Button
        :class="cn({ 'cursor-wait': authStore.loginLoading }, 'h-10')"
        :disabled="captchaLoading"
        :loading="authStore.loginLoading"
        aria-label="login"
        class="w-full"
        html-type="submit"
        size="large"
        type="primary"
      >
        {{ $t('common.login') }}
      </Button>
    </Form>

    <!-- 第三方登录 -->
    <OAuthLogin />
  </div>
</template>
