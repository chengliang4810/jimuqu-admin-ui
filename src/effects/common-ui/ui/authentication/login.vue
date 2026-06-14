<script setup lang="ts">
import type { VbenFormSchema } from '@/core/ui/form';

import type { AuthenticationProps, LoginAndRegisterParams } from './types';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { cloneDeep, cn } from '@/core/shared/utils';
import { useVbenForm } from '@/core/ui/form';
import { $t } from '@/locales';
import { Button, Checkbox } from 'antdv-next';

import Title from './auth-title.vue';
import ThirdPartyLogin from './third-party-login.vue';

interface Props extends AuthenticationProps {
  formSchema?: VbenFormSchema[];
  submitDisabled?: boolean;
}

defineOptions({
  name: 'AuthenticationLogin',
});

const props = withDefaults(defineProps<Props>(), {
  codeLoginPath: '/auth/code-login',
  forgetPasswordPath: '/auth/forget-password',
  formSchema: () => [],
  loading: false,
  registerPath: '/auth/register',
  showCodeLogin: true,
  showForgetPassword: true,
  showRegister: true,
  showRememberMe: true,
  showThirdPartyLogin: true,
  submitButtonText: '',
  submitDisabled: false,
  subTitle: '',
  title: '',
});

const emit = defineEmits<{
  submit: [LoginAndRegisterParams];
}>();

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      hideLabel: true,
      hideRequiredMark: true,
    },
    schema: computed(() => props.formSchema),
    showDefaultActions: false,
  }),
);
const router = useRouter();

const REMEMBER_ME_KEY = `REMEMBER_ME_USERNAME_${location.hostname}`;

const localUsername = localStorage.getItem(REMEMBER_ME_KEY) || '';

const rememberMe = ref(!!localUsername);

async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    const values = cloneDeep(await formApi.getValues());
    localStorage.setItem(
      REMEMBER_ME_KEY,
      rememberMe.value ? values?.username : '',
    );
    // 加上认证类型
    (values as any).grantType = 'password';
    emit('submit', values as LoginAndRegisterParams);
  }
}

function handleGo(path: string) {
  router.push(path);
}

onMounted(() => {
  if (localUsername) {
    formApi.setFieldValue('username', localUsername);
  }
});

defineExpose({
  getFormApi: () => formApi,
});
</script>

<template>
  <div @keydown.enter.prevent="handleSubmit">
    <slot name="title">
      <Title>
        <slot name="title">
          {{ title || `${$t('authentication.welcomeBack')} 👋🏻` }}
        </slot>
        <template #desc>
          <span class="text-muted-foreground">
            <slot name="subTitle">
              {{ subTitle || $t('authentication.loginSubtitle') }}
            </slot>
          </span>
        </template>
      </Title>
    </slot>

    <Form class="mb-2" />

    <div
      v-if="showRememberMe || showForgetPassword"
      class="mb-6 flex justify-between"
    >
      <div class="flex-center">
        <Checkbox
          v-if="showRememberMe"
          v-model:checked="rememberMe"
          name="rememberMe"
        >
          {{ $t('authentication.rememberMe') }}
        </Checkbox>
      </div>

      <span
        v-if="showForgetPassword"
        class="vben-link text-sm font-normal"
        @click="handleGo(forgetPasswordPath)"
      >
        {{ $t('authentication.forgetPassword') }}
      </span>
    </div>
    <Button
      :class="cn({ 'cursor-wait': loading }, 'h-10')"
      :disabled="submitDisabled"
      :loading="loading"
      aria-label="login"
      class="w-full"
      size="large"
      type="primary"
      @click="handleSubmit"
    >
      {{ submitButtonText || $t('common.login') }}
    </Button>

    <div v-if="showCodeLogin" class="mt-4 mb-2">
      <Button :block="true" size="large" @click="handleGo(codeLoginPath)">
        {{ $t('authentication.mobileLogin') }}
      </Button>
    </div>

    <!-- 第三方登录 -->
    <slot v-if="showThirdPartyLogin" name="third-party-login">
      <ThirdPartyLogin />
    </slot>

    <slot name="to-register">
      <div v-if="showRegister" class="mt-3 text-center text-sm">
        {{ $t('authentication.accountTip') }}
        <span
          class="vben-link text-sm font-normal"
          @click="handleGo(registerPath)"
        >
          {{ $t('authentication.createAccount') }}
        </span>
      </div>
    </slot>
  </div>
</template>
