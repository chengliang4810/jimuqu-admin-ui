<script setup lang="ts">
import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';
import {
  addFullName,
  cloneDeep,
  getPopupContainer,
  listToTree,
} from '@vben/utils';

import { Skeleton } from 'antdv-next';
import JsonEditorVue from 'json-editor-vue';

import { useVbenForm } from '#/adapter/form';
import { menuAdd, menuInfo, menuList, menuUpdate } from '#/api/system/menu';
import { defaultFormValueGetter, useBeforeCloseDiff } from '#/utils/popup';

import { drawerSchema } from './data';

interface ModalProps {
  id?: number | string;
  update: boolean;
}

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});
const loading = ref(false);

const [BasicForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 90,
  },
  schema: drawerSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

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

  formApi.updateSchema([
    {
      componentProps: {
        fieldNames: {
          label: 'menuName',
          value: 'menuId',
        },
        getPopupContainer,
        // 设置弹窗滚动高度 默认256
        listHeight: 300,
        showSearch: true,
        treeData: fullMenuTree,
        treeDefaultExpandAll: false,
        // 默认展开的树节点
        treeDefaultExpandedKeys: [0],
        treeLine: { showLeafIcon: false },
        // 筛选的字段
        treeNodeFilterProp: 'menuName',
        treeNodeLabelProp: 'fullName',
      },
      fieldName: 'parentId',
    },
  ]);
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: defaultFormValueGetter(formApi),
    currentGetter: defaultFormValueGetter(formApi),
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

    const { id, update } = drawerApi.getData() as ModalProps;
    isUpdate.value = update;

    if (id) {
      await formApi.setFieldValue('parentId', id);
      // 创建元组(不是数组 元素位置固定)
      const promise = [
        update ? menuInfo(id) : null,
        setupMenuSelect(),
      ] as const;
      // 并行获取菜单树选择和菜单信息
      const [record] = await Promise.all(promise);
      if (record) {
        await formApi.setValues(record);
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
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    // 有值 json校验失败
    if (queryParamJsonRef.value?.[0]?.jsonEditor?.validate()) {
      window.message.warning(`路由参数 json 校验失败`);
      return;
    }
    if (extJsonRef.value?.[0]?.jsonEditor?.validate()) {
      window.message.warning(`扩展路由Meta参数 json 校验失败`);
      return;
    }

    const data = cloneDeep(await formApi.getValues());
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
  await formApi.resetForm();
  resetInitialized();
}

type JsonEditorVueRef = { jsonEditor: { validate: () => object | undefined } };
// 放在form中使用为数组 取index0
const queryParamJsonRef = ref<JsonEditorVueRef[]>();
const extJsonRef = ref<JsonEditorVueRef[]>();
const jsonEditorMode: any = 'text';
</script>

<template>
  <BasicDrawer :title="title" class="w-[600px]">
    <Skeleton active v-if="loading" />
    <BasicForm class="system-menu-form" v-show="!loading">
      <template #queryParam="slotProps">
        <div class="h-[200px] w-full">
          <JsonEditorVue
            ref="queryParamJsonRef"
            class="h-full"
            :mode="jsonEditorMode"
            :main-menu-bar="false"
            :status-bar="false"
            v-bind="slotProps"
          />
        </div>
      </template>

      <template #ext="slotProps">
        <div class="h-[200px] w-full">
          <JsonEditorVue
            ref="extJsonRef"
            class="h-full"
            :mode="jsonEditorMode"
            :main-menu-bar="false"
            :status-bar="false"
            v-bind="slotProps"
          />
        </div>
      </template>
    </BasicForm>
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
