import { useUser } from '../contexts/UserContext';
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from '../lib/formatCurrency';

export const useCurrency = () => {
  const { currency } = useUser();

  const formatCurrency = (amount: number): string => {
    // Ensure we always have a currency code, fallback to USD if not available
    const currencyCode = currency?.code || 'USD';
    return formatCurrencyUtil(amount, currencyCode);
  };

  const getSymbol = (): string => {
    const currencyCode = currency?.code || 'USD';
    return getCurrencySymbol(currencyCode);
  };

  return {
    formatCurrency,
    getSymbol,
    currencyCode: currency?.code || 'USD',
  };
}; 