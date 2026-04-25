<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useMediaQuery } from '@vueuse/core'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { apiGetPitchById, type Pitch } from '@/api/pitches'
import {
  apiGetBookings,
  apiCreateBooking,
  apiUpdateBooking,
  apiDeleteBooking,
  type Booking,
  type BookingStatus,
} from '@/api/bookings'

dayjs.locale('ru')

const route = useRoute()
const router = useRouter()
const pitchId = route.params.pitchId as string

const pitch = ref<(Pitch & { complex: { id: string; name: string } }) | null>(null)
const loading = ref(true)
const loadingBookings = ref(false)

// ─── Day window ────────────────────────────────────────────────────
const today = dayjs().startOf('day')

const isXs = useMediaQuery('(max-width: 479px)')
const isSm = useMediaQuery('(max-width: 639px)')
const isMd = useMediaQuery('(max-width: 899px)')
const isLg = useMediaQuery('(max-width: 1099px)')

const visibleDaysCount = computed(() => {
  if (isXs.value) return 1
  if (isSm.value) return 2
  if (isMd.value) return 3
  if (isLg.value) return 5
  return 7
})

function anchoredDate(count: number): Dayjs {
  // 1 день  → сегодня
  // 2 дня   → сегодня, завтра
  // 3+ дней → вчера, сегодня, завтра, ...
  const offset = count >= 3 ? 1 : 0
  return today.subtract(offset, 'day')
}

const windowDate = ref(anchoredDate(visibleDaysCount.value))

const displayedDays = computed(() =>
  Array.from({ length: visibleDaysCount.value }, (_, i) => windowDate.value.add(i, 'day')),
)

const windowLabel = computed(() => {
  const count = visibleDaysCount.value
  const first = displayedDays.value[0]!
  const last = displayedDays.value[count - 1]!
  if (count === 1) return first.format('dddd, D MMMM YYYY')
  if (first.month() === last.month()) return `${first.format('D')} – ${last.format('D MMMM YYYY')}`
  return `${first.format('D MMM')} – ${last.format('D MMM YYYY')}`
})

watch(visibleDaysCount, (count) => {
  windowDate.value = anchoredDate(count)
})

function prevWindow() {
  windowDate.value = windowDate.value.subtract(1, 'day')
}

function nextWindow() {
  windowDate.value = windowDate.value.add(1, 'day')
}

// ─── Working hours ────────────────────────────────────────────────
const startHour = computed(() => {
  if (!pitch.value || pitch.value.is_24h) return 0
  return parseInt(pitch.value.open_time?.split(':')[0] ?? '0')
})

const endHour = computed(() => {
  if (!pitch.value || pitch.value.is_24h) return 24
  const parts = pitch.value.close_time?.split(':') ?? ['23', '0']
  const h = parseInt(parts[0] ?? '23')
  const m = parseInt(parts[1] ?? '0')
  let end = m > 0 ? h + 1 : h
  if (end <= startHour.value) end += 24 // crosses midnight
  return end
})

const hours = computed(() =>
  Array.from({ length: endHour.value - startHour.value }, (_, i) => startHour.value + i),
)

function hourLabel(h: number): string {
  const from = String(h % 24).padStart(2, '0') + ':00'
  const to = String((h + 1) % 24).padStart(2, '0') + ':00'
  return `${from} – ${to}`
}

// ─── Bookings by day ──────────────────────────────────────────────
const bookingsByDay = ref<Record<string, Booking[]>>({})
let pendingTimer: ReturnType<typeof setTimeout> | null = null

function schedulePendingRefresh(map: Record<string, Booking[]>) {
  if (pendingTimer !== null) clearTimeout(pendingTimer)
  const now = Date.now()
  let nearest = Infinity
  for (const bookings of Object.values(map)) {
    for (const b of bookings) {
      if (b.status === 'pending' && b.pending_until) {
        const ms = new Date(b.pending_until).getTime() - now
        if (ms > 0 && ms < nearest) nearest = ms
      }
    }
  }
  if (nearest < Infinity) {
    pendingTimer = setTimeout(() => refreshDisplayed(), nearest + 500)
  }
}

const loadedDates = new Set<string>()

