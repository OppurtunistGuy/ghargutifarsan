interface SectionHeadingProps {
  marathi: string;
  english: string;
  as?: 'h1' | 'h2';
  description?: string;
}

export function SectionHeading({ marathi, english, description, as: Heading = 'h2' }: SectionHeadingProps) {
  return <div>
    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-brown">{english}</p>
    <Heading lang="mr" className="text-4xl font-semibold text-maroon sm:text-5xl">{marathi}</Heading>
    {description && <p className="mx-auto mt-5 max-w-xl text-muted">{description}</p>}
  </div>;
}
