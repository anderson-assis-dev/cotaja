export const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, '');

  if (numericValue === '') return '';

  const number = parseInt(numericValue, 10);
  if (isNaN(number)) return '';

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const extractNumericValue = (formattedValue: string): number => {
  const numericValue = formattedValue.replace(/[^\d]/g, '');
  return parseInt(numericValue, 10) || 0;
};

export const formatDeadline = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, '');
  return numericValue;
};

export const validateDeadline = (value: string): boolean => {
  const days = parseInt(value, 10);
  return !isNaN(days) && days > 0 && days <= 365;
};

export const formatDeadlineDisplay = (days: number): string => {
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;
  if (days === 30) return '1 mês';
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} meses`;
    return `${months} meses e ${remainingDays} dias`;
  }
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) return `${years} ano${years > 1 ? 's' : ''}`;
  return `${years} ano${years > 1 ? 's' : ''} e ${remainingDays} dias`;
};

export const formatBudgetDisplay = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const formatPrice = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '0,00';

  const numValue = typeof value === 'string'
    ? parseFloat(value.replace(',', '.'))
    : value;

  if (isNaN(numValue)) return '0,00';

  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};