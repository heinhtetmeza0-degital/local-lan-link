import { useSyncExternalStore } from "react";
import { subscribe, getCurrentUserId, getUser } from "./api";

export function useApiSubscription() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
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
