export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    timeout: 10_000,
  },
  query: {
    staleTime: 1000 * 60 * 2,  // 2 min — data considered fresh
    gcTime:    1000 * 60 * 10, // 10 min — garbage collect unused cache
    retry: 1,
  },
} as const;
