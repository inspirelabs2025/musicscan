interface SeoContentBlockProps {
  text: string;
}

export const SeoContentBlock = ({ text }: SeoContentBlockProps) => (
  <section className="text-muted-foreground text-sm opacity-70 max-w-3xl mx-auto text-center py-8 px-4">
    <p>{text}</p>
  </section>
);
