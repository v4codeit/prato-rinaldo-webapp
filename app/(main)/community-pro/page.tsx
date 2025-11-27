import { requireVerifiedResident } from '@/lib/auth/dal';
import { getApprovedServiceProfiles } from '@/app/actions/service-profiles';
import { SERVICE_PROFILE_TYPE } from '@/lib/utils/constants';
import { CommunityProTabs } from './community-pro-tabs';
import { CompactCTABanner } from '@/components/community-pro/compact-cta-banner';

export const metadata = {
  title: 'Community Pro',
  description: 'Trova volontari e professionisti fidati nella community',
};

export default async function CommunityProPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: 'volunteer' | 'professional' }>;
}) {
  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();
  const params = await searchParams;
  const activeTab = params.type || 'volunteer';

  // Fetch first page of volunteers and professionals
  const volunteersResult = await getApprovedServiceProfiles({
    profileType: SERVICE_PROFILE_TYPE.VOLUNTEER,
    page: 1,
    limit: 12,
  });

  const professionalsResult = await getApprovedServiceProfiles({
    profileType: SERVICE_PROFILE_TYPE.PROFESSIONAL,
    page: 1,
    limit: 12,
  });

  return (
    <>
      <CompactCTABanner />
      <div className="container pb-8">
        {/* pb-8 per evitare che il banner della community pro sia staccato dal subheader */}
        <CommunityProTabs
          activeTab={activeTab}
          initialVolunteers={volunteersResult.profiles}
          initialProfessionals={professionalsResult.profiles}
          initialVolunteersHasMore={volunteersResult.pagination.hasMore}
          initialProfessionalsHasMore={professionalsResult.pagination.hasMore}
        />
      </div>
    </>
  );
}
