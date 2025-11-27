import { Suspense } from 'react';
import { MarketingLayoutContent } from './layout-content';

/**
 * Marketing Layout - For public landing pages
 *
 * This layout includes a footer but NO header/nav (unlike main app).
 * Used for landing page and other marketing content.
 */
export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<>{children}</>}>
            <MarketingLayoutContent>{children}</MarketingLayoutContent>
        </Suspense>
    );
}
