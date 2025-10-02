<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useFinanceStore, type FinanceItem } from '../../composables/useFinanceStore';

const route = useRoute();
const router = useRouter();
const { getById, upsert, remove } = useFinanceStore();

const id = String(route.params.id ?? '');
const item = computed(() => getById(id));

const delta = ref<number | null>(null);

const showDeleteModal = ref(false);

useHead(() => ({ title: item.value?.name ? `${item.value.name} - Finman` : 'Item - Finman' }))

// Edit form fields
const editName = ref('');
const editTargetAmount = ref<number | null>(null);
const editCurrentAmount = ref<number | null>(null);

// Advanced adjustments
const customPercentage = ref<number | null>(null);
const previewCalculation = ref<string>('');
const updated = ref(false);

const currentPreview = ref<string>('');

// Initialize edit fields when item loads
watch(item, (newItem) => {
  if (newItem) {
    editName.value = newItem.name;
    editTargetAmount.value = newItem.targetAmount;
    editCurrentAmount.value = newItem.currentAmount;
  }
}, { immediate: true });

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
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

function setAmount() {
  const i = item.value;
  if (!i) return;
  upsert({
    id: i.id,
    currentAmount: Math.max(0, Number(delta.value ?? 0)),
  });
  delta.value = null;
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

function saveEdit() {
  const i = item.value;
  if (!i) return;
  upsert({
    id: i.id,
    name: editName.value.trim() || 'Untitled',
    targetAmount: Number(editTargetAmount.value ?? 0),
    currentAmount: Number(editCurrentAmount.value ?? 0),
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

function confirmDelete() {
  const i = item.value;
  if (!i) return;
  remove(i.id);
  router.push('/');
}

// Target amount percentage adjustments
function applyPercentageToTarget(percentage: number) {
  const i = item.value;
  if (!i) return;
  const absPct = Math.abs(percentage);
  if (absPct > 50) {
    const action = percentage > 0 ? 'increase' : 'decrease';
    if (!confirm(`This will ${action} your target amount by ${absPct}%. Are you sure?`)) return;
  }
  const change = i.targetAmount * (percentage / 100);
  const newTarget = Math.max(0, i.targetAmount + change);

  previewCalculation.value = `$${i.targetAmount.toFixed(2)} ${percentage > 0 ? '+' : ''}${percentage}% = $${newTarget.toFixed(2)}`;
  setTimeout(() => previewCalculation.value = '', 3000);

  upsert({
    id: i.id,
    targetAmount: newTarget,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

function applyCustomPercentageToTarget() {
  const pct = Number(customPercentage.value ?? 0);
  if (pct === 0) return;
  const absPct = Math.abs(pct);
  if (absPct > 50) {
    const action = pct > 0 ? 'increase' : 'decrease';
    if (!confirm(`This will ${action} your target amount by ${absPct}%. Are you sure?`)) return;
  }
  applyPercentageToTarget(pct);
  customPercentage.value = null;
}

// Current amount percentage adjustments
function addPercentageOfCurrent(percentage: number) {
  const i = item.value;
  if (!i) return;
  if (percentage > 50) {
    if (!confirm(`This will increase your current amount by ${percentage}% of current ($${ (i.currentAmount * (percentage / 100)).toFixed(2) }). Are you sure?`)) return;
  }
  const increase = i.currentAmount * (percentage / 100);
  const newCurrent = i.currentAmount + increase;

  currentPreview.value = `$${i.currentAmount.toFixed(2)} + ${percentage}% = $${newCurrent.toFixed(2)}`;
  setTimeout(() => currentPreview.value = '', 3000);

  upsert({
    id: i.id,
    currentAmount: Math.max(0, newCurrent),
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

// Quick complete actions
function completeGoal() {
  const i = item.value;
  if (!i) return;
  if (pct(i) < 90) {
    if (!confirm('Complete the goal? This will set current amount to target.')) return;
  }
  currentPreview.value = `Complete goal: $${i.targetAmount.toFixed(2)}`;
  setTimeout(() => currentPreview.value = '', 3000);
  upsert({
    id: i.id,
    currentAmount: i.targetAmount,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

function reachHalfway() {
  const i = item.value;
  if (!i) return;
  const halfway = i.targetAmount / 2;
  currentPreview.value = `Reach halfway: $${halfway.toFixed(2)}`;
  setTimeout(() => currentPreview.value = '', 3000);
  upsert({
    id: i.id,
    currentAmount: halfway,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

// Advanced tools
function multiplyTarget(multiplier: number) {
  const i = item.value;
  if (!i) return;
  const changePct = Math.abs(multiplier - 1) * 100;
  if (changePct > 50) {
    if (!confirm(`This will ${multiplier > 1 ? 'increase' : 'decrease'} your target by ${changePct.toFixed(0)}%. Are you sure?`)) return;
  }
  upsert({
    id: i.id,
    targetAmount: i.targetAmount * multiplier,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
}

function applyInterestToBoth(percentage: number) {
  const i = item.value;
  if (!i) return;
  if (percentage > 50) {
    if (!confirm(`This will apply ${percentage}% interest to both target and current amounts. Are you sure?`)) return;
  }
  const targetIncrease = i.targetAmount * (percentage / 100);
  const currentIncrease = i.currentAmount * (percentage / 100);

  upsert({
    id: i.id,
    targetAmount: i.targetAmount + targetIncrease,
    currentAmount: i.currentAmount + currentIncrease,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
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
        <button @click="showDeleteModal = true" class="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">Delete</button>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6" v-if="item">
      <div class="rounded-2xl border p-4 shadow-sm" :class="[pct(item) >= 100 ? 'bg-green-900/20 dark:bg-green-900/30 border-green-700 dark:border-green-600' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700', updated ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-neutral-900' : '']">
        <div class="flex items-start justify-between">
          <div class="font-medium text-neutral-800 dark:text-neutral-200">{{ typeLabel[item.type] }}</div>
          <div class="text-sm flex items-center gap-1" :class="pct(item) >= 100 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-neutral-500 dark:text-neutral-400'">
            <span v-if="pct(item) >= 100">✓</span>
            <span>{{ pct(item) }}%</span>
          </div>
        </div>
        <div class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{{ item.name }}</div>

        <div class="mt-3 h-4 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div class="h-full transition-all duration-300" :class="pct(item) >= 100 ? 'bg-green-600 dark:bg-green-500' : 'bg-neutral-800 dark:bg-neutral-300'" :style="{ width: pct(item) + '%' }"></div>
        </div>
        <div class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.currentAmount) }} / {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.targetAmount) }}
        </div>
       </div>

      <div class="mt-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm space-y-3">
        <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Update amount</div>
        <div class="mb-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            <button @click="completeGoal" class="cursor-pointer rounded-md bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-3 py-2 hover:bg-green-200 dark:hover:bg-green-800 text-sm font-medium">Complete Goal</button>
            <button @click="reachHalfway" class="cursor-pointer rounded-md bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-3 py-2 hover:bg-blue-200 dark:hover:bg-blue-800 text-sm font-medium">Reach Halfway</button>
            <button @click="addPercentageOfCurrent(50)" class="cursor-pointer rounded-md bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-3 py-2 hover:bg-amber-200 dark:hover:bg-amber-800 text-sm font-medium">Add 50% of Current</button>
            <button @click="addPercentageOfCurrent(25)" class="cursor-pointer rounded-md bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-3 py-2 hover:bg-amber-200 dark:hover:bg-amber-800 text-sm font-medium">Add 25% of Current</button>
            <button @click="addPercentageOfCurrent(10)" class="cursor-pointer rounded-md bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-3 py-2 hover:bg-amber-200 dark:hover:bg-amber-800 text-sm font-medium">Add 10% of Current</button>
          </div>
          <div v-if="currentPreview" class="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-2 rounded">{{ currentPreview }}</div>
        </div>
        <div class="flex items-center gap-3">
          <input v-model.number="delta" type="number" min="0" step="0.01" class="flex-1 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-3 py-2" placeholder="Amount" />
          <button @click="setAmount" class="cursor-pointer rounded-md bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 hover:bg-blue-700 dark:hover:bg-blue-600">Set</button>
          <button @click="applyDelta(1)" class="cursor-pointer rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-2 hover:bg-neutral-800 dark:hover:bg-neutral-200">Add</button>
          <button @click="applyDelta(-1)" class="cursor-pointer rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 hover:bg-neutral-300 dark:hover:bg-neutral-600">Subtract</button>
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Use Set to set exact amount. Use Add to record a deposit or repayment. Use Subtract to undo or record withdrawal.</p>
      </div>

      <div class="mt-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm space-y-3">
        <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Edit Details</div>
        <div>
          <label class="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">Name</label>
          <input v-model="editName" type="text" class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-3 py-2" placeholder="Item name" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">Target Amount</label>
            <input v-model.number="editTargetAmount" type="number" min="0" step="0.01" class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">Current Amount</label>
            <input v-model.number="editCurrentAmount" type="number" min="0" step="0.01" class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2" />
          </div>
        </div>
        <button @click="saveEdit" class="cursor-pointer rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 hover:bg-neutral-800 dark:hover:bg-neutral-200">Save Changes</button>
      </div>

      <div class="mt-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm space-y-3">
        <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Target Amount Adjustments</div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Apply percentage adjustment to target amount (positive for interest/add, negative for subtract)</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button @click="applyPercentageToTarget(-10)" class="cursor-pointer rounded-md bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-3 py-2 hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium">-10%</button>
          <button @click="applyPercentageToTarget(-25)" class="cursor-pointer rounded-md bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-3 py-2 hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium">-25%</button>
          <button @click="applyPercentageToTarget(-50)" class="cursor-pointer rounded-md bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-3 py-2 hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium">-50%</button>
          <button @click="applyPercentageToTarget(10)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+10%</button>
          <button @click="applyPercentageToTarget(25)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+25%</button>
          <button @click="applyPercentageToTarget(50)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+50%</button>
          <button @click="applyPercentageToTarget(100)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+100%</button>
        </div>
        <div class="flex items-center gap-2">
          <input v-model.number="customPercentage" type="number" step="0.1" class="flex-1 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-3 py-2 text-sm" placeholder="Custom % (negative to subtract)" />
          <button @click="applyCustomPercentageToTarget" class="cursor-pointer rounded-md bg-purple-600 dark:bg-purple-500 text-white px-3 py-2 hover:bg-purple-700 dark:hover:bg-purple-600 text-sm">Apply to Target</button>
        </div>
        <div v-if="previewCalculation" class="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">{{ previewCalculation }}</div>
      </div>

      

      <div class="mt-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm">
  <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Advanced Tools</div>
  <div class="pt-4 space-y-3">
    <p class="text-xs text-neutral-500 dark:text-neutral-400">Apply changes to both target and current amounts proportionally</p>
    <div class="grid grid-cols-2 gap-2">
      <button @click="multiplyTarget(2)" class="cursor-pointer rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 px-3 py-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-sm font-medium">Double Target</button>
      <button @click="multiplyTarget(0.5)" class="cursor-pointer rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 px-3 py-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-sm font-medium">Halve Target</button>
    </div>
    <div class="border-t border-neutral-200 dark:border-neutral-700 pt-3">
      <div class="text-xs font-medium mb-2 text-neutral-700 dark:text-neutral-300">Apply Interest to Both</div>
      <div class="grid grid-cols-3 gap-2">
        <button @click="applyInterestToBoth(10)" class="cursor-pointer rounded-md bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-3 py-2 hover:bg-rose-200 dark:hover:bg-rose-800 text-sm font-medium">+10%</button>
        <button @click="applyInterestToBoth(25)" class="cursor-pointer rounded-md bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-3 py-2 hover:bg-rose-200 dark:hover:bg-rose-800 text-sm font-medium">+25%</button>
        <button @click="applyInterestToBoth(50)" class="cursor-pointer rounded-md bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-3 py-2 hover:bg-rose-200 dark:hover:bg-rose-800 text-sm font-medium">+50%</button>
      </div>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Increases both target and current by the same percentage (compound interest)</p>
    </div>
  </div>
</div>
    </main>

    <main v-else class="mx-auto max-w-2xl px-4 py-10 text-center text-neutral-500 dark:text-neutral-400">
      Item not found.
    </main>

    <ConfirmModal
      :is-open="showDeleteModal"
      title="Delete Item"
      message="Are you sure you want to delete this item? This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>