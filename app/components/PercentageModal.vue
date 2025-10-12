<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  calculatePercentageChange,
  calculateMultiplication,
  calculatePresetValue,
  generatePreviewText,
  validatePercentageInput,
  validateMultiplierInput,
  formatCurrency,
  type PercentageCalculationResult,
} from '../composables/usePercentageCalculation';

export interface PresetOption {
  label: string;
  value: number;
  isPercentage: boolean;
}

interface Props {
  isOpen: boolean;
  title: string;
  operationType: 'percentage' | 'multiply' | 'preset';
  currentValue: number;
  targetValue?: number;
  presetOptions?: PresetOption[];
  variant?: 'increase' | 'decrease' | 'neutral' | 'multiply' | 'mixed';
  valueLabel?: string;
  allowNegative?: boolean;
  showPreview?: boolean;
  initialValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  presetOptions: () => [],
  variant: 'neutral',
  valueLabel: 'Amount',
  allowNegative: false,
  showPreview: true,
  initialValue: undefined,
});

const emit = defineEmits<{
  confirm: [result: { value: number; percentage?: number; multiplier?: number }];
  cancel: [];
}>();

const customInput = ref<number | null>(null);
const selectedPreset = ref<number | null>(null);
const inputElement = ref<HTMLInputElement | null>(null);

// Reset when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    customInput.value = props.initialValue ?? null;
    selectedPreset.value = props.initialValue ?? null;
    document.body.style.overflow = 'hidden';
    // Focus custom input after modal animation
    setTimeout(() => {
      if (props.initialValue === undefined) {
        inputElement.value?.focus();
      }
    }, 100);
  } else {
    customInput.value = null;
    selectedPreset.value = null;
    document.body.style.overflow = '';
  }
});

// Current selected value (either custom or preset)
const currentSelectedValue = computed(() => {
  if (customInput.value !== null && customInput.value !== undefined) {
    return customInput.value;
  }
  return selectedPreset.value;
});

// Calculate result based on operation type and current selection
const calculationResult = computed<PercentageCalculationResult | null>(() => {
  const value = currentSelectedValue.value;
  if (value === null || value === undefined) return null;

  switch (props.operationType) {
    case 'percentage':
      return calculatePercentageChange(props.currentValue, value, props.allowNegative);
    case 'multiply':
      return calculateMultiplication(props.currentValue, value, props.allowNegative);
    case 'preset':
      return calculatePresetValue(props.targetValue ?? props.currentValue, value);
    default:
      return null;
  }
});

// Preview text
const previewText = computed(() => {
  if (!calculationResult.value) return null;
  return generatePreviewText(props.currentValue, calculationResult.value, props.operationType);
});

// Validation
const validation = computed(() => {
  const value = currentSelectedValue.value;

  if (value === null || value === undefined) {
    return { isValid: false, errorMessage: undefined };
  }

  if (props.operationType === 'multiply') {
    return validateMultiplierInput(value);
  } else {
    return validatePercentageInput(value, props.allowNegative);
  }
});

const isConfirmDisabled = computed(() => {
  return !validation.value.isValid || !calculationResult.value?.isValid;
});

function handlePresetClick(option: PresetOption) {
  selectedPreset.value = option.value;
  customInput.value = null; // Clear custom input when preset is clicked
}

function handleCustomInputChange() {
  selectedPreset.value = null; // Clear preset when custom input changes
}

function handleConfirm() {
  if (isConfirmDisabled.value || !calculationResult.value) return;

  const value = currentSelectedValue.value!;

  if (props.operationType === 'percentage') {
    emit('confirm', {
      value: calculationResult.value.newValue,
      percentage: value,
    });
  } else if (props.operationType === 'multiply') {
    emit('confirm', {
      value: calculationResult.value.newValue,
      multiplier: value,
    });
  } else {
    emit('confirm', {
      value: calculationResult.value.newValue,
    });
  }
}

function handleCancel() {
  emit('cancel');
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return;
  if (e.key === 'Escape') {
    handleCancel();
  } else if (e.key === 'Enter' && !isConfirmDisabled.value) {
    handleConfirm();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});