async function ensureDaysLoaded(dates: string[]) {
  const missing = dates.filter((d) => !loadedDates.has(d))
  if (!missing.length) return
  loadingBookings.value = true
  try {
    const results = await Promise.all(missing.map((d) => apiGetBookings(pitchId, d)))
    const updated = { ...bookingsByDay.value }
    missing.forEach((d, i) => {
      updated[d] = results[i] ?? []
      loadedDates.add(d)
    })
    bookingsByDay.value = updated
    schedulePendingRefresh(bookingsByDay.value)
  } catch {
    message.error('Не удалось загрузить бронирования')
  } finally {
    loadingBookings.value = false
  }
}

async function refreshDisplayed() {
  const shown = displayedDays.value
  const dates = [
    ...shown.map((d) => d.format('YYYY-MM-DD')),
    shown[shown.length - 1]!.add(1, 'day').format('YYYY-MM-DD'),
  ]
  dates.forEach((d) => loadedDates.delete(d))
  await ensureDaysLoaded(dates)
}

watch(
  () => displayedDays.value.map((d) => d.format('YYYY-MM-DD')).join(','),
  async (datesStr) => {
    const dates = datesStr.split(',')
    const extra = displayedDays.value[displayedDays.value.length - 1]!.add(1, 'day').format(
      'YYYY-MM-DD',
    )
    await ensureDaysLoaded([...dates, extra])
  },
  { immediate: true },
)

onUnmounted(() => {
  if (pendingTimer !== null) clearTimeout(pendingTimer)
})

// ─── Grid helpers ─────────────────────────────────────────────────
function getBookingAtHour(day: Dayjs, hour: number): Booking | null {
  // hours >= 24 belong to the next calendar day
  const actualDay = hour >= 24 ? day.add(1, 'day') : day
  const actualHour = hour % 24
  const key = actualDay.format('YYYY-MM-DD')
  const list = bookingsByDay.value[key] ?? []

  // slot covers [actualHour*60, (actualHour+1)*60) minutes from midnight
  const slotStart = actualHour * 60
  const slotEnd = (actualHour + 1) * 60

  return (
    list.find((b) => {
      const s = dayjs(b.start_time)
      const e = dayjs(b.end_time)
      const bStart = s.hour() * 60 + s.minute()
      const bEnd = e.hour() * 60 + e.minute()
      return bStart < slotEnd && bEnd > slotStart
    }) ?? null
  )
}

function getCellStatus(day: Dayjs, hour: number): 'free' | BookingStatus {
  const b = getBookingAtHour(day, hour)
  if (!b) return 'free'
  return b.status
}

function statusLabel(s: BookingStatus): string {
  if (s === 'paid') return 'Полностью оплачено'
  if (s === 'partial') return 'Частично оплачено'
  return 'Ожидание оплаты'
}

function getCellTooltip(day: Dayjs, hour: number): string {
  const b = getBookingAtHour(day, hour)
  if (!b) return ''
  return `${b.client_name} · ${formatTime(b.start_time)}–${formatTime(b.end_time)} · ${b.price} сом · ${statusLabel(b.status)}`
}

// ─── Modal ────────────────────────────────────────────────────────
const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const priceOverride = ref(false)
const customRate = ref<number | null>(null)

interface FormState {
  client_name: string
  client_phone: string
  date: Dayjs
  start_time: Dayjs | null
  end_time: Dayjs | null
  price: number | null
  paid_amount: number | null
  pending_minutes: number | null
  notes: string
}

const emptyForm = (date?: Dayjs, hour?: number): FormState => ({
  client_name: '',
  client_phone: '+996',
  date: date ?? dayjs(),
  start_time: hour !== undefined ? dayjs().hour(hour).minute(0).second(0) : null,
  end_time:
    hour !== undefined
      ? dayjs()
          .hour(hour + 1)
          .minute(0)
          .second(0)
      : null,
  price: null,
  paid_amount: null,
  pending_minutes: 10,
  notes: '',
})

const form = ref<FormState>(emptyForm())

// Auto-computed status from paid_amount vs price
const computedStatus = computed<BookingStatus>(() => {
  const paid = form.value.paid_amount
  const total = form.value.price
  if (paid && paid > 0 && total) return paid >= total ? 'paid' : 'partial'
  return 'pending'
})

const pendingTimerLabel = computed(() => {
  const mins = form.value.pending_minutes
  if (!mins || mins <= 0) return ''
  return `Истечёт через ${mins} мин после сохранения`
})

