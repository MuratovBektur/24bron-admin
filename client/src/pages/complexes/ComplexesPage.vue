<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import {
  apiGetComplexes,
  apiCreateComplex,
  type Complex,
  type CreateComplexDto,
} from '@/api/complexes'

const complexes = ref<Complex[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const submitting = ref(false)

const form = ref<CreateComplexDto>({
  name: '',
  address: '',
  phone: '',
  description: '',
})

async function loadComplexes() {
  loading.value = true
  try {
    complexes.value = await apiGetComplexes()
  } catch {
    message.error('Не удалось загрузить комплексы')
  } finally {
    loading.value = false
  }
}

function openModal() {
  form.value = { name: '', address: '', phone: '', description: '' }
  modalOpen.value = true
}

async function handleSubmit() {
  if (!form.value.name.trim() || !form.value.address.trim()) {
    message.warning('Заполните обязательные поля')
    return
  }
  submitting.value = true
  try {
    const created = await apiCreateComplex(form.value)
    complexes.value.unshift(created)
    modalOpen.value = false
    message.success('Комплекс успешно создан')
  } catch {
    message.error('Не удалось создать комплекс')
  } finally {
    submitting.value = false
  }
}

onMounted(loadComplexes)
</script>

<template>
  <div class="complexes">
    <div class="complexes__inner">
      <div class="complexes__head">
        <h1 class="complexes__title">Комплексы</h1>
        <a-button type="primary" @click="openModal">
          <template #icon><PlusOutlined /></template>
          Добавить комплекс
        </a-button>
      </div>

      <a-spin :spinning="loading">
        <div v-if="complexes.length" class="complexes__grid">
          <div v-for="c in complexes" :key="c.id" class="complex-card">
            <div class="complex-card__header">
              <span class="complex-card__name">{{ c.name }}</span>
              <a-tag :color="c.is_active ? 'green' : 'default'">
                {{ c.is_active ? 'Активен' : 'Неактивен' }}
              </a-tag>
            </div>
            <div class="complex-card__info">
              <div class="complex-card__row">
                <EnvironmentOutlined class="complex-card__icon" />
                <span>{{ c.address }}</span>
              </div>
              <div v-if="c.phone" class="complex-card__row">
                <PhoneOutlined class="complex-card__icon" />
                <span>{{ c.phone }}</span>
              </div>
              <p v-if="c.description" class="complex-card__desc">{{ c.description }}</p>
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="complexes__empty">
          <a-empty description="Комплексы пока не добавлены" />
        </div>
      </a-spin>
    </div>

    <a-modal
      v-model:open="modalOpen"
      title="Добавить комплекс"
      :confirm-loading="submitting"
      ok-text="Создать"
      cancel-text="Отмена"
      @ok="handleSubmit"
    >
      <div class="modal-form">
        <div class="modal-form__field">
          <label class="modal-form__label">Название <span class="req">*</span></label>
          <a-input v-model:value="form.name" placeholder="Введите название" />
        </div>
        <div class="modal-form__field">
          <label class="modal-form__label">Адрес <span class="req">*</span></label>
          <a-input v-model:value="form.address" placeholder="Введите адрес" />
        </div>
        <div class="modal-form__field">
          <label class="modal-form__label">Телефон</label>
          <a-input v-model:value="form.phone" placeholder="+996 XXX XXX XXX" />
        </div>
        <div class="modal-form__field">
          <label class="modal-form__label">Описание</label>
          <a-textarea v-model:value="form.description" placeholder="Введите описание" :rows="3" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.complexes {
  background: $bg-body;
  min-height: calc(100vh - 56px);
  padding: 32px 24px;

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
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

.complex-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $text-secondary;
    font-size: 14px;
  }

  &__icon {
    flex-shrink: 0;
    color: $text-secondary;
  }

  &__desc {
    margin: 4px 0 0;
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.5;
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: $text-primary;
  }
}

.req {
  color: #ff4d4f;
}
</style>
