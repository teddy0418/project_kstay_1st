"use client";

import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useExchangeRates } from "@/components/ui/ExchangeRatesProvider";

type Props = {
  baseTotal: number;
  fee: number;
  total: number;
  copy: { base: string; fee: string; total: string; included: string };
};

export default function CheckoutPriceDisplay({ baseTotal, fee, total, copy }: Props) {
  const { currency } = useCurrency();
  const { formatFromKRW } = useExchangeRates();

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-neutral-600">{copy.base}</span>
        <span>{formatFromKRW(baseTotal, currency)}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-neutral-600">{copy.fee}</span>
        <span>{formatFromKRW(fee, currency)}</span>
      </div>
      <div className="h-px bg-neutral-200 my-3" />
      <div className="flex justify-between font-semibold">
        <span>{copy.total}</span>
        <span>{formatFromKRW(total, currency)}</span>
      </div>
      <div className="mt-1 text-xs text-neutral-500">{copy.included}</div>
    </div>
  );
}