function recalcPrice() {
  const start = form.value.start_time
  const end = form.value.end_time
  if (!start || !end) return
  const mins = end.diff(start, 'minute')
  if (mins <= 0) return
  const rate = priceOverride.value
    ? (customRate.value ?? Number(pitch.value?.price_per_hour ?? 0))
    : Number(pitch.value?.price_per_hour ?? 0)
  form.value.price = Math.round((mins / 60) * rate)
}

watch([() => form.value.start_time, () => form.value.end_time], recalcPrice)
watch(customRate, recalcPrice)
watch(priceOverride, (on) => {
  if (on) customRate.value = Number(pitch.value?.price_per_hour ?? 0)
  else {
    customRate.value = null
    recalcPrice()
  }
})

function openCreate(day?: Dayjs, hour?: number) {
  editingId.value = null
  priceOverride.value = false
  form.value = emptyForm(day, hour)
  modalOpen.value = true
}

function openEdit(b: Booking) {
  editingId.value = b.id
  priceOverride.value = false
  const start = dayjs(b.start_time)
  const end = dayjs(b.end_time)
  form.value = {
    client_name: b.client_name,
    client_phone: b.client_phone ?? '',
    date: start,
    start_time: start,
    end_time: end,
    price: Number(b.price),
    paid_amount: b.paid_amount !== null ? Number(b.paid_amount) : null,
    pending_minutes: b.pending_until
      ? Math.max(1, dayjs(b.pending_until).diff(dayjs(), 'minute'))
      : 10,
    notes: b.notes ?? '',
  }
  modalOpen.value = true
}

function handleCellClick(day: Dayjs, hour: number) {
  const booking = getBookingAtHour(day, hour)
  if (booking) openEdit(booking)
  else openCreate(day, hour)
}

function isValid(): boolean {
  if (!form.value.client_name.trim()) {
    message.warning('Введите имя клиента')
    return false
  }
  if (!form.value.start_time) {
    message.warning('Укажите время начала')
    return false
  }
  if (!form.value.end_time) {
    message.warning('Укажите время окончания')
    return false
  }
  if (
    form.value.end_time.isBefore(form.value.start_time) ||
    form.value.end_time.isSame(form.value.start_time)
  ) {
    message.warning('Время окончания должно быть позже времени начала')
    return false
  }
  if (form.value.price === null || form.value.price < 0) {
    message.warning('Укажите цену')
    return false
  }
  return true
}

function buildDateTime(date: Dayjs, time: Dayjs): string {
  return date.hour(time.hour()).minute(time.minute()).second(0).millisecond(0).toISOString()
}

