// Função para formatar valor monetário
export const formatCurrency = (value: string): string => {
  // Remove tudo que não é número
  const numericValue = value.replace(/[^\d]/g, '');
  
  if (numericValue === '') return '';
  
  // Converte para número e formata
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) return '';
  
  // Formata como moeda brasileira
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Função para extrair valor numérico do texto formatado
export const extractNumericValue = (formattedValue: string): number => {
  const numericValue = formattedValue.replace(/[^\d]/g, '');
  return parseInt(numericValue, 10) || 0;
};

// Função para formatar prazo (apenas números)
export const formatDeadline = (value: string): string => {
  // Remove tudo que não é número
  const numericValue = value.replace(/[^\d]/g, '');
  return numericValue;
};

// Função para validar prazo
export const validateDeadline = (value: string): boolean => {
  const days = parseInt(value, 10);
  return !isNaN(days) && days > 0 && days <= 365; // Máximo 1 ano
};

// Função para formatar exibição do prazo
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

// Função para formatar orçamento para exibição
export const formatBudgetDisplay = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}; 