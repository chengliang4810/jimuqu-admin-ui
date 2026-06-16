<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { computed, nextTick, ref } from 'vue';

import { VbenAvatar, VbenButton } from '@/core/ui/adapter';
import { useVbenModal } from '@/core/ui/popup';
import { $t } from '@/locales';
import { Form, FormItem, InputPassword } from 'antdv-next';

interface Props {
  avatar?: string;
  text?: string;
}

defineOptions({
  name: 'LockScreenModal',
});

withDefaults(defineProps<Props>(), {
  avatar: '',
  text: '',
});

const emit = defineEmits<{
  submit: [password?: string];
}>();

const formData = ref({
  lockScreenPassword: '',
});
const formInstance = ref<FormInstance>();
const passwordInput = ref();

const formRules = computed(() => ({
  lockScreenPassword: [
    {
      message: $t('ui.widgets.lockScreen.placeholder'),
      required: true,
    },
  ],
}));

const [Modal] = useVbenModal({
  onConfirm() {
    handleSubmit();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formData.value.lockScreenPassword = '';
      formInstance.value?.resetFields();
    }
  },
  onOpened() {
    nextTick(() => {
      passwordInput.value?.focus?.();
    });
  },
});

async function handleSubmit() {
  await formInstance.value?.validate();
  emit('submit', formData.value.lockScreenPassword);
}
</script>

<template>
  <Modal
    :footer="false"
    :fullscreen-button="false"
    :title="$t('ui.widgets.lockScreen.title')"
  >
    <div
      class="mb-10 flex w-full flex-col items-center px-10"
      @keydown.enter.prevent="handleSubmit"
    >
      <div class="w-full">
        <div class="ml-2 flex w-full flex-col items-center">
          <VbenAvatar
            :src="avatar"
            class="size-20"
            dot-class="bottom-0 right-1 border-2 size-4 bg-green-500"
          />
          <div class="text-foreground my-6 flex items-center font-medium">
            {{ text }}
          </div>
        </div>
        <Form ref="formInstance" :model="formData">
          <FormItem
            name="lockScreenPassword"
            :rules="formRules.lockScreenPassword"
          >
            <InputPassword
              ref="passwordInput"
              name="lockScreenPassword"
              :placeholder="$t('ui.widgets.lockScreen.placeholder')"
              v-model:value="formData.lockScreenPassword"
            />
          </FormItem>
        </Form>
        <VbenButton class="mt-1 w-full" @click="handleSubmit">
          {{ $t('ui.widgets.lockScreen.screenButton') }}
        </VbenButton>
      </div>
    </div>
  </Modal>
</template>
