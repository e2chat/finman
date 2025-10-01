<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFinanceStore, type FinanceType } from '../composables/useFinanceStore';

const router = useRouter();

const { upsert } = useFinanceStore();

useSeoMeta({ title: 'Add Item - Finman' })

const type = ref<FinanceType>('savings');
const name = ref('');
const targetAmount = ref<number | null>(null);
const currentAmount = ref<number | null>(null);

function save() {
  upsert({
    type: type.value,
    name: name.value.trim() || 'Untitled',
    targetAmount: Number(targetAmount.value ?? 0),
    currentAmount: Number(currentAmount.value ?? 0),
  });
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
    <header class="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
      <div class="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        <NuxtLink to="/" class="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">&larr; Back</NuxtLink>
        <h1 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Add Item</h1>
        <div class="flex-1"></div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <form @submit.prevent="save" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">Type</label>
          <select v-model="type" class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2">
            <option value="savings">Savings</option>
            <option value="loan_self">Self Loan</option>
            <option value="loan_other">Loan to Other</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">Name</label>
          <input v-model="name" type="text" class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-3 py-2" placeholder="e.g., Travel Fund or John owes me" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">Target Amount</label>
            <input v-model.number="targetAmount" type="number" min="0" step="0.01" class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2" />
            <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1">
              <button type="button" @click="targetAmount = (targetAmount || 0) * 0.9" class="cursor-pointer text-xs rounded bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-2 py-1 hover:bg-red-200 dark:hover:bg-red-800">-10%</button>
              <button type="button" @click="targetAmount = (targetAmount || 0) * 0.75" class="cursor-pointer text-xs rounded bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-2 py-1 hover:bg-red-200 dark:hover:bg-red-800">-25%</button>
              <button type="button" @click="targetAmount = (targetAmount || 0) * 0.5" class="cursor-pointer text-xs rounded bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-2 py-1 hover:bg-red-200 dark:hover:bg-red-800">-50%</button>
              <button type="button" @click="targetAmount = (targetAmount || 0) * 1.1" class="cursor-pointer text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-2 py-1 hover:bg-purple-200 dark:hover:bg-purple-800">+10%</button>
              <button type="button" @click="targetAmount = (targetAmount || 0) * 1.25" class="cursor-pointer text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-2 py-1 hover:bg-purple-200 dark:hover:bg-purple-800">+25%</button>
              <button type="button" @click="targetAmount = (targetAmount || 0) * 1.5" class="cursor-pointer text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-2 py-1 hover:bg-purple-200 dark:hover:bg-purple-800">+50%</button>
              <button type="button" @click="targetAmount = (targetAmount || 0) * 2" class="cursor-pointer text-xs rounded bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-2 py-1 hover:bg-purple-200 dark:hover:bg-purple-800">Double</button>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Quick adjustments to target (hold to apply multiple times)</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">Starting Amount</label>
            <input v-model.number="currentAmount" type="number" min="0" step="0.01" class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2" />
            <div class="mt-2 grid grid-cols-2 gap-1">
              <button type="button" @click="currentAmount = (targetAmount || 0) * 0.1" class="cursor-pointer text-xs rounded bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-1 hover:bg-amber-200 dark:hover:bg-amber-800">10% of Target</button>
              <button type="button" @click="currentAmount = (targetAmount || 0) * 0.25" class="cursor-pointer text-xs rounded bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-1 hover:bg-amber-200 dark:hover:bg-amber-800">25% of Target</button>
              <button type="button" @click="currentAmount = (targetAmount || 0) * 0.5" class="cursor-pointer text-xs rounded bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-1 hover:bg-amber-200 dark:hover:bg-amber-800">50% of Target</button>
              <button type="button" @click="currentAmount = 0" class="cursor-pointer text-xs rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-2 py-1 hover:bg-neutral-300 dark:hover:bg-neutral-600">Reset to 0</button>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Quick presets based on target amount</p>
          </div>
        </div>

        <div class="pt-2">
          <button type="submit" class="cursor-pointer rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 hover:bg-neutral-800 dark:hover:bg-neutral-200">Save</button>
        </div>
      </form>
    </main>
  </div>
</template>