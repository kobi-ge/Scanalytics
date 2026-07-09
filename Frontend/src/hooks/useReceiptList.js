import { useCallback, useEffect, useRef, useState } from "react";
import { getReceiptsPage } from "../services/api";
import { useStore } from "../store/useStore";

export function useReceiptList() {
  const user = useStore((s) => s.user);
  const registerReceiptListReset = useStore((s) => s.registerReceiptListReset);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(
    async (cursor = null, append = false) => {
      if (!user) return;
      const setLoading = append ? setIsLoadingMore : setIsLoadingInitial;
      setLoading(true);
      setError(null);
      try {
        const params = { limit: 12 };
        if (cursor) params.cursor = cursor;
        const res = await getReceiptsPage(params);
        const newItems = res.data?.items || [];
        setItems((prev) => {
          if (!append) return newItems;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...newItems.filter((r) => !seen.has(r.id))];
        });
        setNextCursor(res.data?.next_cursor || null);
        setHasMore(Boolean(res.data?.has_more));
      } catch {
        setError("לא ניתן לטעון את הקבלות כרגע");
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        loadingMoreRef.current = false;
      }
    },
    [user],
  );

  const loadInitial = useCallback(() => loadPage(null, false), [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || !nextCursor || loadingMoreRef.current || isLoadingMore) return;
    loadingMoreRef.current = true;
    loadPage(nextCursor, true);
  }, [hasMore, nextCursor, isLoadingMore, loadPage]);

  const reset = useCallback(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
    loadPage(null, false);
  }, [loadPage]);

  useEffect(() => {
    registerReceiptListReset(reset);
    return () => registerReceiptListReset(null);
  }, [registerReceiptListReset, reset]);

  useEffect(() => {
    if (user) {
      loadInitial();
    } else {
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
    }
  }, [user, loadInitial]);

  return {
    items,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    error,
    loadMore,
    reset,
  };
}
