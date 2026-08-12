import type { Metadata } from "next";
import { Questionnaire } from "@/components/questionnaire/questionnaire";

export const metadata: Metadata = { title: "Calculer mon empreinte", robots: { index: false, follow: false } };

export default function QuestionnairePage() {
  return <Questionnaire />;
}
