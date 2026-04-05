<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button, Result } from 'ant-design-vue'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <Result status="404" title="404" sub-title="Страница не найдена">
      <template #extra>
        <Button type="primary" @click="router.push({ name: 'home' })">На главную</Button>
      </template>
    </Result>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
