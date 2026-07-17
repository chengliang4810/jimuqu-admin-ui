<script setup lang="ts">
import type { Editor, JSONContent } from '@tiptap/core';

import type { TiptapModelValue, TiptapProps, TiptapUploadImage } from './type';

import { computed, shallowRef, watch } from 'vue';

import { cn } from '@/utils';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { Button, ColorPicker, Select, Spin, Tooltip, Upload } from 'antdv-next';
// 内部 API：读取/重置 Form.Item 注入的校验状态 context
import {
  NoFormStyle,
  useFormItemInputContext,
} from 'antdv-next/dist/form/context';

import { createExtensions } from './extensions';
import { getComparableValue, getEditorValue } from './helpers';
import { useTiptapStyles } from './styles';
import { blockOptions, useTiptapToolbar } from './toolbar';
import { defaultUploadImage, useTiptapUpload } from './upload';

defineOptions({
  name: 'Tiptap',
});

const props = withDefaults(defineProps<TiptapProps>(), {
  autofocus: false,
  contentClass: '',
  disabled: false,
  maxHeight: 640,
  minHeight: 260,
  output: 'html',
  placeholder: '请输入内容',
  toolbar: true,
});

const emit = defineEmits<{
  blur: [editor: Editor];
  change: [value: TiptapModelValue, editor: Editor];
  focus: [editor: Editor];
  mounted: [editor: Editor];
}>();

const content = defineModel<TiptapModelValue>('modelValue', {
  default: '',
});

const editorRef = shallowRef<Editor | null>(null);
const isUploading = shallowRef(false);

const {
  buttonClass,
  currentBlock,
  currentTextColor,
  isToolbarItemDisabled,
  runCommand,
  setBlock,
  setTextColor,
  syncToolbarState,
  toolbarGroups,
  unsetTextColor,
} = useTiptapToolbar({
  getEditor,
  isDisabled: () => props.disabled,
  isUploading,
});

const { editorContentClass, editorStyle, rootClass } = useTiptapStyles(props);

/**
 * 读取外层 Form.Item 通过 context 注入的校验状态
 * tiptap 编辑器本体是普通 div 不会消费该 context 故手动处理:
 * 1. 校验 error 时给整个编辑器容器加错误边框
 * 2. 工具栏内的 antd 控件(段落格式 Select 等)需重置该 status 避免被误染红
 */
const formItemInputContext = useFormItemInputContext();
const hasError = computed(() => formItemInputContext.value?.status === 'error');

const mergedRootClass = computed(() =>
  cn(rootClass.value, hasError.value && 'border-destructive'),
);

const { handleImageUploadRequest, handlePaste } = useTiptapUpload({
  getEditor,
  getUploadImage,
  isDisabled: () => props.disabled,
  isUploading,
  onUploaded: syncToolbarState,
});

const editor = useEditor({
  autofocus: props.autofocus,
  content: content.value || '',
  editable: !props.disabled,
  editorProps: {
    handlePaste,
  },
  extensions: createExtensions(props),
  onBlur: ({ editor }) => {
    emit('blur', editor);
  },
  onCreate: ({ editor }) => {
    editorRef.value = editor;
    syncToolbarState(editor);
    emit('mounted', editor);
  },
  onFocus: ({ editor }) => {
    emit('focus', editor);
  },
  onSelectionUpdate: ({ editor }) => {
    syncToolbarState(editor);
  },
  onTransaction: ({ editor }) => {
    syncToolbarState(editor);
  },
  onUpdate: ({ editor }) => {
    /**
     * tiptap默认会使用<p></p> 会过form的空校验 实际不符合业务
     * 通过editor.isEmpty判断
     * @see https://github.com/ueberdosis/tiptap/issues/154#issuecomment-1406214495
     */
    const value = editor.isEmpty ? '' : getEditorValue(editor, props.output);
    content.value = value;
    emit('change', value, editor);
  },
});

watch(
  () => props.disabled,
  (disabled) => {
    const target = getEditor();
    if (!target) {
      return;
    }

    target.setEditable(!disabled);
  },
);

watch(content, (value) => {
  const target = getEditor();
  if (!target) {
    return;
  }

  const currentValue = getComparableValue(getEditorValue(target, props.output));
  const nextValue = getComparableValue(value);

  if (currentValue === nextValue) {
    return;
  }

  target.commands.setContent(value || '', {
    emitUpdate: false,
  });
  syncToolbarState(target);
});

