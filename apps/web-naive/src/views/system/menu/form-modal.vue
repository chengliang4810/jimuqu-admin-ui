<script setup lang="tsx">
import { useVbenModal } from '@vben/common-ui';
import { VbenIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { cloneDeep, getPopupContainer, listToTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { requestClient } from '#/api/request';
import { getDictOptions } from '#/utils/dict';

const emit = defineEmits<{ reload: [] }>();

const message = useMessage();

// 表单类型
export type FormType = 'add' | 'update';
const currentType: Ref<FormType> = ref('add');

// 表单不同类型参数
const formTypeData: Record<FormType, Record<string, any>> = {
  add: {
    title: '新增菜单权限',
    url: '/system/menu/add',
  },
  update: {
    title: '编辑菜单权限',
    url: '/system/menu/update',
  },
};

// 菜单类型（M目录 C菜单 F按钮）
const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
];

const yesNoOptions = [
  { label: '是', value: '0' },
  { label: '否', value: '1' },
];

// 当前表单类型参数
const currentFormTypeData = computed(() => {
  return formTypeData[currentType.value];
});

async function setupMenuSelect() {
  // menu
  const menuArray = await requestClient.get('/system/menu/list');
  // support i18n
  menuArray.forEach((item: any) => {
    item.menuName = $t(item.menuName);
  });
  // const folderArray = menuArray.filter((item) => item.menuType === 'M');
  /**
   * 这里需要过滤掉按钮类型
   * 不允许在按钮下添加数据
   */
  const filteredList = menuArray.filter((item: any) => {
    if (item.menuType !== 'F') {
      return true;
    }
    item.children = undefined;
    return false;
  });
  const menuTree = listToTree(filteredList, { id: 'id', pid: 'parentId' });
  const fullMenuTree = [
    {
      id: '0',
      menuName: '根目录',
      children: menuTree,
    },
  ];
  // addFullName(fullMenuTree, 'menuName', ' / ');

  formApi.updateSchema([
    {
      componentProps: {
        options: fullMenuTree,
        getPopupContainer,
      },
      fieldName: 'parentId',
    },
  ]);
}

// 表单字段配置
const [MenuForm, formApi] = useVbenForm({
  schema: [
    {
      label: '菜单ID',
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        // 使用css方式隐藏 但仍然可赋值
        show: () => false,
        // 注意这个一定要为['']  否则不能被正常隐藏
        triggerFields: [''],
      },
    },
    {
      component: 'TreeSelect',
      defaultValue: '0',
      fieldName: 'parentId',
      label: '上级菜单',
      rules: 'selectRequired',
      componentProps: {
        getPopupContainer,
        keyField: 'id',
        labelField: 'menuName',
        showPath: true,
        defaultExpandAll: true,
        virtualScroll: false,
      },
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: menuTypeOptions,
        optionType: 'button',
      },
      defaultValue: 'M',
      dependencies: {
        componentProps: (_, api) => {
          // 切换时清空校验
          // 直接抄的源码 没有清空校验的方法
          Object.keys(api.errors.value).forEach((key) => {
            api.setFieldError(key, undefined);
          });
          return {};
        },
        triggerFields: ['menuType'],
      },
      fieldName: 'menuType',
      label: '菜单类型',
    },
    {
      component: 'Input',
      dependencies: {
        // 类型不为按钮时显示
        show: (values) => values.menuType !== 'F',
        triggerFields: ['menuType'],
      },
      renderComponentContent: (model) => ({
        addonBefore: () => <VbenIcon icon={model.icon} />,
        addonAfter: () => (
          <a href="https://icon-sets.iconify.design/" target="_blank">
            搜索图标
          </a>
        ),
      }),
      fieldName: 'icon',
      help: '点击搜索图标跳转到iconify & 粘贴',
      label: '菜单图标',
    },
    {
      component: 'Input',
      fieldName: 'menuName',
      label: '菜单名称',
      help: '支持i18n写法, 如: menu.system.user',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      fieldName: 'orderNum',
      help: '排序, 数字越小越靠前',
      label: '显示排序',
      defaultValue: 0,
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: (model) => {
        const placeholder =
          model.isFrame === '0'
            ? '填写链接地址http(s)://  使用新页面打开'
            : '填写`路由地址`或者`链接地址`  链接默认使用内部iframe内嵌打开';
        return {
          placeholder,
        };
      },
      dependencies: {
        rules: (model) => {
          if (model.isFrame !== '0') {
            return z
              .string({ message: '请输入路由地址' })
              .refine((val) => !val.startsWith('/'), {
                message: '路由地址不需要带/',
              });
          }
          // 为链接
          return z
            .string({ message: '请输入链接地址' })
            .regex(/^https?:\/\//, { message: '请输入正确的链接地址' });
        },
        // 类型不为按钮时显示
        show: (values) => values?.menuType !== 'F',
        triggerFields: ['isFrame', 'menuType'],
      },
      fieldName: 'path',
      help: `路由地址不带/, 如: menu, user\n 链接为http(s)://开头\n 链接默认使用内部iframe打开, 可通过{是否外链}控制打开方式`,
      label: '路由地址',
    },
    {
      component: 'Input',
      componentProps: (model) => {
        return {
          // 为链接时组件disabled
          disabled: model.isFrame === '0',
        };
      },
      defaultValue: '',
      dependencies: {
        rules: (model) => {
          // 非链接时为必填项
          if (model.path && !/^https?:\/\//.test(model.path)) {
            return z
              .string()
              .min(1, { message: '非链接时必填组件路径' })
              .refine((val) => !val.startsWith('/') && !val.endsWith('/'), {
                message: '组件路径开头/末尾不需要带/',
              });
          }
          // 为链接时非必填
          return z.string().optional();
        },
        // 类型为菜单时显示
        show: (values) => values.menuType === 'C',
        triggerFields: ['menuType', 'path'],
      },
      fieldName: 'component',
      help: '填写./src/views下的组件路径, 如system/menu/index',
      label: '组件路径',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: yesNoOptions,
        optionType: 'button',
      },
      defaultValue: '1',
      dependencies: {
        // 类型不为按钮时显示
        show: (values) => values.menuType !== 'F',
        triggerFields: ['menuType'],
      },
      fieldName: 'isFrame',
      help: '外链为http(s)://开头\n 选择否时, 使用iframe从内部打开页面, 否则新窗口打开',
      label: '是否外链',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: getDictOptions('sys_show_hide'),
        optionType: 'button',
      },
      defaultValue: '0',
      dependencies: {
        // 类型不为按钮时显示
        show: (values) => values.menuType !== 'F',
        triggerFields: ['menuType'],
      },
      fieldName: 'visible',
      help: '隐藏后不会出现在菜单栏, 但仍然可以访问',
      label: '是否显示',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: getDictOptions('sys_normal_disable'),
        optionType: 'button',
      },
      defaultValue: '0',
      dependencies: {
        // 类型不为按钮时显示
        show: (values) => values.menuType !== 'F',
        triggerFields: ['menuType'],
      },
      fieldName: 'status',
      help: '停用后不会出现在菜单栏, 也无法访问',
      label: '菜单状态',
    },
    {
      component: 'Input',
      dependencies: {
        // 类型为菜单/按钮时显示
        show: (values) => values.menuType !== 'M',
        triggerFields: ['menuType'],
      },
      fieldName: 'perms',
      help: `控制器中定义的权限字符\n 如: @SaCheckPermission("system:user:import")`,
      label: '权限标识',
    },
    {
      component: 'Input',
      componentProps: (model) => ({
        // 为链接时组件disabled
        disabled: model.isFrame === '0',
        placeholder: '必须为json字符串格式',
      }),
      dependencies: {
        // 类型为菜单时显示
        show: (values) => values.menuType === 'C',
        triggerFields: ['menuType'],
      },
      fieldName: 'queryParam',
      help: 'vue-router中的query属性\n 如{"name": "xxx", "age": 16}',
      label: '路由参数',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: yesNoOptions,
        optionType: 'button',
      },
      defaultValue: '0',
      dependencies: {
        // 类型为菜单时显示
        show: (values) => values.menuType === 'C',
        triggerFields: ['menuType'],
      },
      fieldName: 'isCache',
      help: '路由的keepAlive属性',
      label: '是否缓存',
    },
  ],
  showDefaultActions: false,
});

