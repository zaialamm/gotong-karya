"use client";

import { useState, useEffect } from 'react';
import { FALLBACK_SOL_TO_IDR_RATE } from '@/lib/constants';

export function useSolToIdrRate() {
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRate() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/exchange-rate');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch exchange rate details' }));
          throw new Error(errorData.error || `Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.rate && typeof data.rate === 'number') {
          setLiveRate(data.rate);
        } else {
          throw new Error(data.error || 'Rate not found or invalid in API response');
        }
      } catch (e) {
        console.error("Error fetching SOL/IDR rate in useSolToIdrRate hook:", e);
        setError((e as Error).message);
        setLiveRate(null); // Ensure liveRate is null on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchRate();
  }, []); // Empty dependency array means this effect runs once on mount

  const effectiveRate = liveRate ?? FALLBACK_SOL_TO_IDR_RATE;

  return { liveRate, isLoading, error, effectiveRate, FALLBACK_SOL_TO_IDR_RATE };
}