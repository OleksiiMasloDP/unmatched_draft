import { ref } from "vue";

// Спільний стан вікна "Повідомити про баг". Відкривати можна з будь-якого місця:
//   const { openFeedback } = useFeedback();
//   openFeedback({ section: "game", type: "bug" });
const isOpen = ref(false);
const preset = ref({ type: "bug", section: "" });

export function useFeedback() {
  function openFeedback(options = {}) {
    preset.value = {
      type: options.type || "bug",
      section: options.section || "",
    };
    isOpen.value = true;
  }

  function closeFeedback() {
    isOpen.value = false;
  }

  return { isOpen, preset, openFeedback, closeFeedback };
}
