<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { apiGetComplexes, type Complex } from '@/api/complexes'
import { message } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()

const complexId = route.params.id as string
const complex = ref<Complex | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const list = await apiGetComplexes()
    complex.value = list.find((c) => c.id === complexId) ?? null
    if (!complex.value) {
      message.error('Комплекс не найден')
      router.push({ name: 'complexes' })
    }
  } catch {
    message.error('Не удалось загрузить данные')
    router.push({ name: 'complexes' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="pitches">
    <div class="pitches__inner">
      <div class="pitches__head">
        <a-button type="text" class="pitches__back" @click="router.push({ name: 'complexes' })">
          <template #icon><ArrowLeftOutlined /></template>
          Назад к комплексам
        </a-button>
      </div>

      <a-spin :spinning="loading">
        <template v-if="complex">
          <div class="pitches__title-row">
            <h1 class="pitches__title">{{ complex.name }}</h1>
            <a-tag :color="complex.is_active ? 'green' : 'default'">
              {{ complex.is_active ? 'Активен' : 'Неактивен' }}
            </a-tag>
          </div>
          <p class="pitches__address">{{ complex.address }}</p>

          <div class="pitches__empty">
            <a-empty description="Поля пока не добавлены" />
          </div>
        </template>
      </a-spin>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.pitches {
  background: $bg-body;
  min-height: calc(100vh - 56px);
  padding: 32px 24px;

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__head {
    margin-bottom: 20px;
  }

  &__back {
    color: $text-secondary;
    padding-left: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  &__address {
    font-size: 14px;
    color: $text-secondary;
    margin: 0 0 24px;
  }

  &__empty {
    background: $bg-card;
    border-radius: $radius-lg;
    box-shadow: $shadow-card;
    padding: 64px 24px;
    display: flex;
    justify-content: center;
  }
}
</style>
