<script setup lang="ts">
import type { Menu } from '@/api/system/menu/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { menuAdd, menuInfo, menuList, menuUpdate } from '@/api/system/menu';
import { useVbenDrawer } from '@/components';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { VbenIcon } from '@/icons';
import { $t } from '@/locales';
import { addFullName, cloneDeep, getPopupContainer, listToTree } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { useClipboard } from '@vueuse/core';
import { Form, FormItem, RadioGroup, Skeleton } from 'antdv-next';
import JsonEditorVue from 'json-editor-vue';

import { menuTypeOptions } from './data';

interface ModalProps {
  id?: number | string;
  record?: FormData;
  update?: boolean;
}

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});
const loading = ref(false);

type FormData = Partial<Menu> & {
  activeMenu?: string;
  ext?: string;
  queryParam?: string;
};

function getDefaultValues(): FormData {
  return {
    activeMenu: '',
    component: '',
    ext: '',
    icon: '',
    isCache: 'Y',
    isFrame: 'N',
    menuId: undefined,
    menuName: '',
    menuType: 'M',
    orderNum: 1,
    parentId: 0,
    path: '',
    perms: '',
    queryParam: '',
    status: '0',
    visible: '0',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const menuTreeData = ref<any[]>([]);

const showNotButton = computed(() => formData.value.menuType !== 'F');
const showMenu = computed(() => formData.value.menuType === 'C');
const showMenuOrButton = computed(() => formData.value.menuType !== 'M');
const pathPlaceholder = computed(() => {
  return formData.value.isFrame === '0'
    ? '填写链接地址http(s)://  使用新页面打开'
    : '填写`路由地址`或者`链接地址`  链接默认使用内部iframe内嵌打开';
});

const formTooltips = {
  activeMenu:
    '适用于隐藏菜单, 用于打开隐藏菜单时 左侧激活的菜单 如: /system/oss-config/index',
  component: '填写./src/views下的组件路径, 如system/menu/index',
  ext: 'vben5支持的路由meta参数 json格式',
  icon: '点击搜索图标跳转到iconify & 粘贴',
  isCache: '路由的keepAlive属性',
  isFrame:
    '外链为http(s)://开头\n选择否时, 使用iframe从内部打开页面, 否则新窗口打开',
  menuName: '支持i18n写法, 如: menu.system.user',
  orderNum: '排序, 数字越小越靠前',
  path: '路由地址不带/, 如: menu, user\n链接为http(s)://开头\n链接默认使用内部iframe打开, 可通过{是否外链}控制打开方式',
  perms: '控制器中定义的权限字符\n如: @SaCheckPermission("system:user:import")',
  queryParam: 'vue-router中的query属性\n如{"name": "xxx", "age": 16}',
  status: '停用后不会出现在菜单栏, 也无法访问',
  visible: '隐藏后不会出现在菜单栏, 但仍然可以访问',
};

const formRules = computed<AntdFormRules<FormData>>(() => ({
  component:
    formData.value.path && !/^https?:\/\//.test(formData.value.path)
      ? [
          { message: '非链接时必填组件路径', required: true },
          {
            validator: async (_rule, value) => {
              if (value && (value.startsWith('/') || value.endsWith('/'))) {
                throw new Error('组件路径开头/末尾不需要带/');
              }
            },
          },
        ]
      : [],
  menuName: [{ required: true, message: $t('ui.formRules.required') }],
  orderNum: [{ required: true, message: $t('ui.formRules.required') }],
  parentId: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  path:
    formData.value.isFrame === '0'
      ? [
          { message: '请输入链接地址', required: true },
          { message: '请输入正确的链接地址', pattern: /^https?:\/\// },
        ]
      : [
          { message: '请输入路由地址', required: true },
          {
            validator: async (_rule, value) => {
              if (value && value.startsWith('/')) {
                throw new Error('路由地址不需要带/');
              }
            },
          },
        ],
}));

async function setupMenuSelect() {
  // menu
  const menuArray = await menuList();
  // support i18n
  menuArray.forEach((item) => {
    item.menuName = $t(item.menuName);
  });
  // const folderArray = menuArray.filter((item) => item.menuType === 'M');
  /**
   * 这里需要过滤掉按钮类型
   * 不允许在按钮下添加数据
   */
  const filteredList = menuArray.filter((item) => item.menuType !== 'F');
  const menuTree = listToTree(filteredList, { id: 'menuId', pid: 'parentId' });
  const fullMenuTree = [
    {
      menuId: 0,
      menuName: $t('menu.root'),
      children: menuTree,
    },
  ];
  addFullName(fullMenuTree, 'menuName', ' / ');

  menuTreeData.value = fullMenuTree;
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
      return null;
    }
    drawerApi.drawerLoading(true);
    loading.value = true;

    const {
      id,
      record: importRecord,
      update,
    } = drawerApi.getData() as ModalProps;
    isUpdate.value = !!update;

    if (importRecord) {
      // 导入配置: 仅取表单已知字段(白名单)预填, 清空主键, 走新增流程
      await setupMenuSelect();
      const defaults = getDefaultValues();
      const picked: FormData = {};
      for (const key of Object.keys(defaults) as (keyof FormData)[]) {
        if (importRecord[key] !== undefined) {
          (picked[key] as unknown) = importRecord[key];
        }
      }
      formData.value = {
        ...defaults,
        ...picked,
        menuId: undefined,
      };
    } else if (id) {
      formData.value.parentId = id;
      // 创建元组(不是数组 元素位置固定)
      const promise = [
        update ? menuInfo(id) : null,
        setupMenuSelect(),
      ] as const;
      // 并行获取菜单树选择和菜单信息
      const [record] = await Promise.all(promise);
      if (record) {
        formData.value = {
          ...getDefaultValues(),
          ...record,
        };
      }
    } else {
      // 加载菜单树选择
      await setupMenuSelect();
    }
    await markInitialized();

    drawerApi.drawerLoading(false);
    loading.value = false;
  },
});

