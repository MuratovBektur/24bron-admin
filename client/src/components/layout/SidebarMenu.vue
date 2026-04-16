<script setup lang="ts">
import { computed } from 'vue'
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
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'

defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

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
        item('complexes', AppstoreOutlined, 'Комплексы', !isAdmin.value),
        item('bookings', CalendarOutlined, 'Бронирования', true),
        item('schedule', CalendarOutlined, 'Расписание', true),
      ]),
    )
  }

  if (isAdmin.value) {
    items.push(
      group('Администрирование', [
        item('users', TeamOutlined, 'Пользователи'),
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

const selectedKey = computed(() => route.name as string)

function handleClick(key: string) {
  const routes: Record<string, string> = {
    home: 'home',
    complexes: 'complexes',
    users: 'users',
  }
  if (routes[key]) router.push({ name: routes[key] })
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <!-- Logo -->
    <div class="sidebar__logo">
      <CalendarOutlined class="sidebar__logo-icon" />
      <span class="sidebar__logo-text">24Bron</span>
    </div>

    <!-- Toggle -->
    <button class="sidebar__toggle" @click="emit('update:collapsed', !collapsed)">
      <LeftOutlined v-if="!collapsed" />
      <RightOutlined v-else />
    </button>

    <!-- Menu -->
    <nav class="sidebar__menu">
      <template v-for="item in menuItems" :key="'key' in item ? item.key : item.label">
        <template v-if="item.type === 'group'">
          <p class="sidebar__group">{{ item.label }}</p>
          <button
            v-for="child in item.children"
            :key="child.key"
            class="sidebar__item"
            :class="{
              'sidebar__item--active': selectedKey === child.key,
              'sidebar__item--disabled': child.disabled,
            }"
            :disabled="child.disabled"
            @click="handleClick(child.key)"
          >
            <component :is="child.icon" class="sidebar__icon" />
            <span class="sidebar__label">{{ child.label }}</span>
          </button>
        </template>

        <template v-else>
          <button
            class="sidebar__item"
            :class="{ 'sidebar__item--active': selectedKey === item.key }"
            @click="handleClick(item.key)"
          >
            <component :is="item.icon" class="sidebar__icon" />
            <span class="sidebar__label">{{ item.label }}</span>
          </button>
        </template>
      </template>
    </nav>
  </aside>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

$w: 240px;
$w-sm: 48px;
$bg: #001529;
$t: 0.25s ease;

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: $w;
  background: $bg;
  display: flex;
  flex-direction: column;
  overflow: visible;
  transition: width $t;
  z-index: 200;

  &--collapsed {
    width: $w-sm;

    .sidebar__logo-text,
    .sidebar__label,
    .sidebar__group {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .sidebar__logo {
      justify-content: center;
      padding: 0 10px;
    }
    .sidebar__item {
      justify-content: center;
      padding: 10px 0;
    }
  }
}

// Toggle
.sidebar__toggle {
  position: absolute;
  top: 20px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: $bg;
  border: 1px solid rgba(255, 255, 255, 0.18);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
  z-index: 201;
  transition:
    background $t,
    color $t,
    border-color $t;

  &:hover {
    background: $primary;
    border-color: $primary;
    color: #fff;
  }
}

// Logo
.sidebar__logo {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
  background: $bg;
}

.sidebar__logo-icon {
  font-size: 22px;
  color: $primary;
  flex-shrink: 0;
}
.sidebar__logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

// Menu
.sidebar__menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }
}

.sidebar__group {
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

.sidebar__item {
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
  transition:
    background $t,
    color $t;
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

.sidebar__icon {
  font-size: 16px;
  flex-shrink: 0;
}
.sidebar__label {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
