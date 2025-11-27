import { connection } from 'next/server';
import { Footer } from '@/components/organisms/footer/footer';
import { getSetting } from '@/app/actions/site-settings';

export async function MarketingLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    await connection(); // Force dynamic rendering

    // Fetch social links for footer
    const [fbResult, igResult, twResult] = await Promise.all([
        getSetting('social_facebook'),
        getSetting('social_instagram'),
        getSetting('social_twitter'),
    ]);

    const socialLinks = {
        facebook: fbResult.setting?.value || '',
        instagram: igResult.setting?.value || '',
        twitter: twResult.setting?.value || '',
    };

    return (
        <>
            {children}
            <Footer socialLinks={socialLinks} />
        </>
    );
}