async function handleSubmit() {
  if (!isValid()) return
  submitting.value = true
  try {
    const payload = {
      client_name: form.value.client_name,
      client_phone: form.value.client_phone || null,
      start_time: buildDateTime(form.value.date, form.value.start_time!),
      end_time: buildDateTime(form.value.date, form.value.end_time!),
      price: form.value.price!,
      paid_amount: form.value.paid_amount ?? null,
      pending_until:
        form.value.paid_amount && form.value.paid_amount > 0
          ? null
          : form.value.pending_minutes
            ? dayjs().add(form.value.pending_minutes, 'minute').toISOString()
            : null,
      notes: form.value.notes || null,
    }

    if (editingId.value) {
      await apiUpdateBooking(pitchId, editingId.value, payload)
      message.success('Бронирование обновлено')
    } else {
      await apiCreateBooking(pitchId, payload)
      message.success('Бронирование добавлено')
    }
    modalOpen.value = false
    await refreshDisplayed()
  } catch (e: unknown) {
    message.error(extractErrorMessage(e))
  } finally {
    submitting.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────
const deleteModalOpen = ref(false)
const deletingBooking = ref<Booking | null>(null)
const deleting = ref(false)

function openDeleteConfirm() {
  if (!editingId.value) return
  for (const list of Object.values(bookingsByDay.value)) {
    const found = list.find((b) => b.id === editingId.value)
    if (found) {
      deletingBooking.value = found
      deleteModalOpen.value = true
      return
    }
  }
}

async function confirmDelete() {
  if (!deletingBooking.value) return
  deleting.value = true
  try {
    await apiDeleteBooking(pitchId, deletingBooking.value.id)
    deleteModalOpen.value = false
    modalOpen.value = false
    await refreshDisplayed()
    message.success('Бронирование удалено')
  } catch (e: unknown) {
    message.error(extractErrorMessage(e))
  } finally {
    deleting.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
function extractErrorMessage(e: unknown): string {
  const defaultMsg = 'Неизвестная ошибка, попробуйте позже'
  const raw = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  if (Array.isArray(raw)) return raw.join(', ')
  if (raw === 'Internal server error') return defaultMsg
  if (typeof raw === 'string' && raw.trim()) return raw
  return defaultMsg
}

function bookingHash(id: string): string {
  return '#' + id.slice(0, 6).toUpperCase()
}

function pitchTypeLabel(t: string) {
  if (t === 'open') return 'Открытое'
  if (t === 'covered') return 'Крытое'
  return 'Футзал'
}

function formatTime(iso: string) {
  return dayjs(iso).format('HH:mm')
}

onMounted(async () => {
  try {
    pitch.value = await apiGetPitchById(pitchId)
    await refreshDisplayed()
  } catch {
    message.error('Не удалось загрузить данные поля')
    router.push({ name: 'bookings' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="pb-page">
    <div class="pb-page__inner">
      <!-- Back -->
      <div class="pb-page__head">
        <a-button type="text" class="pb-page__back" @click="router.push({ name: 'bookings' })">
          <template #icon><ArrowLeftOutlined /></template>
          Назад
        </a-button>
      </div>

      <a-spin :spinning="loading">
        <template v-if="pitch">
          <!-- Pitch info -->
          <div class="pb-info">
            <div class="pb-info__left">
              <div class="pb-info__title-row">
                <h1 class="pb-info__name">{{ pitch.name }}</h1>
                <a-tag :bordered="false" color="blue">{{ pitchTypeLabel(pitch.type) }}</a-tag>
              </div>
              <p class="pb-info__complex">{{ pitch.complex?.name }}</p>
            </div>
            <div class="pb-info__right">
              <span class="pb-info__price">{{ pitch.price_per_hour }} сом/ч</span>
              <span class="pb-info__hours">
                {{ pitch.is_24h ? 'Круглосуточно' : `${pitch.open_time} – ${pitch.close_time}` }}
              </span>
            </div>
          </div>

          <!-- Navigation -->
          <div class="pb-weekbar">
            <div class="pb-weekbar__nav">
              <a-button type="text" size="small" @click="prevWindow">
                <template #icon><LeftOutlined /></template>
              </a-button>
              <span class="pb-weekbar__label">{{ windowLabel }}</span>
              <a-button type="text" size="small" @click="nextWindow">
                <template #icon><RightOutlined /></template>
              </a-button>
            </div>
            <a-button type="primary" class="pb-weekbar__add-btn" @click="openCreate()">
              <template #icon><PlusOutlined /></template>
              Добавить
            </a-button>
          </div>

          <!-- Legend -->
          <div class="pb-legend">
            <span class="pb-legend__item pb-legend__item--paid">Полностью оплачено</span>
            <span class="pb-legend__item pb-legend__item--partial">Частично оплачено</span>
            <span class="pb-legend__item pb-legend__item--pending">Ожидание оплаты</span>
            <span class="pb-legend__item pb-legend__item--free">Свободно</span>
          </div>

          <!-- Schedule grid -->
          <a-spin :spinning="loadingBookings">
            <div class="sched-wrap">
              <div class="sched" :style="{ '--cols': visibleDaysCount }">
                <!-- Corner -->
                <div class="sched__corner"></div>

                <!-- Day headers -->
                <div
                  v-for="day in displayedDays"
                  :key="day.valueOf()"
                  class="sched__day-head"
                  :class="{
                    'sched__day-head--today': day.isSame(today, 'day'),
                    'sched__day-head--yesterday': day.isSame(today.subtract(1, 'day'), 'day'),
                    'sched__day-head--tomorrow': day.isSame(today.add(1, 'day'), 'day'),
                  }"
                >
                  <span class="sched__weekday">{{ day.format('dd') }}</span>
                  <span class="sched__day-num">{{ day.format('D') }}</span>
                  <span class="sched__month">{{ day.format('MMM') }}</span>
                  <span
                    v-if="day.isSame(today, 'day')"
                    class="sched__day-badge sched__day-badge--today"
                    >сегодня</span
                  >
                  <span
                    v-else-if="day.isSame(today.subtract(1, 'day'), 'day')"
                    class="sched__day-badge sched__day-badge--yesterday"
                    >вчера</span
                  >
                  <span
                    v-else-if="day.isSame(today.add(1, 'day'), 'day')"
                    class="sched__day-badge sched__day-badge--tomorrow"
                    >завтра</span
                  >
                </div>

                <!-- Hour rows -->
                <template v-for="hour in hours" :key="hour">
                  <div class="sched__hour">{{ hourLabel(hour) }}</div>

                  <div
                    v-for="day in displayedDays"
                    :key="day.valueOf()"
                    class="sched__cell"
                    :class="[
                      `sched__cell--${getCellStatus(day, hour)}`,
                      { 'sched__cell--today-col': day.isSame(today, 'day') },
                    ]"
                    :title="getCellTooltip(day, hour)"
                    @click="handleCellClick(day, hour)"
                  >
                    <template v-if="getBookingAtHour(day, hour)">
                      <div class="sched__cell-top">
                        <span class="sched__cell-hash">{{
                          bookingHash(getBookingAtHour(day, hour)!.id)
                        }}</span>
                        <span
                          v-if="getBookingAtHour(day, hour)!.notes"
                          class="sched__cell-note-badge"
                          >заметка</span
                        >
                      </div>
                      <span class="sched__cell-name">
                        {{ getBookingAtHour(day, hour)!.client_name }}
                      </span>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </a-spin>
        </template>
      </a-spin>
    </div>

    <!-- Create / Edit modal -->
    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? 'Изменить бронирование' : 'Новое бронирование'"
      width="480px"
      ok-text="Сохранить"
      cancel-text="Отмена"
      :confirm-loading="submitting"
      @ok="handleSubmit"
    >
      <template #footer>
        <div class="modal-footer">
          <a-button v-if="editingId" danger @click="openDeleteConfirm">
            <template #icon><DeleteOutlined /></template>
            Удалить
          </a-button>
          <div class="modal-footer__right">
            <a-button @click="modalOpen = false">Отмена</a-button>
            <a-button type="primary" :loading="submitting" @click="handleSubmit"
              >Сохранить</a-button
            >
          </div>
        </div>
      </template>

      <div class="modal-form">
        <div class="modal-form__row">
          <div class="modal-form__field">
            <label class="modal-form__label">Клиент <span class="req">*</span></label>
            <a-input v-model:value="form.client_name" placeholder="Имя клиента" />
          </div>
          <div class="modal-form__field">
            <label class="modal-form__label">Телефон</label>
            <a-input v-model:value="form.client_phone" placeholder="+996 XXX XXX XXX" />
          </div>
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Дата <span class="req">*</span></label>
          <a-date-picker v-model:value="form.date" format="DD.MM.YYYY" style="width: 100%" />
        </div>

        <div class="modal-form__row">
          <div class="modal-form__field">
            <label class="modal-form__label">Начало <span class="req">*</span></label>
            <a-time-picker
              v-model:value="form.start_time"
              format="HH:mm"
              :minute-step="5"
              placeholder="09:00"
              style="width: 100%"
            />
          </div>
          <div class="modal-form__field">
            <label class="modal-form__label">Конец <span class="req">*</span></label>
            <a-time-picker
              v-model:value="form.end_time"
              format="HH:mm"
              :minute-step="5"
              placeholder="10:00"
              style="width: 100%"
            />
          </div>
        </div>

        <div class="modal-form__field">
          <div class="modal-form__price-head">
            <label class="modal-form__label">Цена (сом)</label>
            <div class="modal-form__price-toggle">
              <a-switch v-model:checked="priceOverride" size="small" />
              <span class="modal-form__toggle-label">Изменить цену</span>
            </div>
          </div>
          <div class="modal-form__price-display">
            <span class="modal-form__price-rate"
              >{{ priceOverride ? customRate : pitch?.price_per_hour }} сом/ч</span
            >
            <span class="modal-form__price-sep">·</span>
            <span class="modal-form__price-total">{{ form.price ?? 0 }} сом итого</span>
          </div>
          <a-input-number
            v-if="priceOverride"
            v-model:value="customRate"
            :min="0"
            placeholder="Сом в час"
            style="width: 100%; margin-top: 8px"
          />
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Оплачено</label>
          <div class="input-with-suffix">
            <a-input-number
              v-model:value="form.paid_amount"
              :min="0"
              :max="form.price ?? undefined"
              :precision="0"
              placeholder="Введите сумму оплаты"
              style="width: 100%"
            />
            <span class="input-with-suffix__text">сом</span>
          </div>
          <div class="modal-form__status-badge" :class="`status-badge--${computedStatus}`">
            {{ statusLabel(computedStatus) }}
          </div>
        </div>

        <div v-if="!form.paid_amount" class="modal-form__field">
          <label class="modal-form__label">Ожидание оплаты</label>
          <a-select
            v-model:value="form.pending_minutes"
            style="width: 100%"
            :options="[
              { label: '1 мин', value: 1 },
              { label: '10 мин', value: 10 },
              { label: '20 мин', value: 20 },
              { label: '30 мин', value: 30 },
            ]"
          />
          <div v-if="pendingTimerLabel" class="modal-form__timer-label">
            {{ pendingTimerLabel }}
          </div>
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Заметки</label>
          <a-textarea
            v-model:value="form.notes"
            placeholder="Дополнительная информация"
            :rows="2"
          />
        </div>
      </div>
    </a-modal>

    <!-- Delete confirmation -->
    <a-modal
      v-model:open="deleteModalOpen"
      title="Удалить бронирование"
      :confirm-loading="deleting"
      ok-text="Удалить"
      cancel-text="Отмена"
      ok-type="danger"
      @ok="confirmDelete"
    >
      <p class="delete-confirm">
        Удалить бронирование клиента
        <strong>{{ deletingBooking?.client_name }}</strong
        >?
      </p>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.pb-page {
  background: $bg-body;
  min-height: calc(100vh - 56px);
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px 12px;
  }

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__head {
    margin-bottom: 12px;

    @media (max-width: 768px) {
      margin-bottom: 8px;
    }
  }

  &__back {
    color: $text-secondary;
    padding-left: 0;
  }
}

// ─── Pitch info ────────────────────────────────────────────────────
.pb-info {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  padding: 18px 24px;
  margin-bottom: 14px;

  @media (max-width: 560px) {
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    margin-bottom: 10px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  &__name {
    font-size: 20px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
    word-break: break-word;

    @media (max-width: 560px) {
      font-size: 17px;
    }
  }

  &__complex {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;

    @media (max-width: 560px) {
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }
  }

  &__price {
    font-size: 16px;
    font-weight: 700;
    color: $primary;
  }

  &__hours {
    font-size: 13px;
    color: $text-secondary;
  }
}

// ─── Week bar ──────────────────────────────────────────────────────
.pb-weekbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 4px;

    @media (max-width: 480px) {
      justify-content: center;
    }
  }

  &__label {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    min-width: 180px;
    text-align: center;
    text-transform: capitalize;

    @media (max-width: 640px) {
      min-width: unset;
      font-size: 14px;
    }
  }

  &__add-btn {
    flex-shrink: 0;

    @media (max-width: 480px) {
      width: 100%;
    }
  }
}

// ─── Legend ────────────────────────────────────────────────────────
.pb-legend {
  display: flex;
  gap: 10px 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 8px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $text-secondary;

    &::before {
      content: '';
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }

    &--paid::before {
      background: rgba(82, 196, 26, 0.25);
      border-left: 3px solid #52c41a;
    }

    &--partial::before {
      background: rgba(250, 173, 20, 0.22);
      border-left: 3px solid #faad14;
    }

    &--pending::before {
      background: rgba(22, 119, 255, 0.15);
      border-left: 3px solid #1677ff;
    }

    &--free::before {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
    }
  }
}

// ─── Schedule grid ─────────────────────────────────────────────────
.sched-wrap {
  overflow-x: auto;
  border-radius: $radius-lg;
  border: 1px solid #e8e8e8;
  background: $bg-card;
  box-shadow: $shadow-card;
}

.sched {
  display: grid;
  grid-template-columns: 80px repeat(var(--cols, 7), minmax(0, 1fr));

  &__corner {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 20;
    background: $bg-card;
    border-bottom: 2px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
  }

  &__day-head {
    position: sticky;
    top: 0;
    z-index: 10;
    background: $bg-card;
    border-bottom: 2px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    padding: 10px 6px;
    text-align: center;
    user-select: none;

    &--today {
      background: #e6f4ff;
      .sched__day-num {
        color: $primary;
      }
    }

    &--yesterday {
      background: #fafafa;
      .sched__day-num {
        color: $text-secondary;
      }
    }

    &--tomorrow {
      background: #f6ffed;
      .sched__day-num {
        color: #52c41a;
      }
    }
  }

  &__day-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    border-radius: 4px;
    padding: 1px 5px;
    margin-top: 4px;
    line-height: 16px;

    &--today {
      background: $primary;
      color: #fff;
    }

    &--yesterday {
      background: #f0f0f0;
      color: $text-secondary;
    }

    &--tomorrow {
      background: #d9f7be;
      color: #389e0d;
    }
  }

  &__weekday {
    display: block;
    font-size: 11px;
    color: $text-secondary;
    text-transform: capitalize;
    margin-bottom: 2px;
  }

  &__day-num {
    display: block;
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.1;
  }

  &__month {
    display: block;
    font-size: 11px;
    color: $text-secondary;
    margin-top: 2px;
    text-transform: capitalize;
  }

  &__hour {
    position: sticky;
    left: 0;
    z-index: 5;
    background: $bg-card;
    font-size: 11px;
    color: $text-secondary;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 8px;
    height: 52px;
    border-bottom: 1px solid #f0f0f0;
    border-right: 1px solid #e0e0e0;
    white-space: nowrap;
    user-select: none;
  }

  &__cell {
    height: 52px;
    cursor: pointer;
    padding: 5px 7px;
    border-bottom: 1px solid #f0f0f0;
    border-right: 1px solid #f0f0f0;
    transition: background 0.12s;
    overflow: hidden;

    &--today-col {
      background-color: rgba(22, 119, 255, 0.02);
    }

    &--free {
      &:hover {
        background: rgba(22, 119, 255, 0.06) !important;
      }
    }

    &--paid {
      background: rgba(82, 196, 26, 0.14);
      border-left: 3px solid #52c41a;

      &:hover {
        background: rgba(82, 196, 26, 0.26) !important;
      }
      &.sched__cell--today-col {
        background: rgba(82, 196, 26, 0.16);
      }
    }

    &--partial {
      background: rgba(250, 173, 20, 0.15);
      border-left: 3px solid #faad14;

      &:hover {
        background: rgba(250, 173, 20, 0.28) !important;
      }
      &.sched__cell--today-col {
        background: rgba(250, 173, 20, 0.18);
      }
    }

    &--pending {
      background: rgba(22, 119, 255, 0.08);
      border-left: 3px solid #1677ff;

      &:hover {
        background: rgba(22, 119, 255, 0.16) !important;
      }
      &.sched__cell--today-col {
        background: rgba(22, 119, 255, 0.1);
      }
    }
  }

  &__cell-top {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 1px;
  }

  &__cell-hash {
    font-size: 10px;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.35);
    letter-spacing: 0.3px;
  }

  &__cell-note-badge {
    font-size: 9px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    padding: 0 3px;
    color: rgba(0, 0, 0, 0.45);
    line-height: 14px;
  }

  &__cell-name {
    font-size: 11px;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    line-height: 1.3;
  }
}

// ─── Modal ─────────────────────────────────────────────────────────
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &__right {
    display: flex;
    gap: 8px;
    margin-left: auto;
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

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 400px) {
      grid-template-columns: 1fr;
    }
  }
}

