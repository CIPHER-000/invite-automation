import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export function useRealtimeData(queryKey: string[], intervalMs = 30000) {
  const query = useQuery({
    queryKey,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
  });

  return query;
}

export function useRealtimeStats() {
  return useRealtimeData(["/api/dashboard/stats"], 10000);
}

export function useRealtimeActivity() {
  return useRealtimeData(["/api/activity?limit=20"], 15000);
}

export function useRealtimeAccounts() {
  return useRealtimeData(["/api/accounts"], 20000);
}

export function useRealtimeQueue() {
  return useRealtimeData(["/api/queue/status"], 5000);
}

// Auto-refresh when window gains focus
export function useAutoRefresh(queryKeys: string[]) {
  useEffect(() => {
    const handleFocus = () => {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryKeys]);
}
