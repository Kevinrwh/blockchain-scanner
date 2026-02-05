export function formatTokenAmount(amount: string, decimals: number): string {
  try {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    const remainder = num % divisor;
    
    if (remainder === BigInt(0)) {
      return whole.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmed = remainderStr.replace(/0+$/, '');
    
    return `${whole}.${trimmed}`;
  } catch {
    return '0';
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  let hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hoursStr}:${minutes}:${seconds} ${ampm} UTC`;
}

export function exportToCSV(transactions: any[]): void {
  if (transactions.length === 0) return;
  
  const headers = ['Date', 'Chain', 'Type', 'Amount', 'Token', 'From', 'To', 'TX Hash'];
  const rows = transactions.map(tx => [
    tx.date,
    tx.chain,
    tx.type.toUpperCase(),
    tx.amount,
    tx.tokenSymbol,
    tx.from,
    tx.to,
    tx.hash
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
