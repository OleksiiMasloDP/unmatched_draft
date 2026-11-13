<template>
  <span class="ricon-wrap" :style="{ width: size, height: size }">
    <span
      class="ricon"
      :class="'m-' + metal"
      :style="{ maskImage: mask, WebkitMaskImage: mask }"
    />
  </span>
</template>

<script setup>
import { computed } from "vue";
import { rogueIcons } from "../rogueIcons";

const props = defineProps({
  name: { type: String, required: true },
  metal: { type: String, default: "gold" },
  size: { type: String, default: "1.5em" },
});

const mask = computed(() => {
  const body = rogueIcons[props.name] || "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});
</script>

<style scoped>
.ricon-wrap {
  display: inline-flex;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35))
    drop-shadow(0 2px 3px rgba(0, 0, 0, 0.85));
}

.ricon {
  width: 100%;
  height: 100%;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.m-gold {
  background: linear-gradient(
    160deg,
    #fff6c2 0%,
    #f2c94c 32%,
    #a87408 68%,
    #ffe28a 100%
  );
}

.m-silver {
  background: linear-gradient(
    160deg,
    #ffffff 0%,
    #c9d1d9 35%,
    #6f7a88 70%,
    #e8edf2 100%
  );
}

.m-bronze {
  background: linear-gradient(
    160deg,
    #ffd9ad 0%,
    #d58a45 35%,
    #7a431a 70%,
    #eab27a 100%
  );
}

.m-ruby {
  background: linear-gradient(
    160deg,
    #ffc9c9 0%,
    #f0494b 35%,
    #7d1114 70%,
    #ff9a9a 100%
  );
}
</style>