function getEditor() {
  return editor.value ?? editorRef.value;
}

function getUploadImage(): TiptapUploadImage {
  return props.uploadImage ?? defaultUploadImage;
}

function focus(position: Parameters<Editor['commands']['focus']>[0] = 'end') {
  const target = getEditor();
  if (!target) {
    return;
  }

  target.commands.focus(position);
}

function clear() {
  runCommand((target) => {
    target.commands.clearContent(true);
  });
}

function getHTML() {
  return getEditor()?.getHTML() ?? '';
}

function getJSON(): JSONContent | undefined {
  return getEditor()?.getJSON();
}

function getText() {
  return getEditor()?.getText() ?? '';
}

defineExpose({
  clear,
  editor,
  focus,
  getEditor,
  getHTML,
  getJSON,
  getText,
});
</script>

<template>
  <div :class="mergedRootClass" :style="editorStyle">
    <NoFormStyle v-if="toolbar" status :override="true">
      <div
        class="border-border bg-muted/30 flex flex-wrap items-center gap-1 border-b p-2"
        role="toolbar"
        aria-label="Tiptap 编辑器工具栏"
      >
        <Select
          :value="currentBlock"
          size="small"
          :options="blockOptions"
          :disabled="disabled || isUploading"
          aria-label="段落格式"
          :styles="{ root: { width: '112px' } }"
          @change="setBlock"
        />

        <template
          v-for="(group, groupIndex) in toolbarGroups"
          :key="groupIndex"
        >
          <span
            v-if="groupIndex > 0"
            class="bg-border mx-1 h-5 w-px"
            aria-hidden="true"
          ></span>
          <template v-for="item in group" :key="item.key">
            <Upload
              v-if="item.key === 'imageUpload'"
              accept="image/*"
              :custom-request="handleImageUploadRequest"
              :disabled="isToolbarItemDisabled(item)"
              :show-upload-list="false"
            >
              <Tooltip :title="item.label">
                <Button
                  html-type="button"
                  :class="buttonClass(item.isActive())"
                  :disabled="isToolbarItemDisabled(item)"
                  :loading="isUploading"
                  :aria-label="item.label"
                  :aria-pressed="item.isActive()"
                  size="small"
                  :type="item.isActive() ? 'primary' : 'default'"
                >
                  <span
                    :class="cn('size-4', item.icon)"
                    aria-hidden="true"
                  ></span>
                </Button>
              </Tooltip>
            </Upload>
            <ColorPicker
              v-else-if="item.key === 'textColor'"
              :value="currentTextColor || '#1677ff'"
              allow-clear
              disabled-alpha
              disabled-format
              :disabled="isToolbarItemDisabled(item)"
              size="small"
              @change="setTextColor"
              @clear="unsetTextColor"
            >
              <Tooltip :title="item.label">
                <Button
                  html-type="button"
                  :class="
                    cn(buttonClass(item.isActive()), 'relative overflow-hidden')
                  "
                  :disabled="isToolbarItemDisabled(item)"
                  :aria-label="item.label"
                  :aria-pressed="item.isActive()"
                  size="small"
                  type="default"
                >
                  <span
                    :class="cn('size-4', item.icon)"
                    aria-hidden="true"
                  ></span>
                  <span
                    v-if="currentTextColor"
                    class="absolute inset-x-1 bottom-1 h-0.5 rounded-full"
                    :style="{ backgroundColor: currentTextColor }"
                    aria-hidden="true"
                  ></span>
                </Button>
              </Tooltip>
            </ColorPicker>
            <Tooltip v-else :title="item.label">
              <Button
                html-type="button"
                :class="buttonClass(item.isActive())"
                :disabled="isToolbarItemDisabled(item)"
                :aria-label="item.label"
                :aria-pressed="item.isActive()"
                size="small"
                :type="item.isActive() ? 'primary' : 'default'"
                @click="item.action"
              >
                <span
                  :class="cn('size-4', item.icon)"
                  aria-hidden="true"
                ></span>
              </Button>
            </Tooltip>
          </template>
        </template>
      </div>
    </NoFormStyle>

    <Spin :spinning="isUploading" tip="图片上传中...">
      <EditorContent
        v-if="editor"
        :editor="editor"
        :class="editorContentClass"
      />
    </Spin>
  </div>
</template>
