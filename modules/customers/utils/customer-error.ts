const NETWORK_ERROR_PATTERN = /failed to fetch|fetch failed|network request failed|network error|networkerror|unable to resolve host|no address associated with hostname|timed? ?out|connection (?:lost|failed|refused|reset)|internet connection|offline/i;
const TECHNICAL_ERROR_PATTERN = /supabase|postgrest|postgres|PGRST\d+|SQLSTATE|row-level security|schema cache|column .* does not exist|relation .* does not exist|function .* does not exist|invalid\.supabase|invalid input syntax|duplicate key|constraint|permission denied|\bviolates\b|TypeError|SyntaxError|ReferenceError|Error:\s|\b(?:4\d\d|5\d\d)\b|stack trace|internal server error|failed to load module/i;

/** Keeps infrastructure details out of customer-visible error messages. */
export function getCustomerErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (NETWORK_ERROR_PATTERN.test(message)) {
    return "We’re having trouble connecting. Check your internet connection and try again.";
  }
  if (!message || TECHNICAL_ERROR_PATTERN.test(message) || message.length > 220) return fallback;
  return message;
}
