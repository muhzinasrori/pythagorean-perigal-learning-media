/**
 * Renders schema.org structured data as an inline JSON-LD <script>.
 * Server component — include it once in the root layout.
 * `<` is escaped so `</script>` inside strings can never break out.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
