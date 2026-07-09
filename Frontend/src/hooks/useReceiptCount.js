import { useEffect } from "react";
import { useStore } from "../store/useStore";

export function useReceiptCount() {
  const receiptCount = useStore((s) => s.receiptCount);
  const receiptCountError = useStore((s) => s.receiptCountError);
  const fetchReceiptCount = useStore((s) => s.fetchReceiptCount);
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (user) {
      fetchReceiptCount();
    }
  }, [user, fetchReceiptCount]);

  return { receiptCount, receiptCountError, refetch: fetchReceiptCount };
}
