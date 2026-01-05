import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function checkSiteAuth() {
    const cookieStore = await cookies();
    const hasAuth = cookieStore.has('site_auth');
    if (!hasAuth) {
        redirect('/login');
    }
}

export async function isSiteAuthenticated() {
    const cookieStore = await cookies();
    return cookieStore.has('site_auth');
}