// 菜单权限表单弹窗
const [FormModel, formModelApi] = useVbenModal({
  onConfirm: handleConfirm,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { formType, row } = formModelApi.getData<Record<string, any>>();
      currentType.value = formType;
      // 加载菜单树选择
      await setupMenuSelect();
      const isUpdate = currentType.value === 'update';

      if (row.id) {
        await formApi.setFieldValue('parentId', row.id);
        if (isUpdate) {
          const record = await requestClient.get(`/system/menu/${row.id}`);
          await formApi.setValues(record);
        }
      }
    }
  },
});

// 表单提交
async function handleConfirm() {
  const loading = message.loading(`正在${currentFormTypeData.value.title}...`);
  try {
    // 锁定表单弹窗禁止操作
    formModelApi.lock();

    // 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    // 表单数据
    const data = cloneDeep(await formApi.getValues());
    await requestClient.post(currentFormTypeData.value.url, {
      ...data,
      category: 'default',
    });

    // 提示成功
    message.success(`${currentFormTypeData.value.title}成功`);

    // 刷新表格
    emit('reload');
    // 关闭表单弹窗
    formModelApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    // 解锁表单弹窗
    formModelApi.lock(false);
    loading.destroy();
  }
}
</script>
<template>
  <FormModel :title="currentFormTypeData.title">
    <MenuForm />
  </FormModel>
</template>
