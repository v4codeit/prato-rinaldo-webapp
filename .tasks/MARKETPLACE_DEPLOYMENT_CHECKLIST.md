# Marketplace Image System - Deployment Checklist

**Feature:** Image Upload & Gallery System
**Version:** 1.0.0
**Date:** 2025-11-03
**Status:** Ready for Deployment

---

## Pre-Deployment Checklist

### Code Quality
- [x] TypeScript compilation successful (no errors)
- [x] Production build successful
- [x] No console errors in development
- [x] No unused imports or variables
- [x] Code follows project conventions
- [x] Components properly typed
- [x] Error handling implemented

### Documentation
- [x] Implementation report created
- [x] Usage examples documented
- [x] Architecture diagram provided
- [x] Deployment checklist created (this document)
- [x] Inline code comments added
- [ ] API documentation updated (if applicable)

### Version Control
- [ ] Branch created for feature
- [ ] All changes committed
- [ ] Commit messages clear and descriptive
- [ ] No sensitive data in commits
- [ ] Branch pushed to remote
- [ ] Pull request created

---

## Supabase Configuration

### Storage Bucket Setup
- [ ] Bucket `marketplace-images` created
- [ ] Bucket set to PUBLIC access
- [ ] Bucket file size limit configured (50MB max)
- [ ] Test upload via Supabase dashboard

### RLS Policies Configuration

#### Policy 1: Upload (INSERT)
```sql
CREATE POLICY "marketplace_images_insert_owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```
- [ ] Policy created
- [ ] Policy tested with authenticated user
- [ ] Policy blocks non-authenticated users
- [ ] Policy blocks uploads to other users' folders

#### Policy 2: Read (SELECT)
```sql
CREATE POLICY "marketplace_images_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-images');
```
- [ ] Policy created
- [ ] Policy tested (public access confirmed)
- [ ] Images accessible via public URL

#### Policy 3: Delete
```sql
CREATE POLICY "marketplace_images_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```
- [ ] Policy created
- [ ] Policy tested (owner can delete)
- [ ] Policy blocks non-owners from deleting

### Test Supabase Connection
```bash
# Test from browser console on staging
const supabase = createClient();
const { data, error } = await supabase.storage.from('marketplace-images').list();
console.log(data, error);
```
- [ ] Connection successful
- [ ] Bucket accessible
- [ ] No CORS errors

---

## Environment Variables

### Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
- [x] Variables set locally
- [x] Variables work in development
- [x] No errors in console

### Staging
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
```
- [ ] Variables set in Vercel (or deployment platform)
- [ ] Variables match staging Supabase project
- [ ] Test upload on staging environment

### Production
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```
- [ ] Variables set in Vercel (or deployment platform)
- [ ] Variables match production Supabase project
- [ ] Backup variables stored securely

---

## Next.js Configuration

### Image Domains
Update `next.config.js`:
```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
```
- [ ] Configuration added
- [ ] Build successful with new config
- [ ] Images load without errors

### Build Test
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Bundle size acceptable (<500KB for components)

---

## Functional Testing

### MultiImageUpload Component

#### File Upload Tests
- [ ] Upload single JPEG file
- [ ] Upload single PNG file
- [ ] Upload single WebP file
- [ ] Upload multiple files (2-6)
- [ ] Upload with drag & drop
- [ ] Upload with file browser

#### Validation Tests
- [ ] Try to upload 7th image (should block)
- [ ] Try to upload PDF (should reject with error)
- [ ] Try to upload GIF (should reject with error)
- [ ] Try to upload file >10MB (should reject)
- [ ] Try to upload file exactly 10MB (should succeed)
- [ ] Try to upload with slow connection (show loading)

#### UI/UX Tests
- [ ] Thumbnails display correctly
- [ ] Delete button works on each thumbnail
- [ ] "Copertina" label appears on first image
- [ ] Counter shows "X / 6 immagini caricate"
- [ ] Toast notifications appear for errors
- [ ] Toast notifications appear for success
- [ ] Loading spinner appears during upload
- [ ] Drag active state shows correctly

### ImageGallery Component

#### Display Tests
- [ ] Gallery displays with 1 image
- [ ] Gallery displays with 6 images
- [ ] Gallery handles empty array (shows empty state)
- [ ] Main image loads correctly
- [ ] Thumbnails load correctly
- [ ] Image counter displays correctly

#### Navigation Tests
- [ ] Click thumbnail changes main image
- [ ] Previous arrow button works
- [ ] Next arrow button works
- [ ] Arrows loop (last → first, first → last)
- [ ] Active thumbnail highlighted

#### Lightbox Tests
- [ ] Click main image opens lightbox
- [ ] Lightbox displays fullscreen
- [ ] Close button works
- [ ] Click backdrop closes lightbox
- [ ] ESC key closes lightbox
- [ ] Arrow keys navigate in lightbox
- [ ] Thumbnail strip displays in lightbox
- [ ] Image counter displays in lightbox
- [ ] Keyboard hints display