.input-with-suffix {
  display: flex;
  align-items: center;
  gap: 8px;

  &__text {
    font-size: 13px;
    color: $text-secondary;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.modal-form__status-badge {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;

  &.status-badge--paid {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
  &.status-badge--partial {
    background: #fffbe6;
    color: #d48806;
    border: 1px solid #ffe58f;
  }
  &.status-badge--pending {
    background: #e6f4ff;
    color: #1677ff;
    border: 1px solid #91caff;
  }
}

.modal-form__timer-label {
  margin-top: 6px;
  font-size: 12px;
  color: $text-secondary;

  &--expired {
    color: #ff4d4f;
    font-weight: 600;
  }
}

.modal-form__prepay-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;

  .modal-form__label {
    margin-bottom: 0;
  }
}

.modal-form__price-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;

  .modal-form__label {
    margin-bottom: 0;
  }
}

.modal-form__price-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-form__toggle-label {
  font-size: 12px;
  color: $text-secondary;
}

.modal-form__price-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.modal-form__price-rate {
  font-size: 14px;
  color: $text-secondary;
}

.modal-form__price-sep {
  font-size: 14px;
  color: $text-secondary;
}

.modal-form__price-total {
  font-size: 20px;
  font-weight: 700;
  color: $primary;
}

@media (max-width: 600px) {
  :deep(.ant-modal) {
    max-width: calc(100vw - 24px) !important;
    margin: 12px auto !important;
  }
  :deep(.ant-modal-content) {
    border-radius: 12px !important;
    padding: 16px !important;
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