async function handleConfirm() {
  try {
    drawerApi.lock(true);
    await formInstance.value?.validate();

    // 有值 json校验失败
    if (queryParamJsonRef.value?.jsonEditor?.validate()) {
      window.message.warning(`路由参数 json 校验失败`);
      return;
    }
    if (extJsonRef.value?.jsonEditor?.validate()) {
      window.message.warning(`扩展路由Meta参数 json 校验失败`);
      return;
    }

    const data = cloneDeep(formData.value);
    await (isUpdate.value ? menuUpdate(data) : menuAdd(data));
    resetInitialized();
    emit('reload');
    drawerApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.lock(false);
  }
}

async function handleClosed() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
  menuTreeData.value = [];
  resetInitialized();
}

function handleMenuTypeChange() {
  (formInstance.value as any)?.clearValidate?.();
}

type JsonEditorVueRef = { jsonEditor: { validate: () => object | undefined } };
const queryParamJsonRef = ref<JsonEditorVueRef>();
const extJsonRef = ref<JsonEditorVueRef>();
const jsonEditorMode: any = 'text';

const { copy } = useClipboard({ legacy: true });
async function handleCopyConfig() {
  await formInstance.value?.validate();
  const data = cloneDeep(formData.value);
  await copy(JSON.stringify(data));
  window.message.success('已复制当前配置json');
}
</script>

