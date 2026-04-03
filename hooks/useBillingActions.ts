'use client';

import { useCallback, useState } from 'react';
import { useAppDispatch } from '../store/store';
import { setBilling } from '../store/slices/authSlice';
import { createPortalSession, fetchBillingStatus, startCheckout } from '../services/billingClient';
import { PaidPlan } from '../types/billing';

export function useBillingActions() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const beginCheckout = useCallback(
    async (plan: PaidPlan) => {
      setLoading(true);
      setError(null);

      try {
        const url = await startCheckout(plan);
        window.location.assign(url);
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : 'Unable to start checkout.',
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const openPortal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = await createPortalSession();
      window.location.assign(url);
    } catch (portalError) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : 'Unable to open billing portal.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBilling = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const billing = await fetchBillingStatus();
      dispatch(setBilling(billing));
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Unable to refresh billing status.',
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    loading,
    error,
    clearError,
    beginCheckout,
    openPortal,
    refreshBilling,
  };
}
