import {
  ACTION_PLAN_STORAGE_KEY,
  GOAL_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  QUESTIONNAIRE_DRAFT_KEY,
  STORAGE_KEY,
} from "@/data/defaults";
import { PRODUCT_FEEDBACK_KEY } from "@/lib/product-feedback";
import { removeBrowserStorage } from "@/lib/browser-storage";

export function clearLocalData() {
  for (const key of [
    STORAGE_KEY,
    GOAL_STORAGE_KEY,
    HISTORY_STORAGE_KEY,
    ACTION_PLAN_STORAGE_KEY,
    QUESTIONNAIRE_DRAFT_KEY,
    PRODUCT_FEEDBACK_KEY,
    "carbon-os-account-activated-tracked-v1",
  ]) {
    removeBrowserStorage(key);
  }
}
