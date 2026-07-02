import type { VxeGridInstance } from 'vxe-table';

import type { Ref } from 'vue';

/**
 * 外部搜索表单组件需要暴露的接口
 * 项目中所有 *-search.vue 均通过 defineExpose 暴露 getValues
 */
export interface VxeTableSearchFormInstance {
  /** 获取搜索表单当前值（支持同步/异步） */
  getValues: () => Promise<Record<string, any>> | Record<string, any>;
  /** 重置表单（可选） */
  resetFields?: () => void;
}

/**
 * 统一管理 vxe-table「外部搜索表单」与「表格查询」
 *
 * 解决：删除 / 解锁 / 排序 / 弹窗回调等操作调用 `query()` / `reload()`
 * 时，因未合并搜索表单值而导致筛选条件丢失的问题。
 *
 * @param searchFormRef 搜索表单组件 ref
 * @param tableRef vxe-grid 实例 ref
 * @param onCompleted 每次 query / reload 完成后的回调（如同步选中行）
 */
/**
 * 解析 proxyConfig.ajax.query 的第二个参数为可靠的表单值。
 *
 * vxe 内部触发查询(刷新按钮 / 分页 / 排序 / autoLoad)不会带入表单值，
 * 刷新按钮还会把 PointerEvent 当作该参数透传进来；统一以「搜索表单 ref」
 * 为真相源。主动 query/reload 传入的普通对象作为覆盖直接采用。
 *
 * 返回浅拷贝，页面可安全增删字段(如 deptId)。
 *
 * @param searchFormRef 搜索表单组件 ref
 * @param rawFormValues ajax.query 的第二个参数
 */
export async function resolveQueryFormValues(
  searchFormRef: Ref<undefined | VxeTableSearchFormInstance>,
  rawFormValues?: unknown,
): Promise<Record<string, any>> {
  // 主动 query/reload：第二参数是已合并的普通对象，直接采用
  if (
    rawFormValues &&
    typeof rawFormValues === 'object' &&
    !(rawFormValues instanceof Event)
  ) {
    return { ...(rawFormValues as Record<string, any>) };
  }
  // vxe 内部触发：回退到搜索表单当前值
  return { ...((await searchFormRef.value?.getValues?.()) ?? {}) };
}

export function useTableQuery(
  searchFormRef: Ref<undefined | VxeTableSearchFormInstance>,
  tableRef: Ref<null | undefined | VxeGridInstance>,
  onCompleted?: () => void,
) {
  /** 获取搜索表单当前值 */
  async function getFormValues() {
    return (await searchFormRef.value?.getValues?.()) ?? {};
  }

  /**
   * 在当前页重新查询，自动合并搜索表单值
   * @param params 额外参数，优先级高于表单值
   */
  async function query(params: Record<string, any> = {}) {
    const formValues = await getFormValues();
    await tableRef.value?.commitProxy('query', { ...formValues, ...params });
    onCompleted?.();
  }

  /**
   * 回到第一页查询，自动合并搜索表单值
   * @param params 额外参数，优先级高于表单值
   */
  async function reload(params: Record<string, any> = {}) {
    const formValues = await getFormValues();
    await tableRef.value?.commitProxy('reload', { ...formValues, ...params });
    onCompleted?.();
  }

  /** 重置搜索条件后回到第一页查询 */
  async function reset() {
    searchFormRef.value?.resetFields?.();
    await reload();
  }

  return { query, reload, reset, getFormValues };
}
