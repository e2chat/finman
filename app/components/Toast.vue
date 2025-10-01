<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, remove } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <TransitionGroup
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-x-8"
        leave-to-class="opacity-0 translate-x-8"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 cursor-pointer"
          :class="{
            'bg-green-600 text-white': toast.type === 'success',
            'bg-red-600 text-white': toast.type === 'error',
            'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900': toast.type === 'info'
          }"
          @click="remove(toast.id)"
        >
          <span class="text-sm flex-1">{{ toast.message }}</span>
          <button
            class="text-lg leading-none opacity-70 hover:opacity-100"
            @click.stop="remove(toast.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
