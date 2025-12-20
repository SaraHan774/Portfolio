// Route paths

export const ROUTES = {
  HOME: '/',
  WORK_DETAIL: (id: string) => `/works/${id}`,
  WORKS: '/works',
} as const;