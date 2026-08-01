import { Plausible } from '@/components/plausible';

/**
 * The demand-test frame (DEMAND-TEST-PACK §1): a smoke test wearing the
 * brand. Plausible is the only analytics on these routes (§3: no marketing
 * platform pixels); it renders nothing until a domain is configured, so dev
 * and CI send nothing anywhere.
 */
export default function FoundingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Plausible />
      {children}
    </>
  );
}
