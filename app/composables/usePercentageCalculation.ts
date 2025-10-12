export interface PercentageCalculationResult {
  newValue: number;
  change: number;
  changePercent: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface PreviewText {
  calculation: string;
  description: string;
}

/**
 * Calculate the result of applying a percentage change to a value
 */
export function calculatePercentageChange(
  currentValue: number,
  percentage: number,
  allowNegativeResult = false
): PercentageCalculationResult {
  const change = currentValue * (percentage / 100);
  const newValue = currentValue + change;

  const isValid = allowNegativeResult ? true : newValue >= 0;
  const errorMessage = !isValid ? 'Result cannot be negative' : undefined;

  return {
    newValue: Math.max(0, newValue),
    change,
    changePercent: percentage,
    isValid,
    errorMessage,
  };
}

/**
 * Calculate the result of multiplying a value
 */
export function calculateMultiplication(
  currentValue: number,
  multiplier: number,
  allowNegativeResult = false
): PercentageCalculationResult {
  const newValue = currentValue * multiplier;
  const change = newValue - currentValue;
  const changePercent = ((newValue - currentValue) / currentValue) * 100;

  const isValid = allowNegativeResult ? true : newValue >= 0;
  const errorMessage = !isValid ? 'Result cannot be negative' : undefined;

  return {
    newValue: Math.max(0, newValue),
    change,
    changePercent,
    isValid,
    errorMessage,
  };
}

/**
 * Calculate a preset value (like "50% of target")
 */
export function calculatePresetValue(
  baseValue: number,
  percentage: number
): PercentageCalculationResult {
  const newValue = baseValue * (percentage / 100);
  const change = 0; // Not a change, just setting to a preset

  return {
    newValue,
    change,
    changePercent: 0,
    isValid: true,
  };
}

/**
 * Format currency consistently across the app
 */
export function formatCurrency(amount: number): string {
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate preview text for display in modal
 */
export function generatePreviewText(
  currentValue: number,
  result: PercentageCalculationResult,
  operationType: 'percentage' | 'multiply' | 'preset'
): PreviewText {
  const current = formatCurrency(currentValue);
  const newVal = formatCurrency(result.newValue);
  const changeCurrency = formatCurrency(Math.abs(result.change));
  const sign = result.change >= 0 ? '+' : '-';

  let calculation = '';
  let description = '';

  switch (operationType) {
    case 'percentage':
      calculation = `${current} → ${newVal}`;
      if (result.change !== 0) {
        const pctSign = result.changePercent >= 0 ? '+' : '';
        description = `${sign}${changeCurrency} (${pctSign}${result.changePercent.toFixed(1)}%)`;
      } else {
        description = 'No change';
      }
      break;

    case 'multiply':
      calculation = `${current} → ${newVal}`;
      if (result.change !== 0) {
        description = `${sign}${changeCurrency} (${result.changePercent.toFixed(1)}% change)`;
      } else {
        description = 'No change';
      }
      break;

    case 'preset':
      calculation = newVal;
      description = 'Set to this amount';
      break;
  }

  return {
    calculation,
    description,
  };
}

/**
 * Validate percentage input
 */
export function validatePercentageInput(
  value: string | number | null,
  allowNegative = true
): { isValid: boolean; errorMessage?: string; numericValue: number } {
  if (value === null || value === '') {
    return {
      isValid: false,
      errorMessage: 'Please enter a percentage',
      numericValue: 0,
    };
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid number',
      numericValue: 0,
    };
  }

  if (!allowNegative && numericValue < 0) {
    return {
      isValid: false,
      errorMessage: 'Percentage cannot be negative',
      numericValue: 0,
    };
  }

  return {
    isValid: true,
    numericValue,
  };
}

/**
 * Validate multiplier input
 */
export function validateMultiplierInput(
  value: string | number | null
): { isValid: boolean; errorMessage?: string; numericValue: number } {
  if (value === null || value === '') {
    return {
      isValid: false,
      errorMessage: 'Please enter a multiplier',
      numericValue: 1,
    };
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid number',
      numericValue: 1,
    };
  }

  if (numericValue < 0) {
    return {
      isValid: false,
      errorMessage: 'Multiplier cannot be negative',
      numericValue: 1,
    };
  }

  return {
    isValid: true,
    numericValue,
  };
}