<template>
  <BasicDrawer :title="title" :size="600">
    <Skeleton active v-if="loading" />
    <Form
      class="system-menu-form"
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '100px' } }"
      v-show="!loading"
    >
      <FormItem label="上级菜单" name="parentId" :rules="formRules.parentId">
        <TreeSelect
          class="w-full"
          :field-names="{ label: 'menuName', value: 'menuId' }"
          :get-popup-container="getPopupContainer"
          :list-height="300"
          show-search
          :tree-data="menuTreeData"
          :tree-default-expanded-keys="[0]"
          :tree-line="{ showLeafIcon: false }"
          tree-node-filter-prop="menuName"
          tree-node-label-prop="fullName"
          v-model:value="formData.parentId"
        />
      </FormItem>
      <FormItem label="菜单类型" name="menuType">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="menuTypeOptions"
          v-model:value="formData.menuType"
          @change="handleMenuTypeChange"
        />
      </FormItem>
      <FormItem
        v-if="showNotButton"
        label="菜单图标"
        name="icon"
        :tooltip="formTooltips.icon"
      >
        <Input allow-clear class="w-full" v-model:value="formData.icon">
          <template #addonBefore>
            <VbenIcon :icon="formData.icon" />
          </template>
          <template #addonAfter>
            <a href="https://icon-sets.iconify.design/" target="_blank">
              搜索图标
            </a>
          </template>
        </Input>
      </FormItem>
      <FormItem
        label="菜单名称"
        name="menuName"
        :rules="formRules.menuName"
        :tooltip="formTooltips.menuName"
      >
        <Input allow-clear class="w-full" v-model:value="formData.menuName" />
      </FormItem>
      <FormItem
        label="显示排序"
        name="orderNum"
        :rules="formRules.orderNum"
        :tooltip="formTooltips.orderNum"
      >
        <InputNumber
          class="w-full"
          v-model:value="formData.orderNum"
          :style="{ width: '100%' }"
        />
      </FormItem>
      <FormItem
        v-if="showNotButton"
        label="路由地址"
        name="path"
        :rules="formRules.path"
        :tooltip="formTooltips.path"
      >
        <Input
          allow-clear
          class="w-full"
          :placeholder="pathPlaceholder"
          v-model:value="formData.path"
        />
      </FormItem>
      <FormItem
        v-if="showMenu"
        label="组件路径"
        name="component"
        :rules="formRules.component"
        :tooltip="formTooltips.component"
      >
        <Input
          allow-clear
          class="w-full"
          :disabled="formData.isFrame === '0'"
          v-model:value="formData.component"
        />
      </FormItem>
      <FormItem
        v-if="showMenu"
        label="菜单激活"
        name="activeMenu"
        :tooltip="formTooltips.activeMenu"
      >
        <Input
          allow-clear
          class="w-full"
          :disabled="/^https?:\/\//.test(formData.path ?? '')"
          v-model:value="formData.activeMenu"
        />
      </FormItem>
      <FormItem
        v-if="showNotButton"
        label="是否外链"
        name="isFrame"
        :tooltip="formTooltips.isFrame"
      >
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_YES_NO)"
          v-model:value="formData.isFrame"
        />
      </FormItem>
      <FormItem
        v-if="showNotButton"
        label="是否显示"
        name="visible"
        :tooltip="formTooltips.visible"
      >
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_SHOW_HIDE)"
          v-model:value="formData.visible"
        />
      </FormItem>
      <FormItem
        v-if="showNotButton"
        label="菜单状态"
        name="status"
        :tooltip="formTooltips.status"
      >
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
          v-model:value="formData.status"
        />
      </FormItem>
      <FormItem
        v-if="showMenuOrButton"
        label="权限标识"
        name="perms"
        :tooltip="formTooltips.perms"
      >
        <Input allow-clear class="w-full" v-model:value="formData.perms" />
      </FormItem>
      <FormItem
        v-if="showMenu"
        label="路由参数"
        name="queryParam"
        :tooltip="formTooltips.queryParam"
      >
        <div class="h-[200px] w-full">
          <JsonEditorVue
            ref="queryParamJsonRef"
            class="h-full"
            v-model="formData.queryParam"
            :mode="jsonEditorMode"
            :main-menu-bar="false"
            :status-bar="false"
            :disabled="formData.isFrame === '0'"
            placeholder="必须为json字符串格式"
          />
        </div>
      </FormItem>
      <FormItem
        v-if="showMenu"
        label="是否缓存"
        name="isCache"
        :tooltip="formTooltips.isCache"
      >
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_YES_NO)"
          v-model:value="formData.isCache"
        />
      </FormItem>
      <FormItem
        v-if="showMenu"
        label="路由meta"
        name="ext"
        :tooltip="formTooltips.ext"
      >
        <div class="h-[200px] w-full">
          <JsonEditorVue
            ref="extJsonRef"
            class="h-full"
            v-model="formData.ext"
            :mode="jsonEditorMode"
            :main-menu-bar="false"
            :status-bar="false"
          />
        </div>
      </FormItem>
    </Form>

    <template #prepend-footer>
      <a-button
        v-if="isUpdate"
        class="mr-auto"
        color="green"
        variant="solid"
        @click="handleCopyConfig"
      >
        复制配置
      </a-button>
    </template>
  </BasicDrawer>
</template>

<style lang="scss">
div.jse-main {
  /* stylelint-disable-next-line selector-class-pattern */
  .ͼ1 .cm-gutter-lint {
    width: 0;
  }
}
</style>
