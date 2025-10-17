import { getDb, createModerationQueueItem, getUser } from '../server/db';
import { marketplaceItems, professionalProfiles, tutorialRequests } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function backfillModerationQueue() {
  console.log('🚀 Starting moderation queue backfill...\n');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    return;
  }

  let totalAdded = 0;

  // 1. Backfill marketplace items
  console.log('📦 Processing marketplace items...');
  const pendingMarketplace = await db.select()
    .from(marketplaceItems)
    .where(eq(marketplaceItems.status, 'pending'));

  console.log(`Found ${pendingMarketplace.length} pending marketplace items`);

  for (const item of pendingMarketplace) {
    try {
      const creator = await getUser(item.sellerId);
      await createModerationQueueItem({
        tenantId: item.tenantId,
        itemType: 'marketplace',
        itemId: item.id,
        itemTitle: item.title,
        itemContent: item.description || '',
        itemCreatorId: item.sellerId,
        itemCreatorName: creator?.name || 'Unknown',
        priority: 'medium',
      });
      console.log(`  ✅ Added: ${item.title}`);
      totalAdded++;
    } catch (error) {
      console.error(`  ❌ Failed to add ${item.title}:`, error);
    }
  }

  // 2. Backfill professional profiles
  console.log('\n👔 Processing professional profiles...');
  const pendingProfiles = await db.select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.status, 'pending'));

  console.log(`Found ${pendingProfiles.length} pending professional profiles`);

  for (const profile of pendingProfiles) {
    try {
      const creator = await getUser(profile.userId);
      if (!creator) {
        console.error(`  ❌ Creator not found for profile ${profile.id}`);
        continue;
      }
      
      await createModerationQueueItem({
        tenantId: creator.tenantId,
        itemType: 'professional_profile',
        itemId: profile.id,
        itemTitle: profile.title,
        itemContent: profile.description || '',
        itemCreatorId: profile.userId,
        itemCreatorName: creator.name || 'Unknown',
        priority: 'medium',
      });
      console.log(`  ✅ Added: ${profile.title}`);
      totalAdded++;
    } catch (error) {
      console.error(`  ❌ Failed to add ${profile.title}:`, error);
    }
  }

  // 3. Backfill tutorial requests
  console.log('\n📚 Processing tutorial requests...');
  const pendingTutorials = await db.select()
    .from(tutorialRequests)
    .where(eq(tutorialRequests.status, 'pending'));

  console.log(`Found ${pendingTutorials.length} pending tutorial requests`);

  for (const request of pendingTutorials) {
    try {
      const creator = await getUser(request.requesterId);
      await createModerationQueueItem({
        tenantId: request.tenantId,
        itemType: 'tutorial_request',
        itemId: request.id,
        itemTitle: request.topic,
        itemContent: request.description || '',
        itemCreatorId: request.requesterId,
        itemCreatorName: creator?.name || 'Unknown',
        priority: 'low',
      });
      console.log(`  ✅ Added: ${request.topic}`);
      totalAdded++;
    } catch (error) {
      console.error(`  ❌ Failed to add ${request.topic}:`, error);
    }
  }

  console.log(`\n✅ Backfill completed! Total items added to moderation queue: ${totalAdded}`);
  process.exit(0);
}

backfillModerationQueue().catch((error) => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});

