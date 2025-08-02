<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
// Use relative path to avoid alias resolution issues in tooling
import { useFinanceStore, type FinanceItem } from '../composables/useFinanceStore';

const router = useRouter();
const { items } = useFinanceStore();

const q = ref('');
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  if (!term) return items.value;
  return items.value.filter(i => i.name.toLowerCase().includes(term));
});

function pct(item: FinanceItem) {
  if (!item.targetAmount) return 0;
  return Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100));
}
function goAdd() { router.push('/add'); }
function openItem(id: string) { router.push(`/item/${id}`); }

const typeLabel: Record<FinanceItem['type'], string> = {
  loan_self: 'Self Loan',
  loan_other: 'Loan to Other',
  savings: 'Saving Box',
};
</script>

<template>
  <div class="min-h-screen bg-neutral-50 text-neutral-900">
    <!-- Top Bar -->
    <header class="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div class="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
        <div class="font-semibold text-xl flex-1">Finman</div>
        <div class="flex-1 max-w-md">
          <input v-model="q" type="text" placeholder="Search" class="w-full rounded-full border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500" />
        </div>
        <button @click="goAdd" class="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-neutral-900 text-white hover:bg-neutral-800">+</button>
      </div>
    </header>

    <!-- Cards -->
    <main class="mx-auto max-w-4xl px-4 py-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="i in filtered" :key="i.id" @click="openItem(i.id)" class="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow transition">
          <div class="flex items-start justify-between">
            <div class="font-medium text-neutral-800">{{ typeLabel[i.type] }}</div>
            <div class="text-sm text-neutral-500">{{ pct(i) }}%</div>
          </div>
          <div class="mt-1 text-sm text-neutral-600 truncate">{{ i.name }}</div>
          <div class="mt-3 h-4 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div class="h-full bg-neutral-800" :style="{ width: pct(i) + '%' }"></div>
          </div>
          <div class="mt-2 text-xs text-neutral-500">
            {{ Intl.NumberFormat().format(i.currentAmount) }} / {{ Intl.NumberFormat().format(i.targetAmount) }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
