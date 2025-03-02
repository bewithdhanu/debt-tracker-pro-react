import { useUser } from '../contexts/UserContext';
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from '../lib/formatCurrency';

export const useCurrency = () => {
  const { currency } = useUser();

  const formatCurrency = (amount: number): string => {
    return formatCurrencyUtil(amount, currency.code);
  };

  const getSymbol = (): string => {
    return currency.symbol;
  };

  return {
    formatCurrency,
    getSymbol,
    currencyCode: currency.code,
  };
}; 