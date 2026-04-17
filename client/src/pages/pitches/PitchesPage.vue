<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { apiGetComplexes, type Complex } from '@/api/complexes'
import {
  apiGetPitches,
  apiCreatePitch,
  apiUpdatePitch,
  apiDeletePitch,
  type Pitch,
  type PitchType,
  type ParkingType,
  type CreatePitchDto,
  type UpdatePitchDto,
} from '@/api/pitches'

const route = useRoute()
const router = useRouter()
const complexId = route.params.id as string

const complex = ref<Complex | null>(null)
const pitches = ref<Pitch[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

interface FormState {
  name: string
  type: PitchType
  width: number | null
  length: number | null
  height: number | null
  price_per_hour: number | null
  // секция инфраструктуры
  infrastructure: boolean
  has_locker_room: boolean
  has_shower: boolean
  has_lighting: boolean
  stands_count: number | null
  has_parking: boolean
  parking_type: ParkingType | null
  // время работы
  is_24h: boolean
  open_time: Dayjs | null
  close_time: Dayjs | null
  description: string
  is_active: boolean
  quantity: number
}

const emptyForm = (): FormState => ({
  name: '',
  type: 'open',
  width: null,
  length: null,
  height: null,
  price_per_hour: null,
  infrastructure: false,
  has_locker_room: false,
  has_shower: false,
  has_lighting: false,
  stands_count: null,
  has_parking: false,
  parking_type: null,
  is_24h: true,
  open_time: null,
  close_time: null,
  description: '',
  is_active: false,
  quantity: 1,
})

const form = ref<FormState>(emptyForm())

const previewNames = computed(() => {
  const qty = form.value.quantity
  const base = form.value.name.trim()
  const nextIdx = pitches.value.length + 1

  if (!base) {
    return Array.from({ length: qty }, (_, i) => `Поле №${nextIdx + i}`)
  }
  if (qty > 1) {
    return Array.from({ length: qty }, (_, i) => `${base} №${i + 1}`)
  }
  return []
})

function onInfrastructureToggle(val: boolean) {
  if (!val) {
    form.value.has_locker_room = false
    form.value.has_shower = false
    form.value.has_lighting = false
    form.value.stands_count = null
    form.value.has_parking = false
    form.value.parking_type = null
  }
}

function onParkingChange(val: boolean) {
  if (!val) form.value.parking_type = null
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(p: Pitch) {
  editingId.value = p.id
  const hasInfra =
    p.has_locker_room !== null ||
    p.has_shower !== null ||
    p.has_lighting !== null ||
    p.has_parking !== null ||
    p.stands_count !== null
  form.value = {
    name: p.name,
    type: p.type,
    width: p.width,
    length: p.length,
    height: p.height,
    price_per_hour: Number(p.price_per_hour),
    infrastructure: hasInfra,
    has_locker_room: p.has_locker_room ?? false,
    has_shower: p.has_shower ?? false,
    has_lighting: p.has_lighting ?? false,
    stands_count: p.stands_count,
    has_parking: p.has_parking ?? false,
    parking_type: p.parking_type,
    is_24h: p.is_24h,
    open_time: p.open_time ? dayjs(p.open_time, 'HH:mm') : null,
    close_time: p.close_time ? dayjs(p.close_time, 'HH:mm') : null,
    description: p.description ?? '',
    is_active: p.is_active,
  }
  modalOpen.value = true
}

function isValid(): boolean {
  if (!form.value.width || form.value.width <= 0) {
    message.warning('Введите корректную ширину')
    return false
  }
  if (!form.value.length || form.value.length <= 0) {
    message.warning('Введите корректную длину')
    return false
  }
  if (form.value.price_per_hour === null || form.value.price_per_hour < 0) {
    message.warning('Введите корректную цену')
    return false
  }
  if (form.value.infrastructure && form.value.has_parking && !form.value.parking_type) {
    message.warning('Укажите тип парковки')
    return false
  }
  if (!form.value.is_24h) {
    if (!form.value.open_time) {
      message.warning('Укажите время открытия')
      return false
    }
    if (!form.value.close_time) {
      message.warning('Укажите время закрытия')
      return false
    }
  }
  return true
}

async function handleSubmit() {
  if (!isValid()) return
  submitting.value = true
  try {
    // если инфраструктура отключена — передаём null
    const infraFields = form.value.infrastructure
      ? {
          has_locker_room: form.value.has_locker_room,
          has_shower: form.value.has_shower,
          has_lighting: form.value.has_lighting,
          stands_count: form.value.stands_count,
          has_parking: form.value.has_parking,
          parking_type: form.value.has_parking ? form.value.parking_type : null,
        }
      : {
          has_locker_room: null,
          has_shower: null,
          has_lighting: null,
          stands_count: null,
          has_parking: null,
          parking_type: null,
        }

    const resolvedName = (idx: number) => {
      const typed = form.value.name.trim()
      const qty = form.value.quantity
      if (!typed) return `Поле №${pitches.value.length + 1 + idx}`
      return qty > 1 ? `${typed} №${idx + 1}` : typed
    }

    const base: CreatePitchDto = {
      name: resolvedName(0),
      type: form.value.type,
      width: form.value.width!,
      length: form.value.length!,
      height: form.value.height,
      price_per_hour: form.value.price_per_hour!,
      is_24h: form.value.is_24h,
      open_time: form.value.is_24h ? null : (form.value.open_time?.format('HH:mm') ?? null),
      close_time: form.value.is_24h ? null : (form.value.close_time?.format('HH:mm') ?? null),
      description: form.value.description || undefined,
      ...infraFields,
    }

    if (editingId.value) {
      const dto: UpdatePitchDto = { ...base, is_active: form.value.is_active }
      const updated = await apiUpdatePitch(complexId, editingId.value, dto)
      const idx = pitches.value.findIndex((p) => p.id === editingId.value)
      if (idx !== -1) pitches.value[idx] = updated
      message.success('Поле обновлено')
    } else {
      const qty = form.value.quantity
      if (qty > 1) {
        const results = await Promise.all(
          Array.from({ length: qty }, (_, i) =>
            apiCreatePitch(complexId, { ...base, name: resolvedName(i) }),
          ),
        )
        pitches.value.push(...results)
        message.success(`Добавлено ${qty} полей`)
      } else {
        const created = await apiCreatePitch(complexId, base)
        pitches.value.push(created)
        message.success('Поле добавлено')
      }
    }
    modalOpen.value = false
  } catch {
    message.error('Произошла ошибка. Попробуйте снова.')
  } finally {
    submitting.value = false
  }
}

const deleteModalOpen = ref(false)
const deletingPitch = ref<Pitch | null>(null)
const deleting = ref(false)

function openDeleteModal(p: Pitch) {
  deletingPitch.value = p
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!deletingPitch.value) return
  deleting.value = true
  try {
    await apiDeletePitch(complexId, deletingPitch.value.id)
    pitches.value = pitches.value.filter((p) => p.id !== deletingPitch.value!.id)
    deleteModalOpen.value = false
    message.success('Поле удалено')
  } catch {
    message.error('Не удалось удалить поле')
  } finally {
    deleting.value = false
  }
}

const pitchTypeLabel = (t: PitchType) => {
  if (t === 'open') return 'Открытое'
  if (t === 'covered') return 'Крытое'
  return 'Футзал'
}

const amenityList = (p: Pitch) => {
  const list: string[] = []
  if (p.has_locker_room === true) list.push('Раздевалка')
  if (p.has_shower === true) list.push('Душ')
  if (p.has_lighting === true) list.push('Освещение')
  if (p.has_parking === true)
    list.push(p.parking_type === 'paid' ? 'Парковка (платная)' : 'Парковка (бесплатная)')
  return list
}

onMounted(async () => {
  try {
    const [list, pitchList] = await Promise.all([apiGetComplexes(), apiGetPitches(complexId)])
    complex.value = list.find((c) => c.id === complexId) ?? null
    if (!complex.value) {
      message.error('Комплекс не найден')
      router.push({ name: 'complexes' })
      return
    }
    pitches.value = pitchList
  } catch {
    message.error('Не удалось загрузить данные')
    router.push({ name: 'complexes' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="pitches-page">
    <div class="pitches-page__inner">
      <div class="pitches-page__head">
        <a-button
          type="text"
          class="pitches-page__back"
          @click="router.push({ name: 'complexes' })"
        >
          <template #icon><ArrowLeftOutlined /></template>
          Назад к комплексам
        </a-button>
      </div>

      <a-spin :spinning="loading">
        <template v-if="complex">
          <div class="pitches-page__title-bar">
            <div>
              <div class="pitches-page__title-row">
                <h1 class="pitches-page__title">{{ complex.name }}</h1>
                <a-tag :color="complex.is_active ? 'green' : 'default'">
                  {{ complex.is_active ? 'Активен' : 'Неактивен' }}
                </a-tag>
              </div>
              <p class="pitches-page__address">{{ complex.address }}</p>
            </div>
            <a-button type="primary" @click="openCreate">
              <template #icon><PlusOutlined /></template>
              Добавить поле
            </a-button>
          </div>

          <div v-if="pitches.length" class="pitches-page__grid">
            <div v-for="p in pitches" :key="p.id" class="pitch-card">
              <div class="pitch-card__header">
                <div class="pitch-card__title-row">
                  <span class="pitch-card__name">{{ p.name }}</span>
                  <a-tag :bordered="false" color="blue">{{ pitchTypeLabel(p.type) }}</a-tag>
                </div>
                <div class="pitch-card__header-right">
                  <a-tag :color="p.is_active ? 'green' : 'default'">
                    {{ p.is_active ? 'Активно' : 'Неактивно' }}
                  </a-tag>
                  <a-button type="text" size="small" @click="openEdit(p)">
                    <template #icon><EditOutlined /></template>
                  </a-button>
                  <a-button type="text" size="small" danger @click="openDeleteModal(p)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
              </div>

              <div class="pitch-card__stats">
                <div class="pitch-card__stat">
                  <span class="pitch-card__stat-label">Размер</span>
                  <span class="pitch-card__stat-value">
                    {{ p.width }} × {{ p.length }}{{ p.height ? ` × ${p.height}` : '' }} м
                  </span>
                </div>
                <div class="pitch-card__stat">
                  <span class="pitch-card__stat-label">Цена/час</span>
                  <span class="pitch-card__stat-value pitch-card__price"
                    >{{ p.price_per_hour }} сом</span
                  >
                </div>
                <div v-if="p.stands_count" class="pitch-card__stat">
                  <span class="pitch-card__stat-label">Трибуны</span>
                  <span class="pitch-card__stat-value">{{ p.stands_count }} мест</span>
                </div>
                <div class="pitch-card__stat">
                  <span class="pitch-card__stat-label">Время</span>
                  <span class="pitch-card__stat-value">
                    {{ p.is_24h ? 'Круглосуточно' : `${p.open_time} – ${p.close_time}` }}
                  </span>
                </div>
              </div>

              <div v-if="amenityList(p).length" class="pitch-card__amenities">
                <a-tag
                  v-for="a in amenityList(p)"
                  :key="a"
                  :bordered="false"
                  class="pitch-card__amenity"
                  >{{ a }}</a-tag
                >
              </div>

              <p v-if="p.description" class="pitch-card__desc">{{ p.description }}</p>
            </div>
          </div>

          <div v-else class="pitches-page__empty">
            <a-empty description="Поля пока не добавлены" />
          </div>
        </template>
      </a-spin>
    </div>

    <!-- Modal -->
    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? 'Изменить поле' : 'Добавить поле'"
      :confirm-loading="submitting"
      ok-text="Сохранить"
      cancel-text="Отмена"
      width="560px"
      @ok="handleSubmit"
    >
      <div class="modal-form">
        <div class="modal-form__row modal-form__row--name">
          <div class="modal-form__field">
            <label class="modal-form__label">Название</label>
            <a-input v-model:value="form.name" placeholder="Авто (Поле №N)" />
          </div>
          <div v-if="!editingId" class="modal-form__field modal-form__field--qty">
            <label class="modal-form__label">Количество</label>
            <a-input-number
              v-model:value="form.quantity"
              :min="1"
              :max="20"
              style="width: 100%"
            />
          </div>
        </div>

        <div v-if="previewNames.length" class="modal-form__preview">
          <span class="modal-form__preview-label">Будут созданы:</span>
          <span class="modal-form__preview-names">{{ previewNames.join(', ') }}</span>
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Тип поля <span class="req">*</span></label>
          <a-radio-group
            v-model:value="form.type"
            button-style="solid"
            class="modal-form__type-group"
          >
            <a-radio-button value="open">Открытое</a-radio-button>
            <a-radio-button value="covered">Крытое</a-radio-button>
            <a-radio-button value="futsal">Футзал</a-radio-button>
          </a-radio-group>
        </div>

        <div class="modal-form__row">
          <div class="modal-form__field">
            <label class="modal-form__label">Ширина (м) <span class="req">*</span></label>
            <a-input-number
              v-model:value="form.width"
              :min="1"
              placeholder="40"
              style="width: 100%"
            />
          </div>
          <div class="modal-form__field">
            <label class="modal-form__label">Длина (м) <span class="req">*</span></label>
            <a-input-number
              v-model:value="form.length"
              :min="1"
              placeholder="80"
              style="width: 100%"
            />
          </div>
          <div class="modal-form__field">
            <label class="modal-form__label">Высота (м)</label>
            <a-input-number
              v-model:value="form.height"
              :min="1"
              placeholder="—"
              style="width: 100%"
            />
          </div>
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Цена за час (сом) <span class="req">*</span></label>
          <a-input-number
            v-model:value="form.price_per_hour"
            :min="0"
            placeholder="500"
            style="width: 100%"
          />
        </div>

        <!-- Инфраструктура — заголовок с переключателем -->
        <div class="modal-form__section-header">
          <span class="modal-form__section-title">Инфраструктура</span>
          <a-switch v-model:checked="form.infrastructure" @change="onInfrastructureToggle" />
        </div>

        <!-- Поля инфраструктуры — только если включено -->
        <template v-if="form.infrastructure">
          <div class="modal-form__infra">
            <div class="modal-form__infra-row">
              <span class="modal-form__infra-label">Раздевалка</span>
              <a-switch v-model:checked="form.has_locker_room" />
            </div>
            <div class="modal-form__infra-row">
              <span class="modal-form__infra-label">Душ</span>
              <a-switch v-model:checked="form.has_shower" />
            </div>
            <div class="modal-form__infra-row">
              <span class="modal-form__infra-label">Освещение</span>
              <a-switch v-model:checked="form.has_lighting" />
            </div>
            <div class="modal-form__infra-row">
              <span class="modal-form__infra-label">Трибуны (мест)</span>
              <a-input-number
                v-model:value="form.stands_count"
                :min="0"
                placeholder="—"
                style="width: 120px"
              />
            </div>
            <div class="modal-form__infra-row">
              <span class="modal-form__infra-label">Парковка</span>
              <a-switch v-model:checked="form.has_parking" @change="onParkingChange" />
            </div>
            <div v-if="form.has_parking" class="modal-form__infra-row modal-form__infra-row--sub">
              <span class="modal-form__infra-label">Тип парковки <span class="req">*</span></span>
              <a-radio-group v-model:value="form.parking_type" button-style="solid" size="small">
                <a-radio-button value="free">Бесплатная</a-radio-button>
                <a-radio-button value="paid">Платная</a-radio-button>
              </a-radio-group>
            </div>
          </div>
        </template>

        <!-- Время работы -->
        <div class="modal-form__section-header">
          <span class="modal-form__section-title">Время работы</span>
          <div class="modal-form__hours-toggle">
            <span class="modal-form__hours-label">Круглосуточно</span>
            <a-switch v-model:checked="form.is_24h" />
          </div>
        </div>

        <template v-if="!form.is_24h">
          <div class="modal-form__row modal-form__row--2">
            <div class="modal-form__field">
              <label class="modal-form__label">С <span class="req">*</span></label>
              <a-time-picker
                v-model:value="form.open_time"
                format="HH:mm"
                :minute-step="5"
                placeholder="08:00"
                style="width: 100%"
              />
            </div>
            <div class="modal-form__field">
              <label class="modal-form__label">До <span class="req">*</span></label>
              <a-time-picker
                v-model:value="form.close_time"
                format="HH:mm"
                :minute-step="5"
                placeholder="23:00"
                style="width: 100%"
              />
            </div>
          </div>
        </template>

        <div class="modal-form__field">
          <label class="modal-form__label">Описание</label>
          <a-textarea
            v-model:value="form.description"
            placeholder="Дополнительная информация"
            :rows="3"
          />
        </div>

        <div class="modal-form__standalone-switch">
          <label class="modal-form__label" style="margin: 0">Активно</label>
          <a-switch v-model:checked="form.is_active" />
        </div>
      </div>
    </a-modal>

    <!-- Модалка удаления -->
    <a-modal
      v-model:open="deleteModalOpen"
      title="Удалить поле"
      :confirm-loading="deleting"
      ok-text="Удалить"
      cancel-text="Отмена"
      ok-type="danger"
      @ok="confirmDelete"
    >
      <p class="delete-confirm">
        Вы уверены, что хотите удалить поле
        <strong>{{ deletingPitch?.name }}</strong
        >? Это действие нельзя отменить.
      </p>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.pitches-page {
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

  &__title-bar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
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

.pitch-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

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
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  &__stats {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__stat-label {
    font-size: 11px;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__stat-value {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  &__price {
    color: #1677ff;
  }

  &__amenities {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__amenity {
    font-size: 12px;
    background: rgba(0, 0, 0, 0.04);
    color: $text-secondary;
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.5;
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: $text-primary;
  }

  &__row--name {
    display: grid;
    grid-template-columns: 1fr 100px;
    gap: 12px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr 80px;
    }
  }

  &__preview {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(22, 119, 255, 0.06);
    border-radius: 6px;
    font-size: 13px;
  }

  &__preview-label {
    color: $text-secondary;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__preview-names {
    color: #1677ff;
    font-weight: 500;
    word-break: break-word;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    @media (max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);

      // Высота (третий элемент) занимает полную ширину
      .modal-form__field:last-child {
        grid-column: 1 / -1;
      }
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
  }

  &__section-title {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
  }

  &__hours-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__hours-label {
    font-size: 13px;
    color: $text-secondary;
  }

  &__row--2 {
    grid-template-columns: 1fr 1fr;

    @media (max-width: 480px) {
      grid-template-columns: 1fr 1fr;

      .modal-form__field:last-child {
        grid-column: auto;
      }
    }
  }

  &__infra {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
  }

  &__infra-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    &--sub {
      padding-left: 16px;
      border-left: 2px solid rgba(0, 0, 0, 0.1);
    }
  }

  &__infra-label {
    font-size: 14px;
    color: $text-primary;
  }

  &__standalone-switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 4px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  &__type-group {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;

    :deep(.ant-radio-button-wrapper) {
      flex: 1;
      text-align: center;
      padding-inline: 8px;
    }

    @media (max-width: 400px) {
      flex-wrap: wrap;

      :deep(.ant-radio-button-wrapper) {
        flex: 1 1 auto;
      }
    }
  }
}

.req {
  color: #ff4d4f;
}

.delete-confirm {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}
</style>

<style>
@media (max-width: 600px) {
  .ant-modal {
    max-width: calc(100vw - 24px) !important;
    margin: 12px auto !important;
  }
  .ant-modal-content {
    padding: 16px !important;
  }
}
</style>
