<template>
  <svg
    class="action-icon"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path v-if="name === 'scheme'" d="M13.5 2 5 13.5h5.5L9.5 22 19 9.5h-5.8z" />
    <template v-else-if="name === 'attack'">
      <path d="M19.5 2.5 21.5 4.5 11 15l-2-2z" />
      <path d="M7.5 12.5 11.5 16.5 9 19l-1.5-1.5-3 3L3 19l3-3L4.5 14.5z" />
    </template>
    <template v-else-if="name === 'maneuver'">
      <path d="M12 2 20 12h-5v5h-6v-5H4z" transform="rotate(90 12 12)" />
      <path d="M4 20h16v2H4z" />
    </template>
    <template v-else-if="name === 'boost'">
      <path d="M12 2 19 11h-4.5v4h-5v-4H5z" />
      <path d="M9.5 17h5v2h-5zM10.5 20.5h3v1.5h-3z" />
    </template>
    <path v-else-if="name === 'skip'" d="M5 4v16l10-8zM17 4h2v16h-2z" />
    <template v-else-if="name === 'flag'">
      <path d="M5 2h2v20H5z" />
      <path d="M8 3h11l-3 4.5 3 4.5H8z" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.action-icon {
  flex: 0 0 auto;
  width: 1.15em;
  height: 1.15em;
  margin-right: 6px;
  vertical-align: -0.2em;
}
</style>
