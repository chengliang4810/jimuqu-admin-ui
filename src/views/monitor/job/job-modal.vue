<script setup lang="ts">
import type {
  JobConcurrentPolicy,
  JobMisfirePolicy,
  JobScheduleType,
  ScheduledJob,
  ScheduledJobSave,
} from '@/api/monitor/job/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref, watch } from 'vue';

import { jobAdd, jobHandlerList, jobUpdate } from '@/api/monitor/job';
import { useVbenModal } from '@/components';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormSelect as Select,
  FormTextArea as TextArea,
} from '@/components/global/form';
import { $t } from '@/locales';
import { cloneDeep, getPopupContainer } from '@/utils';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

/** 当前弹窗是否处于动态任务编辑模式。 */
const isUpdate = ref(false);
/** 编辑时用于构造资源路径的原任务标识。 */
const originalJobName = ref('');
/** Antdv 表单实例。 */
const formInstance = ref<FormInstance>();
/** 白名单处理器加载状态。 */
const handlerLoading = ref(false);
/** 白名单处理器下拉选项。 */
const handlerOptions = ref<{ label: string; value: string }[]>([]);

/** 获取安全且可直接提交的动态任务默认值。 */
function getDefaultValues(): ScheduledJobSave {
  return {
    concurrentPolicy: 'FORBID',
    description: '',
    handlerKey: '',
    initialDelayMs: 0,
    jobName: '',
    maxRetries: 0,
    misfirePolicy: 'FIRE_ONCE',
    retryIntervalMs: 1000,
    scheduleExpression: '0 0/5 * * * ? *',
    scheduleType: 'CRON',
    zone: 'Asia/Shanghai',
  };
}

/** 当前动态任务表单数据。 */
const formData = ref<ScheduledJobSave>(getDefaultValues());
/** 弹窗标题。 */
const title = computed(() =>
  isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add'),
);
/** 当前是否使用 Cron 调度。 */
const isCron = computed(() => formData.value.scheduleType === 'CRON');
/** 根据调度类型切换输入提示。 */
const schedulePlaceholder = computed(() =>
  isCron.value ? '例如：0 0/5 * * * ? *' : '请输入正整数毫秒数',
);

/** 切换调度类型时移除 Solon 不使用的配置并恢复 Cron 默认时区。 */
watch(
  () => formData.value.scheduleType,
  (scheduleType) => {
    if (scheduleType === 'CRON') {
      formData.value.initialDelayMs = 0;
      formData.value.zone ||= 'Asia/Shanghai';
      return;
    }
    formData.value.zone = '';
  },
);

/** 调度类型选项。 */
const scheduleTypeOptions: Array<{
  label: string;
  value: JobScheduleType;
}> = [
  { label: 'Cron 表达式', value: 'CRON' },
  { label: '固定频率', value: 'FIXED_RATE' },
  { label: '固定延迟', value: 'FIXED_DELAY' },
];
/** 同一任务的并发执行策略。 */
const concurrentOptions = computed<
  Array<{
    disabled?: boolean;
    label: string;
    value: JobConcurrentPolicy;
  }>
>(() => [
  { label: '禁止并发', value: 'FORBID' },
  {
    disabled: formData.value.maxRetries > 0,
    label: '允许并发',
    value: 'ALLOW',
  },
]);
/** 启用失败重试时强制使用互斥执行，避免长时间占满调度线程。 */
watch(
  () => formData.value.maxRetries,
  (maxRetries) => {
    if (maxRetries > 0) {
      formData.value.concurrentPolicy = 'FORBID';
    }
  },
);
/** 节点恢复后的错过执行策略。 */
const misfireOptions: Array<{
  label: string;
  value: JobMisfirePolicy;
}> = [
  { label: '补偿执行一次', value: 'FIRE_ONCE' },
  { label: '忽略错过执行', value: 'IGNORE' },
];
/** 浏览器原生支持的 IANA 时区查询方法。 */
const supportedValuesOf = (
  Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  }
).supportedValuesOf;
/** 优先展示中国时区，并保留浏览器支持的完整时区集合。 */
const zoneOptions = [
  ...new Set([
    'Asia/Shanghai',
    'UTC',
    ...(supportedValuesOf?.('timeZone') ?? []),
  ]),
].map((zone) => ({ label: zone, value: zone }));