// Variant styling
const variantClasses = {
  increase: {
    button: 'bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 dark:hover:bg-purple-600',
    preview: 'bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-700',
    badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  },
  decrease: {
    button: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600',
    preview: 'bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-700',
    badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  },
  multiply: {
    button: 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600',
    preview: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 border-indigo-200 dark:border-indigo-700',
    badge: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
  },
  neutral: {
    button: 'bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600',
    preview: 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-700',
    badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  },
  mixed: {
    button: 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200',
    preview: 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700',
    badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
  },
};

const currentVariantClasses = computed(() => variantClasses[props.variant]);

// Dynamic preset button colors based on value
function getPresetButtonClass(option: PresetOption) {
  if (selectedPreset.value === option.value) {
    return 'ring-2 ring-offset-2 dark:ring-offset-neutral-900 ' + currentVariantClasses.value.button;
  }

  // Color code based on value if variant is mixed
  if (props.variant === 'mixed') {
    if (option.value < 0) {
      return 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800';
    } else if (option.value > 0) {
      return 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-800';
    }
  }

  // Default preset styling
  return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700';
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-150"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        @click.self="handleCancel"
      >
        <div class="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-2xl transition-all">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {{ title }}
            </h2>
            <button
              @click="handleCancel"
              class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition -mr-2 -mt-1 p-1"
              aria-label="Close modal"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Current Value Display -->
          <div class="mt-4">
            <div class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              {{ valueLabel }}
            </div>
            <div class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {{ formatCurrency(currentValue) }}
            </div>
            <div v-if="targetValue !== undefined && targetValue !== currentValue" class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Target: {{ formatCurrency(targetValue) }}
            </div>
          </div>

          <!-- Preset Options -->
          <div v-if="presetOptions.length > 0" class="mt-5">
            <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Quick Presets
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                v-for="option in presetOptions"
                :key="option.label"
                @click="handlePresetClick(option)"
                class="cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all transform hover:scale-105 active:scale-95"
                :class="getPresetButtonClass(option)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Custom Input -->
          <div class="mt-5">
            <label class="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {{ operationType === 'multiply' ? 'Custom Multiplier' : 'Custom Percentage' }}
            </label>
            <div class="relative">
              <input
                ref="inputElement"
                v-model.number="customInput"
                @input="handleCustomInputChange"
                type="number"
                :step="operationType === 'multiply' ? '0.1' : '1'"
                class="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 px-3 py-2 pr-8 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition"
                :class="validation.errorMessage ? 'border-red-500 focus:ring-red-500' : 'focus:ring-neutral-900 dark:focus:ring-neutral-100'"
                :placeholder="operationType === 'multiply' ? 'e.g., 2.5' : (allowNegative ? 'e.g., 15 or -20' : 'e.g., 15')"
                aria-describedby="input-error input-help"
              />
              <span v-if="operationType !== 'multiply'" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 pointer-events-none">
                %
              </span>
            </div>
            <p v-if="validation.errorMessage" id="input-error" class="text-xs text-red-600 dark:text-red-400 mt-1">
              {{ validation.errorMessage }}
            </p>
            <p v-else-if="allowNegative && operationType === 'percentage'" id="input-help" class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Use positive numbers to increase, negative to decrease (e.g., -25 to subtract 25%)
            </p>
            <p v-else-if="operationType === 'percentage'" id="input-help" class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Enter a positive percentage
            </p>
          </div>

          <!-- Preview -->
          <div v-if="showPreview && previewText && calculationResult?.isValid" class="mt-5">
            <div class="rounded-lg border p-4 transition-all" :class="currentVariantClasses.preview">
              <div class="text-xs font-medium uppercase tracking-wide opacity-75 mb-1">
                Preview
              </div>
              <div class="text-lg font-bold">
                {{ previewText.calculation }}
              </div>
              <div v-if="previewText.description" class="text-sm mt-1 opacity-90">
                {{ previewText.description }}
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="calculationResult && !calculationResult.isValid" class="mt-5">
            <div class="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 p-3">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div class="text-sm">
                  {{ calculationResult.errorMessage }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex gap-3 justify-end">
            <button
              @click="handleCancel"
              class="cursor-pointer rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-5 py-2 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition font-medium"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              :disabled="isConfirmDisabled"
              class="cursor-pointer rounded-md px-5 py-2 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              :class="isConfirmDisabled ? 'bg-neutral-400 dark:bg-neutral-600 text-neutral-200 dark:text-neutral-400' : currentVariantClasses.button"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
