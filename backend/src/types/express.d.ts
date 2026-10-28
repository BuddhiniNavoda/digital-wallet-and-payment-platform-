export {};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      cookies: Record<string, string | undefined>;
    }
  }
}
