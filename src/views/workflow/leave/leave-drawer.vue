<script setup lang="ts">
import type { StartWorkFlowReqData } from '@/api/workflow/task/model';
import type { ExtendedModalApi } from '@/effects/common-ui';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import type { LeaveForm } from './api/model';

import { computed, ref, shallowRef } from 'vue';

import { startWorkFlow } from '@/api/workflow/task';
import {
  FormInputNumber as InputNumber,
  FormSelect as Select,
  FormTextArea as Textarea,
} from '@/components/global/form';
import { useVbenDrawer } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep, getPopupContainer } from '@/utils';
import { DateRangePicker, Form, FormItem } from 'antdv-next';
import dayjs from 'dayjs';
import { omit } from 'lodash-es';

import {
  leaveAdd,
  leaveInfo,
  leaveUpdate,
  submitAndStartWorkflow,
} from './api';
import { leaveFlowOptions, leaveTypeOptions } from './data';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

interface FormData extends LeaveForm {
  dateRange?: [Dayjs, Dayjs];
  flowType?: string;
  type?: string;
}

function getDefaultValues(): FormData {
  return {
    dateRange: undefined,
    flowType: 'leave1',
    id: undefined,
    leaveDays: undefined,
    leaveType: undefined,
    remark: '',
    type: 'frontend',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formRules = ref<AntdFormRules<FormData>>({
  dateRange: [{ required: true, message: $t('ui.formRules.required') }],
  flowType: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  leaveType: [{ required: true, message: $t('ui.formRules.selectRequired') }],
});

const startTypeOptions = [
  {
    label: '前端发起 (可选审批人, 选抄送人, 上传附件)',
    value: 'frontend',
  },
  {
    label: '后端发起 (自行编写后端逻辑, 由后端发起流程)',
    value: 'backend',
  },
];

const modalApi = shallowRef<ExtendedModalApi | null>(null);

const [BasicDrawer, drawerApi] = useVbenDrawer({
  closeOnClickModal: false,
  onClosed: handleClosed,
  onConfirm: handleStartWorkFlow,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    drawerApi.drawerLoading(true);

    const { id, applyModalApi } = drawerApi.getData() as {
      applyModalApi: ExtendedModalApi;
      id?: number | string;
    };
    modalApi.value = applyModalApi;
    isUpdate.value = !!id;
    // 赋值
    if (isUpdate.value && id) {
      const resp = await leaveInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...resp,
        dateRange: [dayjs(resp.startDate), dayjs(resp.endDate)],
      };
    }

    drawerApi.drawerLoading(false);
  },
});

async function handleClosed() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
}

function handleDateRangeChange(dates: Dayjs[] | null) {
  if (!dates || dates.length < 2) {
    formData.value.leaveDays = undefined;
    return;
  }
  const [start, end] = dates;
  formData.value.leaveDays = dayjs(end).diff(dayjs(start), 'day') + 1;
}

/**
 * 获取已经处理好的表单参数
 */
async function getFormData() {
  await formInstance.value?.validate();
  let data = cloneDeep(formData.value) as any;
  data = omit(data, 'flowType', 'type');
  // 处理日期
  data.startDate = dayjs(data.dateRange[0]).format('YYYY-MM-DD HH:mm:ss');
  data.endDate = dayjs(data.dateRange[1]).format('YYYY-MM-DD HH:mm:ss');
  return data;
}

/**
 * 暂存/提交 提取通用逻辑
 */
async function handleSaveOrUpdate() {
  const data = await getFormData();
  return await (isUpdate.value ? leaveUpdate(data) : leaveAdd(data));
}

/**
 * 暂存 草稿状态
 */
async function handleTempSave() {
  try {
    await handleSaveOrUpdate();
    emit('reload');
    drawerApi.close();
  } catch (error) {
    console.error(error);
  }
}

/**
 * 保存业务 & 发起流程
 */
async function handleStartWorkFlow() {
  drawerApi.lock(true);
  try {
    await formInstance.value?.validate();
    // 获取发起类型
    const { type } = formData.value;
    /**
     * 这里只是demo 实际只会用到一种
     */
    switch (type) {
      // 后端发起流程
      case 'backend': {
        const data = await getFormData();
        await submitAndStartWorkflow(data);
        emit('reload');
        drawerApi.close();
        break;
      }
      // 前端发起流程
      case 'frontend': {
        // 保存业务
        const leaveResp = await handleSaveOrUpdate();
        // 启动流程
        const taskVariables = {
          leaveDays: leaveResp!.leaveDays,
          userList: ['1', '3', '4'],
        };
        const flowCode = formData.value.flowType ?? 'leave1';
        const startWorkFlowData: StartWorkFlowReqData = {
          businessId: leaveResp!.id,
          flowCode,
          variables: taskVariables,
          flowInstanceBizExtBo: {
            businessTitle: '请假申请 - 自定义标题',
            businessCode: leaveResp!.applyCode,
          },
        };
        const { taskId } = await startWorkFlow(startWorkFlowData);
        // 打开窗口
        modalApi.value?.setData({
          taskId,
          taskVariables,
          variables: {},
        });
        modalApi.value?.open();
        break;
      }
    }
    emit('reload');
    drawerApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.lock(false);
  }
}
</script>

<template>
  <BasicDrawer :title="title" :size="600">
    <Form layout="vertical" ref="formInstance" :model="formData">
      <FormItem label="流程类型" name="flowType" :rules="formRules.flowType">
        <Select
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="leaveFlowOptions"
          v-model:value="formData.flowType"
        />
      </FormItem>
      <FormItem label="发起类型" name="type">
        <Select
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="startTypeOptions"
          v-model:value="formData.type"
        />
      </FormItem>
      <FormItem label="请假类型" name="leaveType" :rules="formRules.leaveType">
        <Select
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="leaveTypeOptions"
          v-model:value="formData.leaveType"
        />
      </FormItem>
      <FormItem label="开始时间" name="dateRange" :rules="formRules.dateRange">
        <DateRangePicker
          class="w-full"
          format="YYYY-MM-DD"
          v-model:value="formData.dateRange"
          @change="handleDateRangeChange"
        />
      </FormItem>
      <FormItem label="请假天数" name="leaveDays">
        <InputNumber
          disabled
          class="w-full"
          v-model:value="formData.leaveDays"
        />
      </FormItem>
      <FormItem label="请假原因" name="remark">
        <Textarea class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
    <template #center-footer>
      <a-button @click="handleTempSave">暂存</a-button>
    </template>
  </BasicDrawer>
</template>
