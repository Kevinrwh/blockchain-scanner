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

export function formatAge(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr${years !== 1 ? 's' : ''} ago`;
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
  
  const headers = ['Date', 'Chain', 'Status', 'Type', 'Amount', 'Token', 'Protocol', 'Fee', 'From', 'To', 'TX Hash'];
  const rows = transactions.map(tx => [
    tx.date,
    tx.chain,
    tx.status || 'success',
    tx.type.toUpperCase(),
    tx.amount,
    tx.tokenSymbol,
    tx.protocol || '',
    tx.fee ? `${tx.fee} ${tx.chain === 'Solana' ? 'SOL' : 'ETH'}` : '',
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
