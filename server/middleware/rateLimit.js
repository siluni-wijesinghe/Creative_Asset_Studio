import rateLimit from "express-rate-limit";

// Limits how many AI requests one visitor can make in a time window.
// It protects your key and your bill if a bug or a loop fires requests nonstop.
export const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,                // 20 AI requests per window per visitor
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please wait a few minutes and try again." },
});