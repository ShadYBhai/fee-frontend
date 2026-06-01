export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  appName: (import.meta.env.VITE_APP_NAME as string) ?? 'FeeFlow',
} as const;
