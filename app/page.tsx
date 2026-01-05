import { checkSiteAuth } from '@/lib/auth-check';
import LandingContent from '@/components/LandingContent';

export default async function Home() {
  await checkSiteAuth();
  return <LandingContent />;
}
