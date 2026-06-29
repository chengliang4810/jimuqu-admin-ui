<script setup lang="ts">
import type { DeptTree, Role, User } from '@/api/system/user/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance, SelectProps } from 'antdv-next';

import { computed, h, onMounted, ref } from 'vue';

import { uploadApi } from '@/api/core/upload';
import { configInfoByKey } from '@/api/system/config';
import { postOptionSelect } from '@/api/system/post';
import {
  findUserInfo,
  getDeptTree,
  userAdd,
  userUpdate,
} from '@/api/system/user';
import { useVbenDrawer } from '@/components';
import { CropperAvatar } from '@/components/cropper';
import {
  FormInput as Input,
  FormInputPassword as InputPassword,
  FormSelect as Select,
  FormTextArea as TextArea,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { preferences } from '@/core/preferences';
import { $t } from '@/locales';
import { addFullName, buildUUID, cloneDeep, getPopupContainer } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { authScopeOptions } from '@/views/system/role/data';
import { Form, FormItem, RadioGroup, Tag } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

type FormData = Partial<User> & {
  password?: string;
  postIds?: number[];
  roleIds?: string[];
};
type SelectOptions = NonNullable<SelectProps['options']>;

function getDefaultValues(): FormData {
  return {
    avatar: undefined,
    deptId: undefined,
    email: undefined,
    nickName: '',
    password: '',
    phoneNumber: undefined,
    postIds: [],
    remark: '',
    roleIds: [],
    sex: '0',
    status: '0',
    userId: undefined,
    userName: '',
  };
}

const formData = ref<FormData>(getDefaultValues());

/** 编辑时当前用户的头像 URL（仅用于显示，不随表单提交） */
const currentAvatarUrl = ref('');

/** CropperAvatar 显示用的值：上传后用自己的 base64，否则用已有 URL */
const avatarDisplayValue = computed(() => {
  return currentAvatarUrl.value || preferences.app.defaultAvatar;
});

/**
 * 头像上传：先上传到 OSS → 拿到 ossId → 存入表单
 */
async function handleAvatarUpload({
  file,
  filename,
}: {
  file: Blob;
  filename: string;
}) {
  const uploadFile = filename
    ? new File([file], filename)
    : new File([file], `${buildUUID()}.png`);

  const result = await uploadApi(uploadFile);
  formData.value.avatar = result.ossId;
  return { url: result.url };
}

const formInstance = ref<FormInstance>();
const deptTreeData = ref<DeptTree[]>([]);
const postOptions = ref<SelectOptions>([]);
const roleOptions = ref<SelectOptions>([]);
const postPlaceholder = ref('请先选择部门');
const formRules = computed<AntdFormRules<FormData>>(() => ({
  deptId: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  email: [{ message: '请输入正确的邮箱', type: 'email' }],
  nickName: [{ required: true, message: $t('ui.formRules.required') }],
  password: [
    { required: !isUpdate.value, message: $t('ui.formRules.required') },
  ],
  phoneNumber: [{ message: '请输入正确的手机号码', pattern: /^1[3-9]\d{9}$/ }],
  roleIds: [
    {
      required: !!formData.value.userId,
      message: $t('ui.formRules.selectRequired'),
      type: 'array',
    },
  ],
  userName: [{ required: true, message: $t('ui.formRules.required') }],
}));

/**
 * 生成角色的自定义label
 * 也可以用option插槽来做
 * renderComponentContent: () => ({
    option: ({value, label, [disabled, key, title]}) => '',
  }),
 */
function genRoleOptionlabel(role: Role) {
  const found = authScopeOptions.find((item) => item.value === role.dataScope);
  if (!found) {
    return role.roleName;
  }
  return h('div', { class: 'flex items-center gap-[6px]' }, [
    h('span', null, role.roleName),
    h(Tag, { color: found.color }, () => found.label),
  ]);
}

/**
 * 岗位的加载
 */
async function setupPostOptions(deptId: number | string) {
  const postListResp = await postOptionSelect(deptId);
  postOptions.value = postListResp.map((item) => ({
    label: item.postName,
    value: item.postId,
  }));
  postPlaceholder.value =
    postOptions.value.length > 0 ? '请选择' : '该部门下暂无岗位';
}

/**
 * 初始化部门选择
 */
async function setupDeptSelect() {
  const deptTree = await getDeptTree();
  // 选中后显示在输入框的值 即父节点 / 子节点
  addFullName(deptTree, 'label', ' / ');
  deptTreeData.value = deptTree;
}

async function handleDeptSelect(deptId: number | string) {
  /** 根据部门ID加载岗位 */
  await setupPostOptions(deptId);
  /** 变化后需要重新选择岗位 */
  formData.value.postIds = [];
}

const defaultPassword = ref('');
onMounted(async () => {
  const password = await configInfoByKey('sys.user.initPassword');
  if (password) {
    defaultPassword.value = password;
  }
});

/**
 * 新增时候 从参数设置获取默认密码
 */
async function loadDefaultPassword(update: boolean) {
  if (!update && defaultPassword.value) {
    formData.value.password = defaultPassword.value;
  }
}

function customFormValueGetter() {
  return JSON.stringify(formData.value);
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: customFormValueGetter,
    currentGetter: customFormValueGetter,
  },
);

