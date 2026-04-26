<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useMediaQuery } from '@vueuse/core'
import {
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiAssignComplex,
  apiGetOwnerComplex,
  type User,
  type CreateUserDto,
  type UpdateUserDto,
  type RoleName,
  ROLE_LABELS,
} from '@/api/users'
import { apiGetComplexes, type Complex } from '@/api/complexes'

const users = ref<User[]>([])
const complexes = ref<Complex[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const loadingComplex = ref(false)

interface FormState {
  first_name: string
  last_name: string
  email: string
  password: string
  phone: string
  role: RoleName
  is_active: boolean
  complex_id: string | null
}

const emptyForm = (): FormState => ({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  role: 'owner',
  is_active: true,
  complex_id: null,
})

const form = ref<FormState>(emptyForm())

const roleOptions: { label: string; value: RoleName }[] = [
  { label: 'Владелец', value: 'owner' },
  { label: 'Помощник владельца', value: 'owner_assistant' },
]

const complexOptions = computed(() => complexes.value.map((c) => ({ label: c.name, value: c.id })))

const isMobile = useMediaQuery('(max-width: 640px)')
const modalWidth = computed(() => (isMobile.value ? '92vw' : '480px'))

const showComplexField = computed(
  () => form.value.role === 'owner' || form.value.role === 'owner_assistant',
)

function onRoleChange() {
  if (!showComplexField.value) form.value.complex_id = null
}

function getRoleLabel(user: User): string {
  const name = user.roles[0]?.name as RoleName | undefined
  return name ? (ROLE_LABELS[name] ?? name) : '—'
}

function getRoleColor(user: User): string {
  const name = user.roles[0]?.name
  if (name === 'owner') return 'blue'
  if (name === 'owner_assistant') return 'cyan'
  return 'default'
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

async function openEdit(u: User) {
  editingId.value = u.id
  const role = (u.roles[0]?.name as RoleName) ?? 'owner'
  form.value = {
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    password: '',
    phone: u.phone ?? '',
    role,
    is_active: u.is_active,
    complex_id: null,
  }
  modalOpen.value = true

  // Загружаем текущий комплекс если владелец или помощник
  if (role === 'owner' || role === 'owner_assistant') {
    loadingComplex.value = true
    try {
      const complex = await apiGetOwnerComplex(u.id)
      form.value.complex_id = complex?.id ?? null
    } catch {
      // не критично
    } finally {
      loadingComplex.value = false
    }
  }
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
  if (!editingId.value && showComplexField.value && !form.value.complex_id) {
    message.warning('Выберите комплекс')
    return false
  }
  return true
}

async function handleSubmit() {
  if (!isValid()) return
  submitting.value = true
  try {
    let userId: string

    if (editingId.value) {
      const dto: UpdateUserDto = {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        phone: form.value.phone || undefined,
        role: form.value.role,
        is_active: form.value.is_active,
      }
      const updated = await apiUpdateUser(editingId.value, dto)
      const idx = users.value.findIndex((u) => u.id === editingId.value)
      if (idx !== -1) users.value[idx] = updated
      userId = editingId.value
      message.success('Пользователь обновлён')
    } else {
      const dto: CreateUserDto = {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        password: form.value.password,
        phone: form.value.phone || undefined,
        role: form.value.role,
      }
      const created = await apiCreateUser(dto)
      users.value.unshift(created)
      userId = created.id
      message.success('Пользователь создан')
    }

    // Назначаем комплекс если нужно
    if (showComplexField.value && form.value.complex_id !== null) {
      await apiAssignComplex(userId, form.value.complex_id)
    }

    modalOpen.value = false
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    message.error(msg ?? 'Произошла ошибка')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const [userList, complexList] = await Promise.all([apiGetUsers(), apiGetComplexes()])
    users.value = userList
    complexes.value = complexList
  } catch {
    message.error('Не удалось загрузить данные')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="users-page">
    <div class="users-page__inner">
      <div class="users-page__head">
        <h1 class="users-page__title">Пользователи</h1>
        <a-button type="primary" class="users-page__head-btn" @click="openCreate">
          <template #icon><PlusOutlined /></template>
          Добавить пользователя
        </a-button>
      </div>

      <a-spin :spinning="loading">
        <div v-if="users.length" class="users-table">
          <div class="users-table__header">
            <span>Имя</span>
            <span>Email</span>
            <span>Роль</span>
            <span>Статус</span>
            <span></span>
          </div>
          <div v-for="u in users" :key="u.id" class="users-table__row">
            <span class="users-table__name">{{ u.first_name }} {{ u.last_name }}</span>
            <span class="users-table__email">{{ u.email }}</span>
            <span>
              <a-tag :color="getRoleColor(u)">{{ getRoleLabel(u) }}</a-tag>
            </span>
            <span>
              <a-tag :color="u.is_active ? 'green' : 'default'">
                {{ u.is_active ? 'Активен' : 'Неактивен' }}
              </a-tag>
            </span>
            <span class="users-table__actions">
              <a-button type="text" size="small" @click="openEdit(u)">
                <template #icon><EditOutlined /></template>
              </a-button>
            </span>
          </div>
        </div>

        <div v-else-if="!loading" class="users-page__empty">
          <a-empty description="Пользователи не найдены" />
        </div>
      </a-spin>
    </div>

    <!-- Модалка создания / редактирования -->
    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? 'Редактировать пользователя' : 'Добавить пользователя'"
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

        <div class="modal-form__field">
          <label class="modal-form__label">Роль <span class="req">*</span></label>
          <a-select
            v-model:value="form.role"
            :options="roleOptions"
            style="width: 100%"
            @change="onRoleChange"
          />
        </div>

        <!-- Комплекс — только для владельца и помощника -->
        <div v-if="showComplexField" class="modal-form__field">
          <label class="modal-form__label">
            Комплекс <span v-if="!editingId" class="req">*</span>
          </label>
          <a-spin :spinning="loadingComplex">
            <a-select
              v-model:value="form.complex_id"
              :options="complexOptions"
              :allow-clear="true"
              placeholder="Выберите комплекс"
              style="width: 100%"
            />
          </a-spin>
        </div>

        <div class="modal-form__switch-row">
          <label class="modal-form__label" style="margin: 0">Активен</label>
          <a-switch v-model:checked="form.is_active" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.users-page {
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

.users-table {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  overflow: hidden;

  &__header {
    display: grid;
    grid-template-columns: 1.5fr 2fr 1fr 1fr 60px;
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
    grid-template-columns: 1.5fr 2fr 1fr 1fr 60px;
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

      .users-table__name {
        grid-column: 1;
        grid-row: 1;
      }
      .users-table__email {
        grid-column: 1 / -1;
        grid-row: 2;
        font-size: 12px;
      }
      & > :nth-child(3) {
        grid-column: 1;
        grid-row: 3;
      }
      & > :nth-child(4) {
        grid-column: 2;
        grid-row: 3;
      }
      .users-table__actions {
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

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
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