### Form Integration Tests

#### Create Form
- [ ] Form loads without errors
- [ ] Upload component displays
- [ ] Can upload images before filling other fields
- [ ] Submit blocked if no images
- [ ] Submit works with 1 image
- [ ] Submit works with 6 images
- [ ] Images saved to database correctly
- [ ] Success toast appears after submit
- [ ] Redirect to marketplace after success

#### Detail Page
- [ ] Page loads with images
- [ ] Gallery displays correctly
- [ ] Can navigate images
- [ ] Can open lightbox
- [ ] Images load quickly
- [ ] No broken image links

---

## Performance Testing

### Load Time Tests
- [ ] Initial page load <3 seconds
- [ ] Image upload <5 seconds (10MB file)
- [ ] Gallery navigation <100ms
- [ ] Lightbox open <200ms
- [ ] Thumbnail click response <50ms

### Network Tests
- [ ] Test on slow 3G connection
- [ ] Test with browser throttling
- [ ] Images lazy load correctly
- [ ] Loading states display properly

### Stress Tests
- [ ] Upload 6 images simultaneously
- [ ] Navigate quickly between images
- [ ] Open/close lightbox rapidly
- [ ] Multiple galleries on same page

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab to upload zone
- [ ] Enter/Space opens file browser
- [ ] Tab to each thumbnail
- [ ] Tab to arrow buttons
- [ ] Arrow keys work in lightbox
- [ ] ESC closes lightbox
- [ ] Focus visible at all times

### Screen Reader Testing
- [ ] Upload zone announced correctly
- [ ] Thumbnails have alt text
- [ ] Buttons have ARIA labels
- [ ] Image counter announced
- [ ] Error messages announced
- [ ] Success messages announced

### Visual Testing
- [ ] High contrast mode works
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Text readable at 200% zoom

---

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)
- [ ] Samsung Internet

### Features to Test
- [ ] Drag & drop works (desktop only)
- [ ] File browser works (all)
- [ ] Touch gestures work (mobile)
- [ ] Lightbox displays correctly (all)
- [ ] Responsive layout works (all)

---

## Security Testing

### Authentication Tests
- [ ] Unauthenticated user blocked from upload
- [ ] Authenticated user can upload
- [ ] User can only upload to their folder
- [ ] User cannot access other users' folders

### Validation Tests
- [ ] Client-side validation works
- [ ] Server-side validation works
- [ ] Malicious file names rejected
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked

### Rate Limiting (Future)
- [ ] Rate limiting policy defined
- [ ] Rate limiting implemented
- [ ] Rate limiting tested

---

## Database Testing

### Data Integrity
- [ ] Images array saves correctly
- [ ] JSON format valid
- [ ] URLs are valid and accessible
- [ ] No broken URLs saved

### Query Tests
- [ ] Fetch items with images (fast <100ms)
- [ ] Filter items (works with images column)
- [ ] Sort items (works with images column)
- [ ] Update item images (works correctly)
- [ ] Delete item (cascades to images)

---

## Monitoring Setup

### Error Tracking
- [ ] Sentry (or error tracking tool) configured
- [ ] Upload errors logged
- [ ] Display errors logged
- [ ] Network errors logged

### Analytics
- [ ] Track upload success rate
- [ ] Track upload errors
- [ ] Track gallery interactions
- [ ] Track lightbox usage

### Performance Monitoring
- [ ] Core Web Vitals tracked
- [ ] Image load times tracked
- [ ] Upload times tracked
- [ ] API response times tracked

---

## Documentation Verification

### Developer Documentation
- [ ] README updated with new feature
- [ ] Component props documented
- [ ] Usage examples provided
- [ ] Common issues documented

### User Documentation
- [ ] User guide created (if applicable)
- [ ] Help tooltips added to UI
- [ ] Error messages clear and helpful
- [ ] Success messages encouraging

---

## Rollback Plan

### Backup
- [ ] Database backup created
- [ ] Code committed to version control
- [ ] Environment variables documented
- [ ] Supabase settings documented

### Rollback Steps
```bash
# If issues occur:
1. git checkout main
2. npm run build
3. Deploy previous version
4. Restore environment variables
5. Verify old version works
```
- [ ] Rollback steps tested on staging
- [ ] Rollback can be done in <5 minutes
- [ ] Team trained on rollback process

---

## Post-Deployment Checklist

### Immediate (Within 1 hour)
- [ ] Smoke test all critical paths
- [ ] Check error logs (should be minimal)
- [ ] Verify monitoring tools working
- [ ] Test one full upload flow in production
- [ ] Verify images display on detail page

### Short-term (Within 24 hours)
- [ ] Monitor error rates
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Verify storage usage (Supabase dashboard)
- [ ] Test on multiple devices

### Long-term (Within 1 week)
- [ ] Analyze usage patterns
- [ ] Review performance data
- [ ] Gather user feedback
- [ ] Identify optimization opportunities
- [ ] Plan future enhancements

