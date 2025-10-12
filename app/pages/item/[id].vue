<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useFinanceStore, type FinanceItem } from '../../composables/useFinanceStore';
import type { PresetOption } from '../../components/PercentageModal.vue';

const route = useRoute();
const router = useRouter();
const { getById, upsert, remove } = useFinanceStore();

const id = String(route.params.id ?? '');
const item = computed(() => getById(id));

const delta = ref<number | null>(null);

// Keep existing non-percentage modals
const showDeleteModal = ref(false);
const showSetAmountModal = ref(false);
const showAddDeltaModal = ref(false);
const showSubtractDeltaModal = ref(false);
const showSaveEditModal = ref(false);

// New unified percentage modals
const showTargetAdjustModal = ref(false);
const targetAdjustInitialValue = ref<number | undefined>(undefined);

const showCurrentAdjustModal = ref(false);
const currentAdjustInitialValue = ref<number | undefined>(undefined);
const currentAdjustMode = ref<'percentage' | 'preset'>('percentage'); // Track if it's % or preset

const showMultiplyModal = ref(false);
const multiplyInitialValue = ref<number | undefined>(undefined);

const showInterestModal = ref(false);
const interestInitialValue = ref<number | undefined>(undefined);

// Preset options for modals
const targetAdjustPresets: PresetOption[] = [
  { label: '-50%', value: -50, isPercentage: true },
  { label: '-25%', value: -25, isPercentage: true },
  { label: '-10%', value: -10, isPercentage: true },
  { label: '+10%', value: 10, isPercentage: true },
  { label: '+25%', value: 25, isPercentage: true },
  { label: '+50%', value: 50, isPercentage: true },
  { label: '+100%', value: 100, isPercentage: true },
];

const currentPercentagePresets: PresetOption[] = [
  { label: '-50%', value: -50, isPercentage: true },
  { label: '-25%', value: -25, isPercentage: true },
  { label: '-10%', value: -10, isPercentage: true },
  { label: '+10%', value: 10, isPercentage: true },
  { label: '+25%', value: 25, isPercentage: true },
  { label: '+50%', value: 50, isPercentage: true },
];

const currentPresetOptions: PresetOption[] = [
  { label: 'Halfway', value: 50, isPercentage: true },
  { label: 'Complete', value: 100, isPercentage: true },
];

const multiplyPresets: PresetOption[] = [
  { label: 'Halve (0.5×)', value: 0.5, isPercentage: false },
  { label: '0.75×', value: 0.75, isPercentage: false },
  { label: '1.5×', value: 1.5, isPercentage: false },
  { label: 'Double (2×)', value: 2, isPercentage: false },
];

const interestPresets: PresetOption[] = [
  { label: '+10%', value: 10, isPercentage: true },
  { label: '+25%', value: 25, isPercentage: true },
  { label: '+50%', value: 50, isPercentage: true },
];

useHead(() => ({ title: item.value?.name ? `${item.value.name} - Finman` : 'Item - Finman' }))

// Edit form fields
const editName = ref('');
const editTargetAmount = ref<number | null>(null);
const editCurrentAmount = ref<number | null>(null);

// UI state
const updated = ref(false);

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
  if (sign === 1) {
    showAddDeltaModal.value = true;
  } else {
    showSubtractDeltaModal.value = true;
  }
}

function executeApplyDelta(sign: 1 | -1) {
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
  showAddDeltaModal.value = false;
  showSubtractDeltaModal.value = false;
}

function setAmount() {
  showSetAmountModal.value = true;
}

function executeSetAmount() {
  const i = item.value;
  if (!i) return;
  upsert({
    id: i.id,
    currentAmount: Math.max(0, Number(delta.value ?? 0)),
  });
  delta.value = null;
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
  showSetAmountModal.value = false;
}

function saveEdit() {
  showSaveEditModal.value = true;
}

function executeSaveEdit() {
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
  showSaveEditModal.value = false;
}

function confirmDelete() {
  const i = item.value;
  if (!i) return;
  remove(i.id);
  router.push('/');
}

// Target amount adjustments
function openTargetAdjustModal(initialPercentage?: number) {
  targetAdjustInitialValue.value = initialPercentage;
  showTargetAdjustModal.value = true;
}

