<script lang="ts" setup>
import type { Rule } from 'antdv-next/dist/form/types';

import type { Recordable } from '@/types';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@/locales';
import { Button, Form, FormItem, Input } from 'antdv-next';

defineOptions({ name: 'ForgetPassword' });

const router = useRouter();

const loading = ref(false);

const formState = reactive({
  email: '',
});

const rules: Record<keyof typeof formState, Rule[]> = {
  email: [
    { required: true, message: $t('authentication.emailTip'), trigger: 'blur' },
    {
      type: 'email',
      message: $t('authentication.emailValidErrorTip'),
      trigger: 'blur',
    },
  ],
};

// 校验通过后(原生 Form 的 finish 仅在校验成功时触发)
function handleSubmit(values: Recordable<any>) {
  console.log('reset email:', values);
}

function goToLogin() {
  router.push('/auth/login');
}
</script>

<template>
  <div>
    <!-- 标题 -->
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="text-foreground mb-3 text-3xl/9 font-bold tracking-tight lg:text-4xl"
      >
        {{ $t('authentication.forgetPassword') }} 🤦🏻‍♂️
      </h2>
      <p class="lg:text-md text-muted-foreground text-sm">
        {{ $t('authentication.forgetPasswordSubtitle') }}
      </p>
    </div>

    <Form
      :model="formState"
      :rules="rules"
      class="mb-2"
      layout="vertical"
      @finish="handleSubmit"
    >
      <FormItem name="email">
        <Input
          v-model:value="formState.email"
          placeholder="example@example.com"
          size="large"
        />
      </FormItem>

      <Button
        :class="{ 'cursor-wait': loading }"
        :loading="loading"
        aria-label="submit"
        class="mt-2 w-full"
        html-type="submit"
        size="large"
        type="primary"
      >
        {{ $t('authentication.sendResetLink') }}
      </Button>
      <Button class="mt-4 w-full" size="large" @click="goToLogin">
        {{ $t('common.back') }}
      </Button>
    </Form>
  </div>
</template>