---

## Known Issues & Workarounds

### Issue 1: No Image Reordering
**Impact:** Low
**Workaround:** Delete and re-upload in correct order
**Planned Fix:** Add drag-to-reorder in future sprint

### Issue 2: No Image Editing
**Impact:** Medium
**Workaround:** Edit images before upload
**Planned Fix:** Add image editor in future sprint

### Issue 3: Storage Cleanup
**Impact:** Low
**Workaround:** Manual cleanup via Supabase dashboard
**Planned Fix:** Implement cleanup job in future sprint

---

## Team Sign-off

### Development Team
- [ ] Code reviewed by: _______________
- [ ] Approved by Tech Lead: _______________
- [ ] Date: _______________

### QA Team
- [ ] Functional testing complete: _______________
- [ ] Regression testing complete: _______________
- [ ] Approved by QA Lead: _______________
- [ ] Date: _______________

### Product Team
- [ ] Feature requirements met: _______________
- [ ] UX approved: _______________
- [ ] Approved by Product Manager: _______________
- [ ] Date: _______________

### DevOps Team
- [ ] Infrastructure ready: _______________
- [ ] Monitoring configured: _______________
- [ ] Approved by DevOps Lead: _______________
- [ ] Date: _______________

---

## Deployment Schedule

### Staging Deployment
- **Date:** _______________
- **Time:** _______________
- **Duration:** ~30 minutes
- **Responsible:** _______________

### Production Deployment
- **Date:** _______________
- **Time:** _______________ (recommend off-peak hours)
- **Duration:** ~1 hour
- **Responsible:** _______________

### Rollback Window
- **Duration:** 4 hours after deployment
- **Decision Maker:** Product Manager + Tech Lead
- **Criteria:** >5% error rate OR critical bug

---

## Communication Plan

### Before Deployment
- [ ] Notify team via Slack/email
- [ ] Schedule deployment window
- [ ] Prepare status page update
- [ ] Brief support team on new feature

### During Deployment
- [ ] Update status page ("Deploying new features")
- [ ] Monitor error logs live
- [ ] Be available for immediate rollback
- [ ] Test critical paths immediately

### After Deployment
- [ ] Announce successful deployment
- [ ] Update status page ("All systems operational")
- [ ] Send feature announcement to users
- [ ] Gather initial feedback

---

## Support Preparation

### Common User Issues

#### Issue: "Can't upload images"
**Solution:**
1. Check authentication
2. Verify file type (JPEG/PNG/WebP)
3. Check file size (<10MB)
4. Try different browser

#### Issue: "Images not showing"
**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Check network tab for 404s
3. Verify Supabase URL is correct
4. Check browser console for errors

#### Issue: "Upload is slow"
**Solution:**
1. Check file size (compress if >5MB)
2. Check network connection
3. Try fewer images at once
4. Clear browser cache

---

## Success Criteria

### Technical Metrics
- [ ] 0 critical errors in first 24h
- [ ] <1% upload failure rate
- [ ] <3s average page load time
- [ ] >95% uptime

### User Metrics
- [ ] >80% upload completion rate
- [ ] <5% user-reported issues
- [ ] Positive user feedback
- [ ] Increased marketplace listings

### Business Metrics
- [ ] Feature adoption >50% in first month
- [ ] Storage costs within budget
- [ ] Support tickets <10/week
- [ ] User satisfaction >4/5

---

## Next Steps After Deployment

### Phase 1 (Current)
- [x] Upload & gallery implementation
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production

### Phase 2 (Next Sprint)
- [ ] Image reordering
- [ ] Server-side compression
- [ ] Performance optimizations

### Phase 3 (Future)
- [ ] Image editor
- [ ] Advanced gallery features
- [ ] Bulk operations

---

## Emergency Contacts

### Technical Issues
- **Tech Lead:** _______________
- **Backend Developer:** _______________
- **DevOps Engineer:** _______________

### Business Issues
- **Product Manager:** _______________
- **Customer Support Lead:** _______________

### Infrastructure Issues
- **Supabase Support:** support@supabase.io
- **Hosting Provider:** _______________

---

## Final Pre-Deployment Checklist

Before clicking deploy:
- [ ] All code merged to main branch
- [ ] All tests passing
- [ ] Build successful
- [ ] Environment variables set
- [ ] Supabase configured
- [ ] Team notified
- [ ] Documentation complete
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Support team briefed

**Ready to Deploy:** [ ] YES / [ ] NO

**Deployment Approved By:** _______________
**Date:** _______________
**Time:** _______________

---

## Post-Deployment Notes

(To be filled after deployment)

**Deployment Date:** _______________
**Deployment Time:** _______________
**Deployed By:** _______________
**Issues Encountered:** _______________
**Resolutions:** _______________
**Performance Notes:** _______________
**User Feedback:** _______________

---

**Checklist Version:** 1.0
**Last Updated:** 2025-11-03
**Maintained By:** Development Team
