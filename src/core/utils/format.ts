export const formatCoins = (amount: number) =>
  `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)} KD`;

export const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

export const compactId = (value: string, head = 6, tail = 4) => {
  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
