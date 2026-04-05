<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Form, Input, Button, Checkbox, message } from 'ant-design-vue'
import { MailOutlined, LockOutlined, CalendarOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const useForm = Form.useForm
const router = useRouter()
const authStore = useAuthStore()

const formState = reactive({
  email: '',
  password: '',
  remember: true,
})

const loading = ref(false)

const rules = {
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email', message: 'Некорректный email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Введите пароль', trigger: 'blur' },
    { min: 6, message: 'Минимум 6 символов', trigger: 'blur' },
  ],
}

const { validate, validateInfos } = useForm(formState, rules)

async function handleLogin() {
  try {
    await validate()
    loading.value = true
    await authStore.login(formState.email, formState.password, formState.remember)
    await router.push({ name: 'home' })
  } catch (err) {
    if (err instanceof Error) {
      message.error(err.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__grid" aria-hidden="true" />
    <div class="login-card">
      <div class="login-card__logo">
        <CalendarOutlined class="login-card__logo-icon" />
      </div>

      <div class="login-card__header">
        <h2 class="login-card__title">24Bron</h2>
        <p class="login-card__desc">Войдите в административную панель</p>
      </div>

      <Form layout="vertical" autocomplete="off">
        <Form.Item label="Email" v-bind="validateInfos.email">
          <Input
            v-model:value="formState.email"
            size="large"
            placeholder="example@mail.com"
            @press-enter="handleLogin"
          >
            <template #prefix>
              <MailOutlined class="form-icon" />
            </template>
          </Input>
        </Form.Item>

        <Form.Item label="Пароль" v-bind="validateInfos.password">
          <Input.Password
            v-model:value="formState.password"
            size="large"
            placeholder="Введите пароль"
            @press-enter="handleLogin"
          >
            <template #prefix>
              <LockOutlined class="form-icon" />
            </template>
          </Input.Password>
        </Form.Item>

        <div class="login-card__options">
          <Checkbox v-model:checked="formState.remember">Запомнить меня</Checkbox>
          <a class="forgot-link" href="#">Забыли пароль?</a>
        </div>

        <Button
          type="primary"
          size="large"
          :loading="loading"
          block
          class="login-btn"
          @click="handleLogin"
        >
          Войти
        </Button>
      </Form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);

  // Decorative blobs
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  &::before {
    width: 600px;
    height: 600px;
    top: -160px;
    left: -160px;
    background: radial-gradient(circle, rgba(22, 119, 255, 0.35) 0%, transparent 70%);
  }

  &::after {
    width: 500px;
    height: 500px;
    bottom: -120px;
    right: -120px;
    background: radial-gradient(circle, rgba(82, 196, 26, 0.2) 0%, transparent 70%);
  }
}

.login-page__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  width: 400px;
  height: 400px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(22, 119, 255, 0.15) 0%, transparent 70%);
}

// Dot-grid overlay
.login-page__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 48px 40px;
  box-shadow: $shadow-card;
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: $shadow-card-hover;
  }

  &__logo {
    width: 64px;
    height: 64px;
    border-radius: $radius-md;
    background: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  &__logo-icon {
    font-size: 30px;
    color: #fff;
  }

  &__header {
    text-align: center;
    margin-bottom: 32px;
  }

  &__title {
    font-size: 28px;
    font-weight: 800;
    color: $text-primary;
    margin: 0 0 6px;
    letter-spacing: -0.5px;
  }

  &__desc {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }

  &__options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
}

.form-icon {
  color: $text-secondary;
}

.forgot-link {
  font-size: 13px;
  color: $primary;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $primary-dark;
  }
}

.login-btn {
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  border-radius: $radius-sm;
  background: $primary;
  border-color: $primary;
  transition:
    background 0.2s,
    transform 0.1s;

  &:hover:not(:disabled) {
    background: $primary-dark !important;
    border-color: $primary-dark !important;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}
</style>
