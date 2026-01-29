import { ACCOUNTS_CHANGED_EVENT } from "@/lib/constants/events";

export function emitAccountsChanged() {
  window.dispatchEvent(new Event(ACCOUNTS_CHANGED_EVENT));
}
