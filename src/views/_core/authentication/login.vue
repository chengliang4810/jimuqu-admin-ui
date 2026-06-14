<script lang="ts" setup>
import type { CaptchaResponse } from '@/api/core/captcha';
import type {
  LoginAndRegisterParams,
  VbenFormSchema,
} from '@/effects/common-ui';

import { computed, markRaw, onMounted, ref, useTemplateRef } from 'vue';

import { captchaImage } from '@/api/core/captcha';
import { AuthenticationLogin } from '@/effects/common-ui';
import { $t } from '@/locales';
import { useAuthStore } from '@/stores';
import { Input, InputPassword } from 'antdv-next';
import { omit } from 'lodash-es';

import InputCaptcha from './input-captcha.vue';
import OAuthLogin from './oauth-login.vue';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const loginFormRef = useTemplateRef('loginFormRef');

const captchaInfo = ref<CaptchaResponse>({
  captchaEnabled: false,
  img: '',
  uuid: '',
});
// 验证码loading
const captchaLoading = ref(false);

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

onMounted(async () => {
  await loadCaptcha();
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: markRaw(Input),
      modelPropName: 'value',
      componentProps: {
        size: 'large',
        placeholder: $t('authentication.usernameTip'),
        allowClear: true,
      },
      defaultValue: 'admin',
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: { message: $t('authentication.usernameTip'), required: true },
    },
    {
      component: markRaw(InputPassword),
      modelPropName: 'value',
      componentProps: {
        size: 'large',
        placeholder: $t('authentication.passwordTip'),
      },
      defaultValue: 'admin123',
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: {
        message: $t('authentication.passwordTip'),
        min: 5,
        required: true,
      },
    },
    {
      component: markRaw(InputCaptcha),
      componentProps: {
        captcha: captchaInfo.value.img,
        class: 'focus:border-primary',
        onCaptchaClick: loadCaptcha,
        placeholder: $t('authentication.code'),
        loading: captchaLoading.value,
      },
      dependencies: {
        if: () => captchaInfo.value.captchaEnabled,
        triggerFields: [''],
      },
      fieldName: 'code',
      label: $t('authentication.code'),
      rules: {
        message: $t('authentication.verifyRequiredTip'),
        required: true,
      },
    },
  ];
});

async function handleAccountLogin(values: LoginAndRegisterParams) {
  try {
    const requestParam: any = omit(values, ['code']);
    // 验证码
    if (captchaInfo.value.captchaEnabled) {
      requestParam.code = values.code;
      requestParam.uuid = captchaInfo.value.uuid;
    }
    // 登录
    await authStore.authLogin(requestParam);
  } catch (error) {
    console.error(error);
    // 处理验证码错误
    if (error instanceof Error) {
      // 刷新验证码
      loginFormRef.value?.getFormApi().setFieldValue('code', '');
      await loadCaptcha();
    }
  }
}
</script>

<template>
  <AuthenticationLogin
    ref="loginFormRef"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-register="false"
    :show-third-party-login="true"
    :submit-disabled="captchaLoading"
    @submit="handleAccountLogin"
  >
    <!-- 可通过show-third-party-login控制是否显示第三方登录 -->
    <template #third-party-login>
      <OAuthLogin />
    </template>
  </AuthenticationLogin>
</template>
