# ID Photo Implementation Plan

## Overview
Display user ID photos alongside names wherever names are displayed in the application. For users without ID photos, use the existing Avatar component which shows initials as a default.

## Implementation Status: IN PROGRESS

---

## Changes Made

### 1. Avatar Component (`/src/components/ui/Avatar.tsx`)
- Already handles missing images gracefully - shows initials on blue gradient
- No changes needed ✅

### 2. Check-In Page - Search Results (`/src/app/check-in/page.tsx`)
**Status: Done**
- Lines 430-458: Added Avatar component to search result buttons

### 3. Teacher Dashboard - Attendance List (`/src/app/teacher/page.tsx`)
**Status: Done**
- Line 405: Added Avatar to attendance list items

### 4. Teacher Dashboard - Roster Table (`/src/app/teacher/page.tsx`)
**Status: Done**
- Line 462: Added Avatar to roster table rows

### 5. Teacher Dashboard - Teacher Selector (`/src/app/teacher/page.tsx`)
**Status: Done**
- Line 503: Added Avatar to teacher selection dropdown

### 6. Admin Dashboard - Student Analytics Selector (`/src/app/admin/page.tsx`)
**Status: Done**
- Line 1784: Added Avatar to student selector

### 7. Admin Dashboard - Student Analytics Header (`/src/app/admin/page.tsx`)
**Status: Done**
- Line 1800: Added Avatar to analytics header

### 8. Admin Dashboard - Password Management (`/src/app/admin/page.tsx`)
**Status: Done**
- Line 1947: Added Avatar to password status table

---

## Testing Checklist
- [x] Check-in search shows ID photos or initials
- [x] Teacher dashboard attendance shows photos/initials
- [x] Teacher dashboard roster shows photos/initials
- [x] Teacher dashboard teacher selector shows photo when selected
- [x] Admin student analytics shows photos/initials
- [x] Admin password table shows photos/initials
- [ ] Dark mode displays correctly
- [ ] Responsive on tablet/kiosk screens

---

## Notes
- Avatar component provides default fallback (initials on blue circle) when no profile_image_url exists
- Seed data now includes placeholder image URLs (`/placeholder-avatar.svg`)
- Placeholder image created at `/public/placeholder-avatar.svg` (silhouette SVG)
- Current profile photo system uses local storage for dev, will migrate to Supabase Storage for production