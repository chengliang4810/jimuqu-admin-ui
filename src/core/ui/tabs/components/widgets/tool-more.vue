<script lang="ts" setup>
import type { DropdownMenuProps } from '@/core/ui/adapter';

import { LayoutGrid } from '@/core/icons';
import { VbenDropdownMenu } from '@/core/ui/adapter';

defineProps<DropdownMenuProps>();
</script>

<template>
  <VbenDropdownMenu :menus="menus" :modal="false">
    <div
      class="flex-center border-border text-muted-foreground hover:bg-muted hover:text-foreground h-full cursor-pointer border-l px-2 text-lg font-semibold"
    >
      <LayoutGrid class="size-4" />
    </div>
  </VbenDropdownMenu>
</template>
