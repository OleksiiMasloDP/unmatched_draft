<template>
  <div
    class="vs-slot"
    :class="{ 'is-filled': character }"
    @click="emit('pick')"
  >
    <template v-if="character">
      <button
        v-if="clearable"
        class="vs-slot-clear"
        @click.stop="emit('clear')"
      >
        ✕
      </button>
      <img :src="character.image" class="vs-slot-img" />
      <div class="vs-slot-name">{{ character.name }}</div>

      <!-- Слот под кастомные бейджи вроде винрейтов -->
      <slot name="badge"></slot>
    </template>

    <template v-else>
      <div class="vs-slot-plus">+</div>
      <div v-if="label" class="vs-slot-label">{{ label }}</div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  character: {
    type: Object,
    default: null,
  },
  label: {
    type: String,
    default: "",
  },
  clearable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["pick", "clear"]);
</script>

<style scoped>
.vs-slot {
  cursor: pointer;
  width: clamp(140px, 30vw, 200px);
  height: clamp(140px, 30vw, 200px);
  border-radius: 20px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.vs-slot:hover {
  border-color: rgba(79, 124, 255, 0.7);
  transform: translateY(-2px);
}

.vs-slot.is-filled {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #1e293b;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.vs-slot-plus {
  font-size: 2.5rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1;
}

.vs-slot-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 0 8px;
}

.vs-slot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}

.vs-slot-name {
  position: relative;
  z-index: 2;
  width: 100%;
  background: linear-gradient(to top, rgba(7, 10, 18, 0.95) 60%, transparent);
  color: white;
  font-weight: 800;
  font-size: 13px;
  text-align: center;
  padding: 14px 8px 10px;
  margin-top: auto;
}

.vs-slot-clear {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(15, 23, 42, 0.85);
  color: #f1f5f9;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.vs-slot-clear:hover {
  background: #ef4444;
}
</style>
