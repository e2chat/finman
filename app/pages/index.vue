<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
// Use relative path to avoid alias resolution issues in tooling
import { useFinanceStore, type FinanceItem } from '../composables/useFinanceStore';

const router = useRouter();
const { items } = useFinanceStore();

const q = ref('');
const qDebounced = ref('');
const showMenu = ref(false);

// Debounce search input
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(q, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    qDebounced.value = newVal;
  }, 300);
});

const filtered = computed(() => {
  const term = qDebounced.value.trim().toLowerCase();
  let result = term ? items.value.filter(i => i.name.toLowerCase().includes(term)) : items.value;

  // Sort by newest first
  result = [...result];
  result.sort((a, b) => b.createdAt - a.createdAt);

  return result;
});

function pct(item: FinanceItem) {
  if (!item.targetAmount) return 0;
  return Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100));
}
function goAdd() { router.push('/add'); }
function openItem(id: string) { router.push(`/item/${id}`); }

function exportData() {
  showMenu.value = false;
  try {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: items.value,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finman-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Failed to export backup', e);
  }
}

function importData() {
  showMenu.value = false;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (e) => {
    try {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.items && Array.isArray(data.items)) {
        const { items: storeItems, persist } = useFinanceStore();
        storeItems.value = data.items;
        persist();
      } else {
        console.error('Invalid backup file format');
      }
    } catch (e) {
      console.error('Failed to import backup', e);
    }
  };
  input.click();
}

const typeLabel: Record<FinanceItem['type'], string> = {
  loan_self: 'Self Loan',
  loan_other: 'Loan to Other',
  savings: 'Saving Box',
};
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" @click="showMenu = false">
    <!-- Top Bar -->
    <header class="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-700">
      <div class="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
        <div class="font-semibold text-xl flex-1">Finman</div>
        <div class="flex-1 max-w-md">
          <input v-model="q" type="text" placeholder="Search" class="w-full rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400" />
        </div>
        <div class="relative" @click.stop>
          <button @click="showMenu = !showMenu" class="cursor-pointer inline-flex items-center justify-center w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            ⋯
          </button>
          <Transition
            enter-active-class="transition-all duration-200"
            leave-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="showMenu" class="absolute right-0 mt-2 w-48 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg py-1 z-20">
              <button @click="exportData" class="cursor-pointer w-full text-left px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4"/>
                </svg>
                <span>Export Backup</span>
              </button>
              <button @click="importData" class="cursor-pointer w-full text-left px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 20V4m0 0l-4 4m4-4l4 4"/>
                </svg>
                <span>Import Backup</span>
              </button>
            </div>
          </Transition>
        </div>
        <button @click="goAdd" class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200">+</button>
      </div>
    </header>

    <!-- Cards -->
    <main class="mx-auto max-w-4xl px-4 py-6">
      <!-- Empty State -->
      <div v-if="filtered.length === 0" class="text-center py-16">
        <div class="text-neutral-400 dark:text-neutral-500 text-lg">
          {{ qDebounced.trim() ? 'No items match your search.' : 'No items yet. Click + to get started!' }}
        </div>
      </div>

      <!-- Items Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="i in filtered" :key="i.id" @click="openItem(i.id)" class="cursor-pointer rounded-2xl border bg-white dark:bg-neutral-800 p-4 shadow-sm hover:shadow transition" :class="pct(i) >= 100 ? 'border-green-500 dark:border-green-600' : 'border-neutral-200 dark:border-neutral-700'">
          <div class="flex items-start justify-between">
            <div class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate flex-1 pr-2">{{ i.name }}</div>
            <div class="text-sm flex items-center gap-1" :class="pct(i) >= 100 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-neutral-500 dark:text-neutral-400'">
              <span v-if="pct(i) >= 100">✓</span>
              <span>{{ pct(i) }}%</span>
            </div>
          </div>
          <div class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{{ typeLabel[i.type] }}</div>
          <div class="mt-3 h-4 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div class="h-full transition-all duration-300" :class="pct(i) >= 100 ? 'bg-green-300 dark:bg-green-400' : 'bg-blue-300 dark:bg-blue-400'" :style="{ width: pct(i) + '%' }"></div>
          </div>
          <div class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(i.currentAmount) }} / {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(i.targetAmount) }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
