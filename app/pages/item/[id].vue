<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFinanceStore, type FinanceItem } from '../../composables/useFinanceStore';

const route = useRoute();
const router = useRouter();
const { getById, upsert, remove } = useFinanceStore();

const id = String(route.params.id ?? '');
const item = computed(() => getById(id));

const delta = ref<number | null>(null);

function pct(i: FinanceItem | undefined) {
  if (!i || !i.targetAmount) return 0;
  return Math.min(100, Math.round((i.currentAmount / i.targetAmount) * 100));
}

function applyDelta(sign: 1 | -1) {
  const i = item.value;
  if (!i) return;
  const change = Number(delta.value ?? 0) * sign;
  upsert({
    id: i.id,
    currentAmount: Math.max(0, i.currentAmount + change),
  });
  delta.value = null;
}

function del() {
  const i = item.value;
  if (!i) return;
  remove(i.id);
  router.push('/');
}

const typeLabel: Record<FinanceItem['type'], string> = {
  loan_self: 'Self Loan',
  loan_other: 'Loan to Other',
  savings: 'Saving Box',
};
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
    <header class="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
      <div class="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        <NuxtLink to="/" class="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">&larr; Back</NuxtLink>
        <h1 class="font-semibold text-lg flex-1 truncate text-neutral-900 dark:text-neutral-100">{{ item?.name ?? 'Item' }}</h1>
        <button @click="del" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">Delete</button>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6" v-if="item">
      <div class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div class="font-medium text-neutral-800 dark:text-neutral-200">{{ typeLabel[item.type] }}</div>
          <div class="text-sm text-neutral-500 dark:text-neutral-400">{{ pct(item) }}%</div>
        </div>
        <div class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{{ item.name }}</div>

        <div class="mt-3 h-4 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div class="h-full bg-neutral-800 dark:bg-neutral-300" :style="{ width: pct(item) + '%' }"></div>
        </div>
        <div class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {{ Intl.NumberFormat().format(item.currentAmount) }} / {{ Intl.NumberFormat().format(item.targetAmount) }}
        </div>
      </div>

      <div class="mt-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm space-y-3">
        <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Update amount</div>
        <div class="flex items-center gap-3">
          <input v-model.number="delta" type="number" min="0" step="0.01" class="flex-1 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-3 py-2" placeholder="Amount" />
          <button @click="applyDelta(1)" class="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-2 hover:bg-neutral-800 dark:hover:bg-neutral-200">Add</button>
          <button @click="applyDelta(-1)" class="rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 hover:bg-neutral-300 dark:hover:bg-neutral-600">Subtract</button>
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Use Add to record a deposit or repayment. Use Subtract to undo or record withdrawal.</p>
      </div>
    </main>

    <main v-else class="mx-auto max-w-2xl px-4 py-10 text-center text-neutral-500 dark:text-neutral-400">
      Item not found.
    </main>
  </div>
</template>