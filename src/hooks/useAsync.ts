import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Re-run in the background: keeps the current data on screen (no spinner), and keeps it if the refresh fails. */
  refresh: () => void;
}

/** Run an async fn on mount (and on `deps` change); expose data/loading/error/reload. */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const silent = useRef(false);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const refresh = useCallback(() => { silent.current = true; setNonce((n) => n + 1); }, []);

  useEffect(() => {
    let alive = true;
    const quiet = silent.current;
    silent.current = false;
    if (!quiet) { setLoading(true); setError(null); }
    fnRef
      .current()
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((e: any) => {
        if (alive && !quiet)
          setError(
            e?.response?.data?.message || e?.message || "Something went wrong",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload, refresh };
}
