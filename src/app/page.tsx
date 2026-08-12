import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Votre empreinte, enfin compréhensible",
  description:
    "Mesurez votre empreinte carbone, comprenez ce qui compte et suivez vos progrès avec Carbon OS.",
};

export default function Home() {
  return <LandingPage />;
}
