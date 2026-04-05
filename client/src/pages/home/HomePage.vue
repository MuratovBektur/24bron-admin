<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  CalendarOutlined,
  UserOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons-vue'

const auth = useAuthStore()
const user = computed(() => auth.user)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
})

const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Супер Админ', color: 'red' },
  admin: { label: 'Администратор', color: 'volcano' },
  owner: { label: 'Владелец', color: 'blue' },
  owner_assistant: { label: 'Помощник', color: 'cyan' },
  client: { label: 'Клиент', color: 'green' },
}
</script>

<template>
  <div class="home">
    <div class="home__inner">
      <!-- Greeting card -->
      <div class="home__greeting card">
        <div class="home__greeting-avatar">
          <UserOutlined />
        </div>
        <div class="home__greeting-text">
          <p class="home__greeting-sub">{{ greeting }},</p>
          <h1 class="home__greeting-name">{{ user?.first_name }} {{ user?.last_name }}</h1>
          <div class="home__roles">
            <a-tag
              v-for="role in user?.roles"
              :key="role.id"
              :color="roleLabels[role.name]?.color ?? 'default'"
            >
              {{ roleLabels[role.name]?.label ?? role.name }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- Info cards -->
      <div class="home__cards">
        <div class="home__card card">
          <MailOutlined class="home__card-icon home__card-icon--blue" />
          <div>
            <p class="home__card-label">Email</p>
            <p class="home__card-value">{{ user?.email ?? '—' }}</p>
          </div>
        </div>

        <div class="home__card card">
          <SafetyCertificateOutlined class="home__card-icon home__card-icon--green" />
          <div>
            <p class="home__card-label">Роли</p>
            <div class="home__card-roles">
              <a-tag
                v-for="role in user?.roles"
                :key="role.id"
                :color="roleLabels[role.name]?.color ?? 'default'"
              >
                {{ roleLabels[role.name]?.label ?? role.name }}
              </a-tag>
            </div>
          </div>
        </div>

        <div class="home__card card">
          <CalendarOutlined class="home__card-icon home__card-icon--purple" />
          <div>
            <p class="home__card-label">Сегодня</p>
            <p class="home__card-value">
              {{
                new Date().toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.home {
  min-height: 100vh;
  background: $bg-body;
  padding: 32px 24px;

  &__inner {
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

.card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  padding: 32px;
}

// Greeting
.home__greeting {
  display: flex;
  align-items: center;
  gap: 24px;

  &-avatar {
    flex-shrink: 0;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: #fff;
  }

  &-sub {
    font-size: 14px;
    color: $text-secondary;
    margin: 0 0 4px;
  }

  &-name {
    font-size: 26px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 12px;
    line-height: 1.2;
  }
}

.home__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

// Info cards grid
.home__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.home__card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: $shadow-card-hover;
  }

  &-icon {
    font-size: 28px;
    flex-shrink: 0;

    &--blue {
      color: $primary;
    }
    &--green {
      color: $success;
    }
    &--purple {
      color: #722ed1;
    }
  }

  &-label {
    font-size: 12px;
    color: $text-secondary;
    margin: 0 0 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &-value {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  &-roles {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
  }
}

// Адаптив
@media (max-width: 768px) {
  .home {
    padding: 16px;
  }

  .home__greeting {
    flex-direction: column;
    text-align: center;

    &-name {
      font-size: 22px;
    }
  }

  .home__roles {
    justify-content: center;
  }

  .home__cards {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .home__cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
