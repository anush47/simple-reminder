import { checkSiteAuth } from '@/lib/auth-check';

export default async function DisplayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await checkSiteAuth();
    return <>{children}</>;
}
