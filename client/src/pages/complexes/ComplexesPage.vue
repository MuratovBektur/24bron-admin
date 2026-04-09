<script setup lang="ts">
</script>

<template>
  <div class="fields">
    <div class="fields__inner">
      <div class="fields__head">
        <h1 class="fields__title">Комплексы</h1>
      </div>

      <div class="fields__empty">
        <a-empty description="Комплексы пока не добавлены" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.fields {
  background: $bg-body;
  min-height: calc(100vh - 56px);
  padding: 32px 24px;

  &__inner {
    max-width: 1200px;
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

  &__empty {
    background: $bg-card;
    border-radius: $radius-lg;
    box-shadow: $shadow-card;
    padding: 64px 24px;
    display: flex;
    justify-content: center;
  }
}
</style>
