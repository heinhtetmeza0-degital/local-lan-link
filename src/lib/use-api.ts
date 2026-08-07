import { useSyncExternalStore } from "react";
import { subscribe, getCurrentUserId, getUser } from "./api";

export function useApiSubscription() {
  return useSyncExternalStore(
    (cb) => {
      const unsub = subscribe(cb);
      const onSync = () => {
        counter++;
        cb();
      };
      if (typeof window !== "undefined") window.addEventListener("shwe-synced", onSync);
      return () => {
        unsub();
        if (typeof window !== "undefined") window.removeEventListener("shwe-synced", onSync);
      };
    },
    () => tick(),
    () => 0,
  );
}
let counter = 0;
let last = 0;
subscribe(() => {
  counter++;
});
function tick() {
  // return a monotonic number so React re-renders on any store change
  last = counter;
  return last;
}

export function useCurrentUser() {
  useApiSubscription();
  const id = getCurrentUserId();
  return id ? (getUser(id) ?? null) : null;
}
