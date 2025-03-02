/**
 * Get the current currency code from localStorage
 * @returns The current currency code
 */
export const getCurrentCurrencyCode = (): string => {
  return localStorage.getItem('preferredCurrency') || 'USD';
};

/**
 * Format a number as currency based on the user's preferred currency
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  // Get the user's preferred currency
  const currencyCode = getCurrentCurrencyCode();
  
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
 * Get the currency symbol for the user's preferred currency
 * @returns Currency symbol
 */
export const getCurrencySymbol = (): string => {
  const currencyCode = getCurrentCurrencyCode();
  
  // Format a zero amount and extract just the symbol
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(0);
  
  // Extract the symbol (everything before the first digit or space)
  const symbol = formatted.replace(/[\d\s.,]/g, '');
  
  return symbol;
};