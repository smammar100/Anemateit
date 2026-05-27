import PhantomLabGrid from '@/components/phantom-lab-grid/PhantomLabGrid';

/**
 * Preview route for the WebGL Phantom Lab Grid. Once a Sanity project
 * with slug `phantom-lab-grid` exists, the official URL becomes
 * `/projects/phantom-lab-grid` and this lab route can be removed.
 */
export default function PhantomLabGridLabPage() {
  return (
    <main className="fixed inset-0 bg-black">
      <PhantomLabGrid />
    </main>
  );
}
