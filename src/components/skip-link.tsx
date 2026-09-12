export function SkipLink({
  href = "#contenu",
  label = "Aller au contenu",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <a className="skip-link" href={href}>
      {label}
    </a>
  );
}
