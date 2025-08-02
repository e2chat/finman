<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFinanceStore, type FinanceType } from '../composables/useFinanceStore';

const router = useRouter();
const { upsert } = useFinanceStore();

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
  <div class="min-h-screen bg-neutral-50">
    <header class="sticky top-0 bg-white border-b border-neutral-200">
      <div class="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        <NuxtLink to="/" class="text-neutral-600 hover:text-neutral-900">&larr; Back</NuxtLink>
        <h1 class="font-semibold text-lg">Add Item</h1>
        <div class="flex-1"></div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <form @submit.prevent="save" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-1">Type</label>
          <select v-model="type" class="w-full rounded-md border border-neutral-300 px-3 py-2">
            <option value="savings">Savings</option>
            <option value="loan_self">Self Loan</option>
            <option value="loan_other">Loan to Other</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input v-model="name" type="text" class="w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="e.g., Travel Fund or John owes me" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Target Amount</label>
            <input v-model.number="targetAmount" type="number" min="0" step="0.01" class="w-full rounded-md border border-neutral-300 px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Starting Amount</label>
            <input v-model.number="currentAmount" type="number" min="0" step="0.01" class="w-full rounded-md border border-neutral-300 px-3 py-2" />
          </div>
        </div>

        <div class="pt-2">
          <button type="submit" class="rounded-md bg-neutral-900 text-white px-4 py-2 hover:bg-neutral-800">Save</button>
        </div>
      </form>
    </main>
  </div>
</template>