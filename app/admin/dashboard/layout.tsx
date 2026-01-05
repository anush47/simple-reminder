import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const hasSession = cookieStore.has('admin_session');

    if (!hasSession) {
        redirect('/admin/login');
    }

    return <>{children}</>;
}