/** 与后端 DTO 约束保持一致的表单校验规则。 */
const rules = computed<AntdFormRules<ScheduledJobSave>>(() => ({
  description: [
    { max: 200, message: '任务说明不能超过 200 个字符' },
    { message: '请输入任务说明', required: true },
  ],
  handlerKey: [{ message: '请选择执行目标', required: true }],
  initialDelayMs: [
    { message: '请输入初始延迟', required: true },
    {
      max: 31_536_000_000,
      message: '初始延迟必须在 0 到 31536000000 毫秒之间',
      min: 0,
      type: 'number',
    },
  ],
  jobName: [
    { message: '请输入任务标识', required: true },
    { max: 64, message: '任务标识不能超过 64 个字符' },
    {
      message: '任务标识仅支持字母开头及字母、数字、点、横线和下划线',
      pattern: /^[A-Za-z][\w.-]{0,63}$/,
    },
  ],
  maxRetries: [
    { message: '请输入最大重试次数', required: true },
    {
      max: 10,
      message: '最大重试次数必须在 0 到 10 之间',
      min: 0,
      type: 'number',
    },
  ],
  retryIntervalMs: [
    { message: '请输入重试间隔', required: true },
    {
      max: 86_400_000,
      message: '重试间隔必须在 0 到 86400000 毫秒之间',
      min: 0,
      type: 'number',
    },
  ],
  scheduleExpression: [
    { message: '请输入调度配置', required: true },
    { max: 128, message: '调度配置不能超过 128 个字符' },
    {
      validator: async (_rule, value) => {
        if (
          formData.value.scheduleType !== 'CRON' &&
          (!/^\d+$/.test(value) ||
            Number(value) < 100 ||
            Number(value) > 31_536_000_000)
        ) {
          throw new Error(
            '固定频率和固定延迟必须在 100 到 31536000000 毫秒之间',
          );
        }
      },
    },
  ],
  scheduleType: [{ message: '请选择调度方式', required: true }],
  zone: [
    { message: '请选择时区', required: true },
    { max: 64, message: '时区不能超过 64 个字符' },
  ],
}));

/** 生成关闭前脏数据比较快照。 */
function formSnapshot() {
  return JSON.stringify(formData.value);
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    currentGetter: formSnapshot,
    initializedGetter: formSnapshot,
  },
);

/** 加载白名单处理器，并保留已失效的历史选择供管理员识别。 */
async function loadHandlers(currentHandlerKey?: string) {
  handlerLoading.value = true;
  try {
    const handlers = await jobHandlerList();
    handlerOptions.value = handlers.map((handler) => ({
      label: `${handler.description}（${handler.className}#${handler.methodName}）`,
      value: handler.handlerKey,
    }));
    if (
      currentHandlerKey &&
      !handlerOptions.value.some((option) => option.value === currentHandlerKey)
    ) {
      handlerOptions.value.unshift({
        label: `${currentHandlerKey}（当前目标已不可用）`,
        value: currentHandlerKey,
      });
    }
  } finally {
    handlerLoading.value = false;
  }
}

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onBeforeClose,
  onClosed() {
    isUpdate.value = false;
    originalJobName.value = '';
    formData.value = getDefaultValues();
    handlerOptions.value = [];
    formInstance.value?.resetFields();
    resetInitialized();
  },
  async onConfirm() {
    try {
      modalApi.lock(true);
      await formInstance.value?.validate();
      const data = cloneDeep(formData.value);
      await (isUpdate.value
        ? jobUpdate(originalJobName.value, data)
        : jobAdd(data));
      resetInitialized();
      emit('reload');
      await modalApi.close();
    } catch {
      // 表单和请求层已向用户展示错误，保留当前输入。
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(open) {
    if (!open) {
      return;
    }
    modalApi.modalLoading(true);
    try {
      const { record } = modalApi.getData() as { record?: ScheduledJob };
      isUpdate.value = record?.jobSource === 'DYNAMIC';
      originalJobName.value = record?.jobName ?? '';
      formData.value = record
        ? {
            concurrentPolicy: record.concurrentPolicy,
            description: record.description,
            handlerKey: record.handlerKey,
            initialDelayMs: record.initialDelayMs,
            jobName: record.jobName,
            maxRetries: record.maxRetries,
            misfirePolicy: record.misfirePolicy,
            retryIntervalMs: record.retryIntervalMs,
            scheduleExpression: record.scheduleExpression,
            scheduleType: record.scheduleType,
            zone: record.zone,
          }
        : getDefaultValues();
      await loadHandlers(record?.handlerKey);
      await markInitialized();
    } finally {
      modalApi.modalLoading(false);
    }
  },
});
</script>

