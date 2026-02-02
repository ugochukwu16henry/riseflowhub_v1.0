'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SetupPaymentContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');
  const successUrl = searchParams.get('success');
  const cancelUrl = searchParams.get('cancel');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !ref) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-600">Invalid payment session.</p>
      </div>
    );
  }

  function handleConfirm() {
    const url = successUrl || `/dashboard?setup_success=1&ref=${encodeURIComponent(ref!)}`;
    window.location.href = url;
  }

  function handleCancel() {
    window.location.href = cancelUrl || '/dashboard';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h1 className="text-xl font-bold text-secondary mb-2">Setup Fee Payment</h1>
        <p className="text-gray-600 text-sm mb-6">
          Simulated payment. In production this would redirect to Stripe, Paystack, or your payment gateway.
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Amount</p>
          <p className="text-2xl font-bold text-secondary">
            {currency || 'USD'} {amount ? Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl py-3 px-4 font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl py-3 px-4 font-semibold text-white bg-primary hover:opacity-90"
          >
            Confirm payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetupPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Loading…</div>}>
      <SetupPaymentContent />
    </Suspense>
  );
}
