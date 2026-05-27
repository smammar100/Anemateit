/**
 * Temporary preview route for the Phantom Lab Grid *thumbnail* (the 3x3
 * Sanity-backed mockup that will appear on the homepage / related grids
 * once the `phantom-lab-grid` Sanity entry exists). Safe to delete once
 * the Sanity entry is published.
 */
import PhantomLabGridThumbnail from '@/components/phantom-lab-grid/PhantomLabGridThumbnail';

export default function PhantomLabGridThumbnailPreview() {
  return (
    <main className="min-h-dvh bg-base-100 flex items-center justify-center p-12">
      <div className="w-full max-w-md">
        <PhantomLabGridThumbnail />
      </div>
    </main>
  );
}
