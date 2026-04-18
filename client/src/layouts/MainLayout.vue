<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import SidebarMenu from '@/components/layout/SidebarMenu.vue'
import TopHeader from '@/components/layout/TopHeader.vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'

const isMobile = useMediaQuery('(max-width: 768px)')
const collapsed = ref(isMobile.value)

watch(isMobile, (mobile) => {
  collapsed.value = mobile
})
</script>

<template>
  <div class="layout">
    <SidebarMenu v-model:collapsed="collapsed" />

    <Transition name="fade">
      <div v-if="isMobile && !collapsed" class="layout__overlay" @click="collapsed = true" />
    </Transition>

    <main
      class="layout__body"
      :class="{
        'layout__body--collapsed': collapsed,
        'layout__body--mobile': isMobile,
      }"
    >
      <TopHeader />
      <RouterView />
    </main>
  </div>

  <ChangePasswordModal />
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

    &--mobile {
      margin-left: $sider-collapsed-width !important;
    }
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 199;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
