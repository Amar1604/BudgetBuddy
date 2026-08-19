export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  INR: '₹',
  BRL: 'R$',
  MXN: 'Mex$',
  CHF: 'CHF'
};

export const getCurrencySymbol = (pref) => {
  return CURRENCY_SYMBOLS[pref] || '₹';
};

export const formatCurrency = (amount, pref = 'INR') => {
  const symbol = getCurrencySymbol(pref);
  return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};
