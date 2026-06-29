<script setup lang="ts">
import { Page } from '@/components';

import AuthUserPanel from '../role-assign/index.vue';
import RolePanel from './role.vue';
</script>

<template>
  <Page
    :auto-content-height="true"
    content-class="flex flex-col lg:flex-row gap-2"
  >
    <RolePanel class="flex-4/7 overflow-hidden" />
    <AuthUserPanel class="flex-3/7 overflow-hidden" />
  </Page>
</template>
