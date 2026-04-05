<script setup lang="ts">
import { ref } from 'vue'
import SidebarMenu from '@/components/layout/SidebarMenu.vue'
import TopHeader from '@/components/layout/TopHeader.vue'

const collapsed = ref(false)
</script>

<template>
  <div class="layout">
    <SidebarMenu v-model:collapsed="collapsed" />

    <main class="layout__body" :class="{ 'layout__body--collapsed': collapsed }">
      <TopHeader />
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
$sider-width: 240px;
$sider-collapsed-width: 48px;
$transition: 0.25s ease;

.layout {
  display: flex;
  min-height: 100vh;

  &__body {
    flex: 1;
    margin-left: $sider-width;
    transition: margin-left $transition;
    min-height: 100vh;

    &--collapsed {
      margin-left: $sider-collapsed-width;
    }
  }

  @media (max-width: 768px) {
    &__body {
      margin-left: $sider-collapsed-width;
    }
  }
}
</style>
