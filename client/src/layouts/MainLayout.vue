<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

const userRoles = computed(() => auth.user?.roles.map((r) => r.name) ?? [])
const isAdmin = computed(() => userRoles.value.some((r) => r === 'super_admin' || r === 'admin'))
const isOwner = computed(() =>
  userRoles.value.some((r) => r === 'owner' || r === 'owner_assistant'),
)

interface MenuItem {
  type: 'item'
  key: string
  icon: unknown
  label: string
  disabled?: boolean
}

interface MenuGroup {
  type: 'group'
  label: string
  children: MenuItem[]
}

const menuItems = computed((): (MenuItem | MenuGroup)[] => {
  const item = (key: string, icon: unknown, label: string, disabled = false): MenuItem => ({
    type: 'item',
    key,
    icon,
    label,
    disabled,
  })

  const group = (label: string, children: MenuItem[]): MenuGroup => ({
    type: 'group',
    label,
    children,
  })

  const items: (MenuItem | MenuGroup)[] = [item('home', HomeOutlined, 'Главная')]

  if (isAdmin.value || isOwner.value) {
    items.push(
      group('Управление', [
        item('fields', AppstoreOutlined, 'Площадки', true),
        item('bookings', CalendarOutlined, 'Бронирования', true),
        item('schedule', CalendarOutlined, 'Расписание', true),
      ]),
    )
  }

  if (isAdmin.value) {
    items.push(
      group('Администрирование', [
        item('users', TeamOutlined, 'Пользователи', true),
        item('owners', UserOutlined, 'Владельцы', true),
      ]),
    )
  }

  if (isOwner.value) {
    items.push(group('Мои данные', [item('staff', TeamOutlined, 'Сотрудники', true)]))
  }

  items.push(group('Аналитика', [item('statistics', BarChartOutlined, 'Статистика', true)]))
  items.push(group('Система', [item('settings', SettingOutlined, 'Настройки', true)]))

  return items
})

const selectedKeys = computed(() => [route.name as string])

function handleMenuClick({ key }: { key: string }) {
  if (key === 'home') router.push({ name: 'home' })
}

async function handleLogout() {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout">

    <!-- Sidebar -->
    <aside class="layout__sider" :class="{ 'layout__sider--collapsed': collapsed }">

        <!-- Logo -->
      <div class="layout__logo">
        <CalendarOutlined class="layout__logo-icon" />
        <span class="layout__logo-text">24Bron</span>
      </div>

      <!-- Toggle button — right edge, outside overflow -->
      <button class="layout__toggle" @click="collapsed = !collapsed">
        <LeftOutlined v-if="!collapsed" />
        <RightOutlined v-else />
      </button>

      <!-- Menu -->
      <nav class="layout__menu">
        <template v-for="item in menuItems" :key="'key' in item ? item.key : item.label">

          <template v-if="item.type === 'group'">
            <p class="layout__menu-group">{{ item.label }}</p>
            <button
              v-for="child in item.children"
              :key="child.key"
              class="layout__menu-item"
              :class="{
                'layout__menu-item--active': selectedKeys[0] === child.key,
                'layout__menu-item--disabled': child.disabled,
              }"
              :disabled="child.disabled"
              @click="handleMenuClick({ key: child.key })"
            >
              <component :is="child.icon" class="layout__menu-icon" />
              <span class="layout__menu-label">{{ child.label }}</span>
            </button>
          </template>

          <template v-else>
            <button
              class="layout__menu-item"
              :class="{ 'layout__menu-item--active': selectedKeys[0] === item.key }"
              @click="handleMenuClick({ key: item.key })"
            >
              <component :is="item.icon" class="layout__menu-icon" />
              <span class="layout__menu-label">{{ item.label }}</span>
            </button>
          </template>

        </template>
      </nav>

      <!-- User block -->
      <div class="layout__user">
        <a-avatar class="layout__user-avatar">
          {{ auth.user?.first_name?.[0] }}{{ auth.user?.last_name?.[0] }}
        </a-avatar>
        <div class="layout__user-info">
          <p class="layout__user-name">{{ auth.user?.first_name }} {{ auth.user?.last_name }}</p>
          <p class="layout__user-email">{{ auth.user?.email }}</p>
        </div>
        <a-tooltip title="Выйти" placement="right">
          <button class="layout__logout-btn" @click="handleLogout">
            <LogoutOutlined />
          </button>
        </a-tooltip>
      </div>

    </aside>

    <!-- Content -->
    <main class="layout__body" :class="{ 'layout__body--full': collapsed }">
      <RouterView />
    </main>

  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

$sider-width: 240px;
$sider-collapsed-width: 48px;
$sider-bg: #001529;
$transition: 0.25s ease;

.layout {
  display: flex;
  min-height: 100vh;

  // ── Sidebar ──────────────────────────────
  &__sider {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: $sider-width;
    background: $sider-bg;
    display: flex;
    flex-direction: column;
    overflow: visible;
    transition: width $transition;
    z-index: 200;

    &--collapsed {
      width: $sider-collapsed-width;

      .layout__logo-text,
      .layout__menu-label,
      .layout__menu-group,
      .layout__user-info {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }

      .layout__menu-item {
        justify-content: center;
        padding: 10px 0;
      }

      .layout__logo {
        justify-content: center;
        padding: 0 10px;
      }


      .layout__user {
        justify-content: center;
        padding: 12px 0;
        gap: 0;
      }

      .layout__user-avatar,
      .layout__user-info {
        display: none;
      }
    }
  }

  // Toggle button — right edge of sidebar, sticking out
  &__toggle {
    position: absolute;
    top: 20px;
    right: -12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $sider-bg;
    border: 1px solid rgba(255, 255, 255, 0.18);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.55);
    z-index: 201;
    transition: background $transition, color $transition, border-color $transition;

    &:hover {
      background: $primary;
      border-color: $primary;
      color: #fff;
    }
  }

  // Logo
  &__logo {
    height: 64px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    overflow: hidden;
    white-space: nowrap;
    background: $sider-bg;
  }

  &__logo-icon {
    font-size: 22px;
    color: $primary;
    flex-shrink: 0;
  }

  &__logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
  }

  // Menu
  &__menu {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 0;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
  }

  &__menu-group {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 16px 20px 4px;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
  }

  &__menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 20px;
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    text-align: left;
    transition: background $transition, color $transition;
    white-space: nowrap;
    overflow: hidden;

    &:hover:not(&--disabled) {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    &--active {
      background: $primary;
      color: #fff;

      &:hover {
        background: $primary-dark;
      }
    }

    &--disabled {
      cursor: default;
      opacity: 0.4;
    }
  }

  &__menu-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  &__menu-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // User block
  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  &__user-avatar {
    flex-shrink: 0;
    background: $primary;
    font-size: 12px;
    font-weight: 600;
  }

  &__user-info {
    flex: 1;
    min-width: 0;
  }

  &__user-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.88);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-email {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__logout-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.45);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    font-size: 16px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    transition: color $transition;

    &:hover { color: $danger; }
  }

  // ── Content ───────────────────────────────
  &__body {
    flex: 1;
    margin-left: $sider-width;
    transition: margin-left $transition;
    min-height: 100vh;

    &--full {
      margin-left: $sider-collapsed-width;
    }
  }

  // ── Responsive ───────────────────────────
  @media (max-width: 768px) {
    &__body {
      margin-left: $sider-collapsed-width;

      &--full {
        margin-left: $sider-collapsed-width;
      }
    }
  }
}
</style>
