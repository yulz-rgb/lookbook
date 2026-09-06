import Workspace from '../../components/Workspace';
import ClearLegacyDemoState from '../../components/ClearLegacyDemoState';

// Public demo — no ClerkProvider (see app/(auth)/layout.jsx) and proxy skips Clerk middleware.
export const metadata = {
  title: 'Demo — Yacht Uniform Lookbook',
  description: 'Try the yacht uniform lookbook without signing in.',
};

export default function DemoPage() {
  return (
    <>
      <ClearLegacyDemoState />
      <Workspace mode="local" canUpload={false} isDemo />
    </>
  );
}