<template>
  <BasicModal :title="title" :width="760">
    <Form
      ref="formInstance"
      class="grid grid-cols-1 gap-x-4 md:grid-cols-2"
      layout="vertical"
      :model="formData"
    >
      <FormItem label="任务标识" name="jobName" :rules="rules.jobName">
        <Input
          v-model:value="formData.jobName"
          allow-clear
          class="w-full"
          :disabled="isUpdate"
          placeholder="例如：temporaryFileCleanupJob"
        />
      </FormItem>
      <FormItem label="执行目标" name="handlerKey" :rules="rules.handlerKey">
        <Select
          v-model:value="formData.handlerKey"
          class="w-full"
          :filter-option="
            (input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
          "
          :get-popup-container="getPopupContainer"
          :loading="handlerLoading"
          option-filter-prop="label"
          :options="handlerOptions"
          placeholder="请选择后端已注册的任务处理器"
          show-search
        />
      </FormItem>
      <FormItem
        class="md:col-span-2"
        label="任务说明"
        name="description"
        :rules="rules.description"
      >
        <TextArea
          v-model:value="formData.description"
          :auto-size="{ maxRows: 3, minRows: 2 }"
          class="w-full"
          placeholder="说明任务用途和影响范围"
        />
      </FormItem>
      <FormItem
        label="调度方式"
        name="scheduleType"
        :rules="rules.scheduleType"
      >
        <Select
          v-model:value="formData.scheduleType"
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="scheduleTypeOptions"
        />
      </FormItem>
      <FormItem
        label="调度配置"
        name="scheduleExpression"
        :rules="rules.scheduleExpression"
        :tooltip="
          isCron
            ? '使用 Solon Cron 表达式'
            : '固定频率从开始时间计算，固定延迟从上次执行完成时间计算'
        "
      >
        <Input
          v-model:value="formData.scheduleExpression"
          class="w-full"
          :placeholder="schedulePlaceholder"
        />
      </FormItem>
      <FormItem v-if="isCron" label="执行时区" name="zone" :rules="rules.zone">
        <Select
          v-model:value="formData.zone"
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="zoneOptions"
          show-search
        />
      </FormItem>
      <FormItem
        v-if="!isCron"
        label="初始延迟"
        name="initialDelayMs"
        :rules="rules.initialDelayMs"
        tooltip="应用启动后首次执行前的等待时间"
      >
        <InputNumber
          v-model:value="formData.initialDelayMs"
          addon-after="毫秒"
          class="w-full"
          :max="31_536_000_000"
          :min="0"
          :precision="0"
        />
      </FormItem>
      <FormItem
        label="并发策略"
        name="concurrentPolicy"
        tooltip="禁止并发时，同一任务尚未结束的新触发会被跳过"
      >
        <RadioGroup
          v-model:value="formData.concurrentPolicy"
          button-style="solid"
          option-type="button"
          :options="concurrentOptions"
        />
      </FormItem>
      <FormItem
        label="错过策略"
        name="misfirePolicy"
        tooltip="节点恢复后是否补偿执行一次错过的任务"
      >
        <RadioGroup
          v-model:value="formData.misfirePolicy"
          button-style="solid"
          option-type="button"
          :options="misfireOptions"
        />
      </FormItem>
      <FormItem
        label="最大重试次数"
        name="maxRetries"
        :rules="rules.maxRetries"
      >
        <InputNumber
          v-model:value="formData.maxRetries"
          class="w-full"
          :max="10"
          :min="0"
          :precision="0"
        />
      </FormItem>
      <FormItem
        label="重试间隔"
        name="retryIntervalMs"
        :rules="rules.retryIntervalMs"
      >
        <InputNumber
          v-model:value="formData.retryIntervalMs"
          addon-after="毫秒"
          class="w-full"
          :max="86_400_000"
          :min="0"
          :precision="0"
        />
      </FormItem>
    </Form>
  </BasicModal>
</template>
