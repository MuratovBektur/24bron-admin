<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { useMediaQuery } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import {
  apiGetMyStaff,
  apiCreateStaffMember,
  apiUpdateStaffMember,
  apiRemoveStaffMember,
  type StaffMember,
  type CreateStaffDto,
  type UpdateStaffDto,
} from '@/api/staff'

const auth = useAuthStore()
const isOwner = computed(() => auth.user?.roles.some((r) => r.name === 'owner') ?? false)

const staff = ref<StaffMember[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

interface FormState {
  first_name: string
  last_name: string
  email: string
  password: string
  phone: string
  is_active: boolean
}

const emptyForm = (): FormState => ({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  is_active: true,
})

const form = ref<FormState>(emptyForm())

const isMobile = useMediaQuery('(max-width: 640px)')
const modalWidth = computed(() => (isMobile.value ? '92vw' : '480px'))

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(member: StaffMember) {
  editingId.value = member.id
  form.value = {
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    password: '',
    phone: member.phone ?? '',
    is_active: member.is_active,
  }
  modalOpen.value = true
}

function isValid(): boolean {
  if (!form.value.first_name.trim()) {
    message.warning('Введите имя')
    return false
  }
  if (!form.value.last_name.trim()) {
    message.warning('Введите фамилию')
    return false
  }
  if (!form.value.email.trim()) {
    message.warning('Введите email')
    return false
  }
  if (!editingId.value && !form.value.password.trim()) {
    message.warning('Введите пароль')
    return false
  }
  return true
}

async function handleSubmit() {
  if (!isValid()) return
  submitting.value = true
  try {
    if (editingId.value) {
      const dto: UpdateStaffDto = {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        phone: form.value.phone || undefined,
        is_active: form.value.is_active,
      }
      const updated = await apiUpdateStaffMember(editingId.value, dto)
      const idx = staff.value.findIndex((s) => s.id === editingId.value)
      if (idx !== -1) staff.value[idx] = updated
      message.success('Сотрудник обновлён')
    } else {
      const dto: CreateStaffDto = {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        password: form.value.password,
        phone: form.value.phone || undefined,
      }
      const created = await apiCreateStaffMember(dto)
      staff.value.unshift(created)
      message.success('Сотрудник добавлен')
    }
    modalOpen.value = false
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    message.error(msg ?? 'Произошла ошибка')
  } finally {
    submitting.value = false
  }
}

function confirmRemove(member: StaffMember) {
  Modal.confirm({
    title: 'Удалить сотрудника?',
    content: `${member.first_name} ${member.last_name} будет удалён из вашего персонала.`,
    okText: 'Удалить',
    okType: 'danger',
    cancelText: 'Отмена',
    async onOk() {
      try {
        await apiRemoveStaffMember(member.id)
        staff.value = staff.value.filter((s) => s.id !== member.id)
        message.success('Сотрудник удалён')
      } catch {
        message.error('Не удалось удалить сотрудника')
      }
    },
  })
}

onMounted(async () => {
  try {
    staff.value = await apiGetMyStaff()
  } catch {
    message.error('Не удалось загрузить сотрудников')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="staff-page">
    <div class="staff-page__inner">
      <div class="staff-page__head">
        <h1 class="staff-page__title">Сотрудники</h1>
        <a-button v-if="isOwner" type="primary" class="staff-page__head-btn" @click="openCreate">
          <template #icon><PlusOutlined /></template>
          Добавить сотрудника
        </a-button>
      </div>

      <a-spin :spinning="loading">
        <div v-if="staff.length" class="staff-table">
          <div class="staff-table__header">
            <span>Имя</span>
            <span>Email</span>
            <span>Телефон</span>
            <span>Статус</span>
            <span v-if="isOwner"></span>
          </div>
          <div v-for="member in staff" :key="member.id" class="staff-table__row">
            <span class="staff-table__name">{{ member.first_name }} {{ member.last_name }}</span>
            <span class="staff-table__email">{{ member.email }}</span>
            <span class="staff-table__phone">{{ member.phone ?? '—' }}</span>
            <span>
              <a-tag :color="member.is_active ? 'green' : 'default'">
                {{ member.is_active ? 'Активен' : 'Неактивен' }}
              </a-tag>
            </span>
            <span v-if="isOwner" class="staff-table__actions">
              <a-button type="text" size="small" @click="openEdit(member)">
                <template #icon><EditOutlined /></template>
              </a-button>
              <a-button type="text" size="small" danger @click="confirmRemove(member)">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </span>
          </div>
        </div>

        <div v-else-if="!loading" class="staff-page__empty">
          <a-empty description="Сотрудники не найдены" />
        </div>
      </a-spin>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? 'Редактировать сотрудника' : 'Добавить сотрудника'"
      :confirm-loading="submitting"
      ok-text="Сохранить"
      cancel-text="Отмена"
      :width="modalWidth"
      @ok="handleSubmit"
    >
      <div class="modal-form">
        <div class="modal-form__row">
          <div class="modal-form__field">
            <label class="modal-form__label">Имя <span class="req">*</span></label>
            <a-input v-model:value="form.first_name" placeholder="Алишер" />
          </div>
          <div class="modal-form__field">
            <label class="modal-form__label">Фамилия <span class="req">*</span></label>
            <a-input v-model:value="form.last_name" placeholder="Иванов" />
          </div>
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Email <span class="req">*</span></label>
          <a-input v-model:value="form.email" placeholder="user@example.com" autocomplete="off" />
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Пароль{{ editingId ? '' : ' *' }}</label>
          <a-input-password
            v-model:value="form.password"
            :placeholder="editingId ? 'Оставьте пустым чтобы не менять' : 'Минимум 6 символов'"
            autocomplete="new-password"
          />
        </div>

        <div class="modal-form__field">
          <label class="modal-form__label">Телефон</label>
          <a-input v-model:value="form.phone" placeholder="+996 XXX XXX XXX" />
        </div>

        <div v-if="editingId" class="modal-form__switch-row">
          <label class="modal-form__label" style="margin: 0">Активен</label>
          <a-switch v-model:checked="form.is_active" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.staff-page {
  background: $bg-body;
  min-height: calc(100vh - 56px);
  padding: 32px 24px;

  @media (max-width: 768px) {
    padding: 16px 12px;
  }

  &__inner {
    max-width: 1000px;
    margin: 0 auto;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 12px;

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: stretch;
      margin-bottom: 16px;
    }
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  &__head-btn {
    @media (max-width: 480px) {
      width: 100%;
    }
  }

  &__empty {
    background: $bg-card;
    border-radius: $radius-lg;
    box-shadow: $shadow-card;
    padding: 64px 24px;
    display: flex;
    justify-content: center;

    @media (max-width: 480px) {
      padding: 40px 16px;
    }
  }
}

.staff-table {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  overflow: hidden;

  &__header {
    display: grid;
    grid-template-columns: 1.5fr 2fr 1.2fr 1fr 80px;
    padding: 10px 20px;
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    @media (max-width: 640px) {
      display: none;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1.5fr 2fr 1.2fr 1fr 80px;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    @media (max-width: 640px) {
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto auto;
      gap: 4px 12px;
      padding: 12px 16px;

      .staff-table__name {
        grid-column: 1;
        grid-row: 1;
      }
      .staff-table__email {
        grid-column: 1 / -1;
        grid-row: 2;
        font-size: 12px;
      }
      .staff-table__phone {
        grid-column: 1;
        grid-row: 3;
        font-size: 12px;
      }
      & > :nth-child(4) {
        grid-column: 2;
        grid-row: 3;
      }
      .staff-table__actions {
        grid-column: 2;
        grid-row: 1;
        justify-content: flex-end;
      }
    }
  }

  &__name {
    font-weight: 500;
    color: $text-primary;
    font-size: 14px;
  }

  &__email {
    font-size: 13px;
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__phone {
    font-size: 13px;
    color: $text-secondary;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
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

  &__switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 4px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.req {
  color: #ff4d4f;
}
</style>
