import type { Metadata } from "next";
import { AssessmentResult } from "@/components/result/assessment-result";

export const metadata: Metadata = {
  title: "Mon résultat",
  robots: { index: false, follow: false },
};

export default function ResultPage() {
  return <AssessmentResult />;
}
