/** Format whole Taka as e.g. ৳1,650 */
export function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString("en-US")}`;
}
