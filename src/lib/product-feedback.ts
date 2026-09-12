export const PRODUCT_FEEDBACK_KEY = "carbon-os-product-feedback-v1";

export type FeedbackClarity = "haute" | "moyenne" | "basse";
export type FeedbackFollowUp = "action" | "plus_tard" | "incompris";

export interface ProductFeedback {
  clarte: FeedbackClarity;
  confiance: FeedbackClarity;
  suite: FeedbackFollowUp;
  submittedAt: string;
}

export function parseProductFeedback(
  serialized: string | null,
): ProductFeedback | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== "object") return null;
    const feedback = value as Partial<ProductFeedback>;
    const levels: FeedbackClarity[] = ["haute", "moyenne", "basse"];
    const followUps: FeedbackFollowUp[] = ["action", "plus_tard", "incompris"];
    if (
      !levels.includes(feedback.clarte as FeedbackClarity) ||
      !levels.includes(feedback.confiance as FeedbackClarity) ||
      !followUps.includes(feedback.suite as FeedbackFollowUp)
    ) {
      return null;
    }
    return {
      clarte: feedback.clarte as FeedbackClarity,
      confiance: feedback.confiance as FeedbackClarity,
      suite: feedback.suite as FeedbackFollowUp,
      submittedAt:
        typeof feedback.submittedAt === "string"
          ? feedback.submittedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function readProductFeedback() {
  if (typeof window === "undefined") return null;
  return parseProductFeedback(localStorage.getItem(PRODUCT_FEEDBACK_KEY));
}

export function writeProductFeedback(
  feedback: Omit<ProductFeedback, "submittedAt">,
) {
  const stored: ProductFeedback = {
    ...feedback,
    submittedAt: new Date().toISOString(),
  };
  localStorage.setItem(PRODUCT_FEEDBACK_KEY, JSON.stringify(stored));
  return stored;
}
