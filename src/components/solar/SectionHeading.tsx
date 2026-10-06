export default function SectionHeading({
  step,
  label,
  title,
  answer,
}: {
  step: string;
  label: string;
  title: string;
  answer: string;
}) {
  return (
    <div className="solar-section-heading">
      <div className="solar-kicker">
        <span>{step}</span>
        {label}
      </div>
      <h2>{title}</h2>
      <p>{answer}</p>
    </div>
  );
}
