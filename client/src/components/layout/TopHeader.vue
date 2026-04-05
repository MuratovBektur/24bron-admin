<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons-vue'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="header">
    <a-dropdown placement="bottomRight" :trigger="['click']">
      <div class="header__user">
        <div class="header__info">
          <p class="header__name">{{ auth.user?.first_name }} {{ auth.user?.last_name }}</p>
          <p class="header__email">{{ auth.user?.email }}</p>
        </div>
        <a-avatar class="header__avatar">
          {{ auth.user?.first_name?.[0] }}{{ auth.user?.last_name?.[0] }}
        </a-avatar>
      </div>

      <template #overlay>
        <a-menu>
          <a-menu-item key="settings" disabled>
            <SettingOutlined /> Настройки
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="logout" class="header__logout" @click="handleLogout">
            <LogoutOutlined /> Выйти
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </header>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;

  &__user {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: $radius-sm;
    transition: background 0.25s ease;

    &:hover { background: $bg-body; }
  }

  &__info { text-align: right; }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
    line-height: 1.3;
  }

  &__email {
    font-size: 11px;
    color: $text-secondary;
    margin: 0;
    line-height: 1.3;
  }

  &__avatar {
    background: $primary;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__logout {
    color: $danger !important;
  }
}
</style>
