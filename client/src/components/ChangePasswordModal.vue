<script setup lang="ts">
import { ref, computed } from 'vue'
import { LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const open = computed(() => !!auth.user?.must_change_password)

const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

async function handleSubmit() {
  if (newPassword.value.length < 6) {
    message.warning('Пароль должен содержать минимум 6 символов')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    message.warning('Пароли не совпадают')
    return
  }

  submitting.value = true
  try {
    await auth.changePassword(newPassword.value)
    message.success('Пароль успешно изменён')
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    message.error(msg ?? 'Произошла ошибка')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <a-modal
    :open="open"
    :closable="false"
    :mask-closable="false"
    :keyboard="false"
    :footer="null"
    width="420px"
  >
    <div class="cp-modal">
      <div class="cp-modal__icon">
        <LockOutlined />
      </div>
      <h2 class="cp-modal__title">Смена пароля</h2>
      <p class="cp-modal__subtitle">
        Для продолжения необходимо установить новый пароль. Это обязательный шаг при первом входе в
        систему.
      </p>

      <div class="cp-form">
        <div class="cp-form__field">
          <label class="cp-form__label">Новый пароль</label>
          <a-input-password
            v-model:value="newPassword"
            placeholder="Минимум 6 символов"
            autocomplete="new-password"
          />
        </div>
        <div class="cp-form__field">
          <label class="cp-form__label">Подтвердите пароль</label>
          <a-input-password
            v-model:value="confirmPassword"
            placeholder="Повторите новый пароль"
            autocomplete="new-password"
            @keyup.enter="handleSubmit"
          />
        </div>

        <a-button type="primary" block :loading="submitting" @click="handleSubmit">
          Сохранить пароль
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.cp-modal {
  padding: 8px 4px 4px;
  text-align: center;

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(22, 119, 255, 0.1);
    color: #1677ff;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 8px;
  }

  &__subtitle {
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0 0 24px;
  }
}

.cp-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 6px;
  }

  &__field {
    display: flex;
    flex-direction: column;
  }
}
</style>
