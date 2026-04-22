<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  PlusOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  EditOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
import { message } from 'ant-design-vue'
import {
  apiGetComplexes,
  apiCreateComplex,
  apiUpdateComplex,
  type Complex,
  type CreateComplexDto,
  type UpdateComplexDto,
} from '@/api/complexes'

const MAP_LINK_PREFIX = 'https://go.2gis.com/'

const complexes = ref<Complex[]>([])
const loading = ref(false)

// — modal state
const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

interface FormState {
  name: string
  address: string
  map_link: string
  phone: string
  description: string
  is_active: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  address: '',
  map_link: '',
  phone: '',
  description: '',
  is_active: false,
})

const form = ref<FormState>(emptyForm())
const mapLinkError = ref('')

function validateMapLink(value: string): boolean {
  if (!value.trim()) {
    mapLinkError.value = 'Обязательное поле'
    return false
  }
  if (!value.startsWith(MAP_LINK_PREFIX)) {
    mapLinkError.value = `Ссылка должна начинаться с ${MAP_LINK_PREFIX}`
    return false
  }
  mapLinkError.value = ''
  return true
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  mapLinkError.value = ''
  modalOpen.value = true
}

function openEdit(c: Complex) {
  editingId.value = c.id
  form.value = {
    name: c.name,
    address: c.address,
    map_link: c.map_link,
    phone: c.phone ?? '',
    description: c.description ?? '',
    is_active: c.is_active,
  }
  mapLinkError.value = ''
  modalOpen.value = true
}

async function handleSubmit() {
  if (!form.value.name.trim() || !form.value.address.trim()) {
    message.warning('Заполните обязательные поля')
    return
  }
  if (!validateMapLink(form.value.map_link)) return

  submitting.value = true
  try {
    if (editingId.value) {
      const dto: UpdateComplexDto = {
        name: form.value.name,
        address: form.value.address,
        map_link: form.value.map_link,
        phone: form.value.phone || undefined,
        description: form.value.description || undefined,
        is_active: form.value.is_active,
      }
      const updated = await apiUpdateComplex(editingId.value, dto)
      const idx = complexes.value.findIndex((c) => c.id === editingId.value)
      if (idx !== -1) complexes.value[idx] = updated
      message.success('Комплекс успешно обновлён')
    } else {
      const dto: CreateComplexDto = {
        name: form.value.name,
        address: form.value.address,
        map_link: form.value.map_link,
        phone: form.value.phone || undefined,
        description: form.value.description || undefined,
      }
      const created = await apiCreateComplex(dto)
      complexes.value.unshift(created)
      message.success('Комплекс успешно создан')
    }
    modalOpen.value = false
  } catch {
    message.error('Произошла ошибка. Проверьте данные и попробуйте снова.')
  } finally {
    submitting.value = false
  }
}

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

onMounted(loadComplexes)
</script>

<template>
  <div class="complexes">
    <div class="complexes__inner">
      <div class="complexes__head">
        <h1 class="complexes__title">Комплексы</h1>
        <a-button type="primary" @click="openCreate">
          <template #icon><PlusOutlined /></template>
          Добавить комплекс
        </a-button>
      </div>

      <a-spin :spinning="loading">
        <div v-if="complexes.length" class="complexes__grid">
          <div
            v-for="c in complexes"
            :key="c.id"
            class="complex-card"
            @click="router.push({ name: 'complex-pitches', params: { id: c.id } })"
          >
            <div class="complex-card__header">
              <div class="complex-card__title-row">
                <span class="complex-card__name">{{ c.name }}</span>
                <a-tag :color="c.is_active ? 'green' : 'default'">
                  {{ c.is_active ? 'Активен' : 'Неактивен' }}
                </a-tag>
              </div>
              <a-button
                type="text"
                size="small"
                class="complex-card__edit"
                @click.stop="openEdit(c)"
              >
                <template #icon><EditOutlined /></template>
              </a-button>
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
              <div class="complex-card__row">
                <LinkOutlined class="complex-card__icon" />
                <a
                  :href="c.map_link"
                  target="_blank"
                  rel="noopener"
                  class="complex-card__link"
                  @click.stop
                >
                  2ГИС
                </a>
              </div>
              <p v-if="c.description" class="complex-card__desc">{{ c.description }}</p>
            </div>
            <div class="complex-card__footer">
              <span class="complex-card__hint">Перейти к полям</span>
              <RightOutlined class="complex-card__arrow" />
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
      :title="editingId ? 'Изменить комплекс' : 'Добавить комплекс'"
      :confirm-loading="submitting"
      ok-text="Сохранить"
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
          <label class="modal-form__label">Ссылка на 2ГИС <span class="req">*</span></label>
          <a-input
            v-model:value="form.map_link"
            placeholder="https://go.2gis.com/..."
            :status="mapLinkError ? 'error' : ''"
            @blur="validateMapLink(form.map_link)"
            @input="mapLinkError = ''"
          />
          <span v-if="mapLinkError" class="modal-form__error">{{ mapLinkError }}</span>
        </div>
        <div class="modal-form__field">
          <label class="modal-form__label">Телефон</label>
          <a-input v-model:value="form.phone" placeholder="+996 XXX XXX XXX" />
        </div>
        <div class="modal-form__field">
          <label class="modal-form__label">Описание</label>
          <a-textarea v-model:value="form.description" placeholder="Введите описание" :rows="3" />
        </div>
        <div class="modal-form__field modal-form__field--row">
          <label class="modal-form__label">Активен</label>
          <a-switch v-model:checked="form.is_active" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.15s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  &__edit {
    flex-shrink: 0;
    color: $text-secondary;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
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

  &__link {
    color: #1677ff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.5;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    margin-top: 4px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-top: 10px;
  }

  &__hint {
    font-size: 12px;
    color: $text-secondary;
  }

  &__arrow {
    font-size: 11px;
    color: $text-secondary;
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

  &__error {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: #ff4d4f;
  }

  &__field--row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .modal-form__label {
      margin-bottom: 0;
    }
  }
}

.req {
  color: #ff4d4f;
}
</style>
