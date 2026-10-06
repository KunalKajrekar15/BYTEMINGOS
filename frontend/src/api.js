const base =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:3000" : "");

export async function api(path, { body, headers, ...options } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    ...options,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response
    .json()
    .catch(() => ({
      message: "The kitchen service returned an invalid response.",
    }));
  if (!response.ok)
    throw new Error(
      result.message || "Something went wrong. Please try again.",
    );
  return result;
}

export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export const stages = [
  "Received",
  "Preparing",
  "Ready for pickup",
  "Collected",
];
