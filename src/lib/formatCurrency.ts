/**
 * Get the current currency code from localStorage
 * @returns The current currency code
 */
export const getCurrentCurrencyCode = (): string => {
  return localStorage.getItem('preferredCurrency') || 'USD';
};

/**
 * Format a number as currency using the specified currency code
 * @param amount The amount to format
 * @param currencyCode The currency code to use for formatting
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  // Define currency formatting options
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  // Special case for JPY and other currencies that don't use decimal places
  if (currencyCode === 'JPY' || currencyCode === 'KRW' || currencyCode === 'VND') {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }
  
  return new Intl.NumberFormat('en-US', options).format(amount);
};

/**
 * Get the currency symbol for a specific currency code
 * @param currencyCode The currency code to get the symbol for
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  // Format a zero amount and extract just the symbol
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(0);
  
  // Extract the symbol (everything before the first digit or space)
  return formatted.replace(/[\d\s.,]/g, '');
};