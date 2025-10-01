<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';

interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  message: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return;
  if (e.key === 'Escape') {
    handleCancel();
  } else if (e.key === 'Enter') {
    handleConfirm();
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        @click.self="handleCancel"
      >
        <div class="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-xl">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {{ title }}
          </h2>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            {{ message }}
          </p>
          <div class="mt-6 flex gap-3 justify-end">
            <button
              @click="handleCancel"
              class="cursor-pointer rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-2 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="cursor-pointer rounded-md bg-red-600 dark:bg-red-500 text-white px-4 py-2 hover:bg-red-700 dark:hover:bg-red-600 transition"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
