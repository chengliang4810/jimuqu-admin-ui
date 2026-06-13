import { defineComponent, h, isVNode } from 'vue';

/**
 * 渲染 string | 组件 | 渲染函数 | VNode 的通用内容组件，
 * 替换原 `@vben-core/shadcn-ui` 的 VbenRenderContent。
 */
export default defineComponent({
  name: 'RenderContent',
  props: {
    content: {
      default: '',
      type: [String, Number, Function, Object, Array] as any,
    },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const content = props.content as any;
      if (content === undefined || content === null || content === '') {
        return slots.default?.();
      }
      if (typeof content === 'string' || typeof content === 'number') {
        return content;
      }
      if (isVNode(content)) {
        return content;
      }
      // 函数(渲染函数/函数式组件)或组件对象，统一交给 h 处理
      return h(content, attrs, slots);
    };
  },
});
