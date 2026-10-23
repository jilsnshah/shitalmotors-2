export const ASSISTANT_EVENT = "assistant:open";

/** Opens the assistant from anywhere, optionally sending a first question. */
export function openAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent(ASSISTANT_EVENT, { detail: { prompt } }));
}
