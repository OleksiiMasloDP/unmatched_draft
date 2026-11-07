import { ref } from "vue";

const isOpen = ref(false);

export function useSupport() {
  const openSupport = () => {
    isOpen.value = true;
  };
  const closeSupport = () => {
    isOpen.value = false;
  };
  return { isOpen, openSupport, closeSupport };
}
