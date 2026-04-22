<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { apiGetComplexes, type Complex } from '@/api/complexes'
import { apiGetPitches, type Pitch } from '@/api/pitches'
import { apiGetOwnerComplex } from '@/api/users'

const router = useRouter()
const auth = useAuthStore()

const isAdmin = computed(() =>
  auth.user?.roles.some((r) => r.name === 'super_admin' || r.name === 'admin'),
)

const loading = ref(true)
const complexes = ref<Complex[]>([])
const selectedComplexId = ref<string | null>(null)
const pitches = ref<Pitch[]>([])
const loadingPitches = ref(false)
const ownerComplex = ref<Complex | null>(null)

onMounted(async () => {
  try {
    if (isAdmin.value) {
      complexes.value = await apiGetComplexes()
    } else {
      ownerComplex.value = await apiGetOwnerComplex(auth.user!.id)
      if (ownerComplex.value) {
        selectedComplexId.value = ownerComplex.value.id
        pitches.value = await apiGetPitches(ownerComplex.value.id)
      }
    }
  } catch {
    message.error('Не удалось загрузить данные')
  } finally {
    loading.value = false
  }
})

watch(selectedComplexId, async (id) => {
  if (!isAdmin.value || !id) {
    if (isAdmin.value) pitches.value = []
    return
  }
  loadingPitches.value = true
  try {
    pitches.value = await apiGetPitches(id)
  } catch {
    message.error('Не удалось загрузить поля')
  } finally {
    loadingPitches.value = false
  }
})

const complexOptions = computed(() =>
  complexes.value.map((c) => ({ label: c.name, value: c.id })),
)

function pitchTypeLabel(t: string) {
  if (t === 'open') return 'Открытое'
  if (t === 'covered') return 'Крытое'
  return 'Футзал'
}

function workingHours(p: Pitch) {
  return p.is_24h ? 'Круглосуточно' : `${p.open_time} – ${p.close_time}`
}

function goToPitch(p: Pitch) {
  router.push({ name: 'pitch-bookings', params: { pitchId: p.id } })
}
</script>

<template>
  <div class="bookings-select">
    <div class="bookings-select__inner">
      <div class="bookings-select__head">
        <h1 class="bookings-select__title">Бронирования</h1>
      </div>

      <a-spin :spinning="loading">
        <!-- Complex selector for admins -->
        <div v-if="isAdmin" class="bookings-select__filter">
          <label class="bookings-select__filter-label">Комплекс</label>
          <a-select
            v-model:value="selectedComplexId"
            :options="complexOptions"
            placeholder="Выберите комплекс"
            allow-clear
            style="width: 100%; max-width: 360px"
          />
        </div>

        <!-- Complex name for owners -->
        <p v-else-if="ownerComplex" class="bookings-select__complex-name">
          {{ ownerComplex.name }}
        </p>

        <a-spin :spinning="loadingPitches">
          <!-- Pitch grid -->
          <div v-if="pitches.length" class="pitches-grid">
            <button
              v-for="p in pitches"
              :key="p.id"
              class="pitch-card"
              @click="goToPitch(p)"
            >
              <div class="pitch-card__top">
                <span class="pitch-card__name">{{ p.name }}</span>
                <a-tag :bordered="false" color="blue">{{ pitchTypeLabel(p.type) }}</a-tag>
              </div>
              <div class="pitch-card__row">
                <span class="pitch-card__dim">{{ p.width }} × {{ p.length }} м</span>
                <span class="pitch-card__price">{{ p.price_per_hour }} сом/ч</span>
              </div>
              <div class="pitch-card__hours">
                <CalendarOutlined class="pitch-card__hours-icon" />
                {{ workingHours(p) }}
              </div>
            </button>
          </div>

          <!-- States -->
          <div v-else-if="!loading && !loadingPitches && isAdmin && !selectedComplexId" class="bookings-select__hint">
            Выберите комплекс для просмотра полей
          </div>

          <div v-else-if="!loading && !loadingPitches && !isAdmin && !ownerComplex" class="bookings-select__empty">
            <a-empty description="Вам не назначен комплекс" />
          </div>

          <div v-else-if="!loading && !loadingPitches && selectedComplexId && !pitches.length" class="bookings-select__empty">
            <a-empty description="В этом комплексе нет полей" />
          </div>
        </a-spin>
      </a-spin>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.bookings-select {
  background: $bg-body;
  min-height: calc(100vh - 56px);
  padding: 32px 24px;

  &__inner {
    max-width: 1100px;
    margin: 0 auto;
  }

  &__head {
    margin-bottom: 24px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  &__filter {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  &__filter-label {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    white-space: nowrap;
  }

  &__complex-name {
    font-size: 16px;
    font-weight: 600;
    color: $text-secondary;
    margin: 0 0 20px;
  }

  &__hint {
    padding: 40px 0;
    text-align: center;
    font-size: 15px;
    color: $text-secondary;
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

.pitches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.pitch-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.15s;

  &:hover {
    border-color: $primary;
    box-shadow: 0 4px 16px rgba(22, 119, 255, 0.15);
    transform: translateY(-2px);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__dim {
    font-size: 13px;
    color: $text-secondary;
  }

  &__price {
    font-size: 14px;
    font-weight: 600;
    color: $primary;
  }

  &__hours {
    font-size: 12px;
    color: $text-secondary;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__hours-icon {
    font-size: 12px;
  }
}
</style>