const [BasicDrawer, drawerApi] = useVbenDrawer({
  onBeforeClose,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      // 需要重置岗位选择
      postOptions.value = [];
      postPlaceholder.value = '请先选择部门';
      return null;
    }
    drawerApi.drawerLoading(true);

    const { id } = drawerApi.getData() as { id?: number | string };
    isUpdate.value = !!id;
    // 更新 && 赋值
    const { postIds, posts, roleIds, roles, user } = await findUserInfo(id);
    postOptions.value = (posts ?? []).map((item) => ({
      label: item.postName,
      value: item.postId,
    }));
    roleOptions.value = roles.map((item) => ({
      label: genRoleOptionlabel(item),
      // title用于选中后回填到输入框 默认为label
      title: item.roleName,
      value: item.roleId,
    }));

    // 部门选择、初始密码及用户相关操作并行处理
    const promises = [setupDeptSelect(), loadDefaultPassword(isUpdate.value)];
    if (user) {
      currentAvatarUrl.value = user.avatar ?? '';
      formData.value = {
        ...getDefaultValues(),
        ...user,
        // avatar 只在用户上传新头像后才赋值 ossId，编辑时不预填 URL
        avatar: undefined,
        postIds: postIds ?? [],
        roleIds: roleIds ?? [],
      };
      // 更新时不会触发onSelect 需要手动调用
      promises.push(setupPostOptions(user.deptId));
    }
    // 并行处理 重构后会带来10-50ms的优化
    await Promise.all(promises);
    await markInitialized();

    drawerApi.drawerLoading(false);
  },
});

async function handleConfirm() {
  try {
    drawerApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? userUpdate(data) : userAdd(data));
    resetInitialized();
    emit('reload');
    await drawerApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.lock(false);
  }
}

function handleClosed() {
  formData.value = getDefaultValues();
  currentAvatarUrl.value = '';
  formInstance.value?.resetFields();
  postOptions.value = [];
  roleOptions.value = [];
  postPlaceholder.value = '请先选择部门';
  resetInitialized();
}
</script>

<template>
  <BasicDrawer :title="title" :size="600">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem name="userId" hidden>
        <Input v-model:value="formData.userId" />
      </FormItem>
      <FormItem label="用户头像">
        <CropperAvatar
          :show-btn="false"
          :upload-api="handleAvatarUpload"
          :value="avatarDisplayValue"
          width="80"
        />
      </FormItem>
      <FormItem label="用户账号" name="userName" :rules="formRules.userName">
        <Input
          allow-clear
          class="w-full"
          :disabled="isUpdate"
          v-model:value="formData.userName"
        />
      </FormItem>
      <FormItem
        v-if="!isUpdate"
        label="用户密码"
        name="password"
        :rules="formRules.password"
      >
        <InputPassword
          allow-clear
          class="w-full"
          v-model:value="formData.password"
        />
      </FormItem>
      <FormItem label="用户昵称" name="nickName" :rules="formRules.nickName">
        <Input allow-clear class="w-full" v-model:value="formData.nickName" />
      </FormItem>
      <div class="grid grid-cols-1 lg:grid-cols-2">
        <FormItem label="用户性别" name="sex">
          <RadioGroup
            button-style="solid"
            option-type="button"
            :options="getDictOptions(DictEnum.SYS_USER_GENDER)"
            v-model:value="formData.sex"
          />
        </FormItem>
        <FormItem label="用户状态" name="status">
          <RadioGroup
            button-style="solid"
            option-type="button"
            :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
            v-model:value="formData.status"
          />
        </FormItem>
      </div>
      <FormItem
        label="手机号码"
        name="phoneNumber"
        :rules="formRules.phoneNumber"
      >
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.phoneNumber"
        />
      </FormItem>
      <FormItem label="电子邮箱" name="email" :rules="formRules.email">
        <Input allow-clear class="w-full" v-model:value="formData.email" />
      </FormItem>
      <FormItem label="所属部门" name="deptId" :rules="formRules.deptId">
        <TreeSelect
          allow-clear
          class="w-full"
          :field-names="{ value: 'id', children: 'children' }"
          :get-popup-container="getPopupContainer"
          placeholder="选择部门后, 将自动加载该部门下所有的岗位"
          show-search
          :tree-data="deptTreeData"
          tree-default-expand-all
          :tree-line="{ showLeafIcon: false }"
          tree-node-filter-prop="label"
          tree-node-label-prop="fullName"
          v-model:value="formData.deptId"
          @select="handleDeptSelect"
        />
      </FormItem>
      <FormItem extra="" label="所属岗位" name="postIds">
        <Select
          allow-clear
          class="w-full"
          :get-popup-container="getPopupContainer"
          mode="multiple"
          option-filter-prop="label"
          option-label-prop="label"
          :options="postOptions"
          :placeholder="postPlaceholder"
          v-model:value="formData.postIds"
        />
      </FormItem>
      <FormItem label="所属角色" name="roleIds" :rules="formRules.roleIds">
        <Select
          allow-clear
          class="w-full"
          :get-popup-container="getPopupContainer"
          mode="multiple"
          option-filter-prop="title"
          option-label-prop="title"
          :options="roleOptions"
          placeholder="请选择"
          v-model:value="formData.roleIds"
        />
      </FormItem>
      <FormItem label="备注信息" name="remark">
        <TextArea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicDrawer>
</template>
