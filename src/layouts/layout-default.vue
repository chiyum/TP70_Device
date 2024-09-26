<script setup lang="ts"></script>

<template>
  <div class="layout-default">
    <slot />
  </div>
</template>

<style lang="scss">
.layout-default {
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: center;
  align-items: center;
}
</style>
