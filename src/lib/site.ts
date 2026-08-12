const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const SITE_NAME = "Carbon OS";
export const SITE_DESCRIPTION =
  "Mesurez, comprenez et réduisez votre empreinte carbone personnelle en moins de cinq minutes.";