function handleTargetAdjustConfirm(result: { value: number; percentage?: number }) {
  const i = item.value;
  if (!i) return;

  upsert({
    id: i.id,
    targetAmount: result.value,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
  showTargetAdjustModal.value = false;
}

// Current amount adjustments
function openCurrentAdjustModal(initialValue: number, mode: 'percentage' | 'preset' = 'percentage') {
  currentAdjustInitialValue.value = initialValue;
  currentAdjustMode.value = mode;
  showCurrentAdjustModal.value = true;
}

function handleCurrentAdjustConfirm(result: { value: number; percentage?: number }) {
  const i = item.value;
  if (!i) return;

  upsert({
    id: i.id,
    currentAmount: result.value,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
  showCurrentAdjustModal.value = false;
}

// Advanced tools - Multiply
function openMultiplyModal(initialMultiplier?: number) {
  multiplyInitialValue.value = initialMultiplier;
  showMultiplyModal.value = true;
}

function handleMultiplyConfirm(result: { value: number; multiplier?: number }) {
  const i = item.value;
  if (!i) return;

  upsert({
    id: i.id,
    targetAmount: result.value,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
  showMultiplyModal.value = false;
}

// Advanced tools - Interest
function openInterestModal(initialPercentage?: number) {
  interestInitialValue.value = initialPercentage;
  showInterestModal.value = true;
}

function handleInterestConfirm(result: { value: number; percentage?: number }) {
  const i = item.value;
  if (!i) return;

  // Apply same percentage to current amount
  const percentage = result.percentage ?? 0;
  const currentIncrease = i.currentAmount * (percentage / 100);

  upsert({
    id: i.id,
    targetAmount: result.value,
    currentAmount: i.currentAmount + currentIncrease,
  });
  updated.value = true;
  setTimeout(() => updated.value = false, 1000);
  showInterestModal.value = false;
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
            <button @click="openCurrentAdjustModal(100, 'preset')" class="cursor-pointer rounded-md bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-3 py-2 hover:bg-green-200 dark:hover:bg-green-800 text-sm font-medium">Complete Goal</button>
            <button @click="openCurrentAdjustModal(50, 'preset')" class="cursor-pointer rounded-md bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-3 py-2 hover:bg-blue-200 dark:hover:bg-blue-800 text-sm font-medium">Reach Halfway</button>
            <button @click="openCurrentAdjustModal(50, 'percentage')" class="cursor-pointer rounded-md bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-3 py-2 hover:bg-amber-200 dark:hover:bg-amber-800 text-sm font-medium">Add 50% of Current</button>
            <button @click="openCurrentAdjustModal(25, 'percentage')" class="cursor-pointer rounded-md bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-3 py-2 hover:bg-amber-200 dark:hover:bg-amber-800 text-sm font-medium">Add 25% of Current</button>
            <button @click="openCurrentAdjustModal(10, 'percentage')" class="cursor-pointer rounded-md bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-3 py-2 hover:bg-amber-200 dark:hover:bg-amber-800 text-sm font-medium">Add 10% of Current</button>
            <button @click="openCurrentAdjustModal(undefined, 'percentage')" class="cursor-pointer rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 px-3 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium">Custom %</button>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <input v-model.number="delta" type="number" min="0" step="0.01" class="flex-1 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-3 py-2" placeholder="Amount" />
            <button @click="applyDelta(1)" class="cursor-pointer rounded-md bg-green-600 dark:bg-green-500 text-white px-6 py-2 hover:bg-green-700 dark:hover:bg-green-600 font-medium transition-colors">Add</button>
            <button @click="applyDelta(-1)" class="cursor-pointer rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">Subtract</button>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <p class="text-xs text-neutral-500 dark:text-neutral-400">Use Add to record a deposit or repayment. Use Subtract to undo or record withdrawal.</p>
            <button @click="setAmount" class="cursor-pointer rounded-md bg-neutral-600 dark:bg-neutral-500 text-white px-3 py-1.5 hover:bg-neutral-700 dark:hover:bg-neutral-400 text-sm transition-colors whitespace-nowrap">Set Exact</button>
          </div>
        </div>
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
          <button @click="openTargetAdjustModal(-10)" class="cursor-pointer rounded-md bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-3 py-2 hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium">-10%</button>
          <button @click="openTargetAdjustModal(-25)" class="cursor-pointer rounded-md bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-3 py-2 hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium">-25%</button>
          <button @click="openTargetAdjustModal(-50)" class="cursor-pointer rounded-md bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 px-3 py-2 hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium">-50%</button>
          <button @click="openTargetAdjustModal(10)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+10%</button>
          <button @click="openTargetAdjustModal(25)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+25%</button>
          <button @click="openTargetAdjustModal(50)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+50%</button>
          <button @click="openTargetAdjustModal(100)" class="cursor-pointer rounded-md bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-3 py-2 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm font-medium">+100%</button>
          <button @click="openTargetAdjustModal()" class="cursor-pointer rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 px-3 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium">Custom %</button>
        </div>
      </div>

      

      <div class="mt-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm">
  <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Advanced Tools</div>
  <div class="pt-4 space-y-3">
    <p class="text-xs text-neutral-500 dark:text-neutral-400">Multiply target amount by a factor</p>
    <div class="grid grid-cols-2 gap-2">
      <button @click="openMultiplyModal(2)" class="cursor-pointer rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 px-3 py-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-sm font-medium">Double Target</button>
      <button @click="openMultiplyModal(0.5)" class="cursor-pointer rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 px-3 py-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-sm font-medium">Halve Target</button>
      <button @click="openMultiplyModal()" class="cursor-pointer rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 px-3 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium col-span-2">Custom Multiplier</button>
    </div>
    <div class="border-t border-neutral-200 dark:border-neutral-700 pt-3">
      <div class="text-xs font-medium mb-2 text-neutral-700 dark:text-neutral-300">Apply Interest to Both</div>
      <div class="grid grid-cols-3 gap-2">
        <button @click="openInterestModal(10)" class="cursor-pointer rounded-md bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-3 py-2 hover:bg-rose-200 dark:hover:bg-rose-800 text-sm font-medium">+10%</button>
        <button @click="openInterestModal(25)" class="cursor-pointer rounded-md bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-3 py-2 hover:bg-rose-200 dark:hover:bg-rose-800 text-sm font-medium">+25%</button>
        <button @click="openInterestModal(50)" class="cursor-pointer rounded-md bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-3 py-2 hover:bg-rose-200 dark:hover:bg-rose-800 text-sm font-medium">+50%</button>
        <button @click="openInterestModal()" class="cursor-pointer rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 px-3 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium col-span-3">Custom %</button>
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

    <!-- Percentage Modals -->
    <PercentageModal
      :is-open="showTargetAdjustModal"
      title="Adjust Target Amount"
      operation-type="percentage"
      :current-value="item?.targetAmount || 0"
      :preset-options="targetAdjustPresets"
      variant="mixed"
      value-label="Current Target"
      :allow-negative="true"
      :initial-value="targetAdjustInitialValue"
      @confirm="handleTargetAdjustConfirm"
      @cancel="showTargetAdjustModal = false"
    />

    <PercentageModal
      v-if="currentAdjustMode === 'percentage'"
      :is-open="showCurrentAdjustModal"
      title="Adjust Current Amount"
      operation-type="percentage"
      :current-value="item?.currentAmount || 0"
      :preset-options="currentPercentagePresets"
      variant="mixed"
      value-label="Current Amount"
      :allow-negative="true"
      :initial-value="currentAdjustInitialValue"
      @confirm="handleCurrentAdjustConfirm"
      @cancel="showCurrentAdjustModal = false"
    />

    <PercentageModal
      v-if="currentAdjustMode === 'preset'"
      :is-open="showCurrentAdjustModal"
      title="Set Current Amount"
      operation-type="preset"
      :current-value="item?.targetAmount || 0"
      :target-value="item?.targetAmount || 0"
      :preset-options="currentPresetOptions"
      variant="neutral"
      value-label="Target Amount"
      :allow-negative="false"
      :initial-value="currentAdjustInitialValue"
      @confirm="handleCurrentAdjustConfirm"
      @cancel="showCurrentAdjustModal = false"
    />

    <PercentageModal
      :is-open="showMultiplyModal"
      title="Multiply Target Amount"
      operation-type="multiply"
      :current-value="item?.targetAmount || 0"
      :preset-options="multiplyPresets"
      variant="multiply"
      value-label="Current Target"
      :allow-negative="false"
      :initial-value="multiplyInitialValue"
      @confirm="handleMultiplyConfirm"
      @cancel="showMultiplyModal = false"
    />

    <PercentageModal
      :is-open="showInterestModal"
      title="Apply Interest to Both"
      operation-type="percentage"
      :current-value="item?.targetAmount || 0"
      :preset-options="interestPresets"
      variant="increase"
      value-label="Target Amount"
      :allow-negative="false"
      :initial-value="interestInitialValue"
      @confirm="handleInterestConfirm"
      @cancel="showInterestModal = false"
    />

    <ConfirmModal
      :is-open="showSetAmountModal"
      variant="primary"
      title="Set Current Amount"
      :message="`Set current amount to ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(delta ?? 0))}?`"
      confirm-text="Set"
      cancel-text="Cancel"
      @confirm="executeSetAmount"
      @cancel="showSetAmountModal = false"
    />

    <ConfirmModal
      :is-open="showAddDeltaModal"
      variant="success"
      title="Add to Current Amount"
      :message="`Add ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(delta ?? 0))} to current amount? New amount will be ${item ? Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.currentAmount + Number(delta ?? 0)) : '$0.00'}.`"
      confirm-text="Add"
      cancel-text="Cancel"
      @confirm="executeApplyDelta(1)"
      @cancel="showAddDeltaModal = false"
    />

    <ConfirmModal
      :is-open="showSubtractDeltaModal"
      variant="warning"
      title="Subtract from Current Amount"
      :message="`Subtract ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(delta ?? 0))} from current amount? New amount will be ${item ? Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.max(0, item.currentAmount - Number(delta ?? 0))) : '$0.00'}.`"
      confirm-text="Subtract"
      cancel-text="Cancel"
      @confirm="executeApplyDelta(-1)"
      @cancel="showSubtractDeltaModal = false"
    />

    <ConfirmModal
      :is-open="showSaveEditModal"
      variant="primary"
      title="Save Changes"
      :message="`Save changes to ${editName.trim() || 'Untitled'}? Target: ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(editTargetAmount ?? 0))}, Current: ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(editCurrentAmount ?? 0))}`"
      confirm-text="Save"
      cancel-text="Cancel"
      @confirm="executeSaveEdit"
      @cancel="showSaveEditModal = false"
    />
  </div>
</template>