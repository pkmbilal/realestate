# Feature Roadmap

This roadmap lists the remaining features needed to make the real estate application feel complete and production-ready. It is based on the current application state: public property browsing, property detail pages, agent signup/login, agent property creation and editing, Cloudflare R2 image uploads, admin approval flows, agent profiles, and enquiry form leads.

## P0: Core Completion

These features close the biggest gaps in the main marketplace workflow.

### 1. Saved Properties

- **Goal:** Let logged-in users save and unsave properties they are interested in.
- **Why it matters:** Buyers and renters need a shortlist before contacting agents.
- **Implementation notes:** Add a `saved_properties` table linking user IDs to property IDs, add save/unsave server actions, show a save button on property cards and detail pages, and add a saved properties page.
- **Dependencies:** Supabase migration and RLS policies.

### 2. Lead Management

- **Goal:** Give agents a proper workflow for handling enquiries.
- **Why it matters:** The current dashboard shows recent leads, but agents cannot track progress.
- **Implementation notes:** Add lead statuses such as `new`, `contacted`, `qualified`, `closed`, and `lost`; add agent notes and optional follow-up dates; create a full leads page with filters and status updates.
- **Dependencies:** Leads table migration and server actions.

### 3. Agent Profile Editing

- **Goal:** Allow agents and brokers to update their public and contact details.
- **Why it matters:** Agent profile data is currently captured at signup but cannot be managed from the app.
- **Implementation notes:** Add an agent settings/profile page for name, phone, WhatsApp, agency name, city, license number, and public bio fields.
- **Dependencies:** May need new profile columns for bio, logo/avatar, and public visibility.

### 4. Stronger Form Validation

- **Goal:** Validate all important form inputs server-side before database writes.
- **Why it matters:** Current forms rely mostly on HTML constraints and database errors.
- **Implementation notes:** Validate property price, area, required text, phone/email formats, allowed statuses, image upload count, and role-specific actions. Return clear errors to the form.
- **Dependencies:** Shared validation helpers or a validation library.

### 5. Admin Filtering and Search

- **Goal:** Make admin review pages usable as the number of agents and properties grows.
- **Why it matters:** Current admin pages list everything without filtering.
- **Implementation notes:** Add filters for status, city, agent, date range, and search text on agent and property approval pages.
- **Dependencies:** Query parameter handling and indexed database columns where needed.

## P1: Marketplace Quality

These features make the public marketplace easier to browse and better indexed.

### 6. Better Property Search

- **Goal:** Improve discovery with richer search controls.
- **Why it matters:** Users need to narrow listings quickly.
- **Implementation notes:** Add sorting, pagination, area range, bathrooms, furnished filter, keyword search, and clear filter reset controls.
- **Dependencies:** Query changes and possible database indexes.

### 7. SEO Metadata

- **Goal:** Add high-quality metadata for public pages.
- **Why it matters:** Property pages and agent profiles should be shareable and discoverable.
- **Implementation notes:** Add dynamic titles, descriptions, Open Graph metadata, canonical URLs, and structured data for property detail pages.
- **Dependencies:** Next.js metadata APIs.

### 8. Similar Properties

- **Goal:** Show related listings on property detail pages.
- **Why it matters:** Users need useful alternatives if the current listing is not right.
- **Implementation notes:** Recommend published properties from the same city, district, purpose, or property type, excluding the current property.
- **Dependencies:** Existing properties table.

### 9. Public Agent Directory

- **Goal:** Add a searchable public page for approved agents and brokers.
- **Why it matters:** Some users choose an agent first instead of a property first.
- **Implementation notes:** Add `/agents` with filters by city, agency, role, and search text. Link each result to the existing agent profile page.
- **Dependencies:** Approved profiles query and public profile fields.

## P2: Business Operations

These features help the platform operate like a real marketplace business.

### 10. Featured Listings

- **Goal:** Allow admins to feature selected properties.
- **Why it matters:** Featured inventory can support promotion, monetization, or editorial curation.
- **Implementation notes:** Add featured fields to properties and surface featured listings on the homepage.
- **Dependencies:** Property migration and admin controls.

### 11. License Verification

- **Goal:** Track whether an agent or broker license has been verified.
- **Why it matters:** Trust is critical in real estate marketplaces.
- **Implementation notes:** Add license verification status, verification notes, and visible verified indicators on public agent profiles and property pages.
- **Dependencies:** Profile migration and admin UI updates.

### 12. Listing Expiry and Renewal

- **Goal:** Expire old listings and let agents renew them.
- **Why it matters:** Prevents stale inventory from staying published forever.
- **Implementation notes:** Add expiry dates, renewal actions, expired status handling, and admin/agent visibility.
- **Dependencies:** Property migration and scheduled maintenance process.

### 13. Enquiry Tracking for Contact Buttons

- **Goal:** Track leads from Call, WhatsApp, and Email actions.
- **Why it matters:** The platform should capture interest beyond the enquiry form.
- **Implementation notes:** Convert contact button clicks into lead events with `lead_type` values of `call`, `whatsapp`, or `email`.
- **Dependencies:** Client interaction handling and lead insert action.

## P3: Product Polish

These features improve day-to-day usability and presentation.

### 14. Notifications

- **Goal:** Notify users about important events.
- **Why it matters:** Agents need to know when leads arrive and when listings are approved or rejected.
- **Implementation notes:** Start with in-app notifications, then add email notifications for leads, approvals, rejections, and account status changes.
- **Dependencies:** Notification table and email provider.

### 15. Analytics Dashboards

- **Goal:** Show meaningful performance data to agents and admins.
- **Why it matters:** Agents need to understand listing performance, and admins need marketplace health metrics.
- **Implementation notes:** Track listing views, contact clicks, lead conversion, pending approvals, published listings, and agent activity.
- **Dependencies:** Event tracking table or analytics service.

### 16. Image Reordering and Cover Image

- **Goal:** Let agents control listing photo order and cover image.
- **Why it matters:** The first image strongly affects listing quality.
- **Implementation notes:** Add cover image selection and sort order controls in the property edit page.
- **Dependencies:** Existing `property_images.sort_order`; may need `is_cover` or cover selection logic.

### 17. Map Support

- **Goal:** Show approximate listing location on property detail pages.
- **Why it matters:** Location is one of the most important property decisions.
- **Implementation notes:** Add latitude and longitude fields, optional map display, and map-based search later.
- **Dependencies:** Property migration and map provider.

### 18. Improved Empty and Error States

- **Goal:** Make edge cases feel intentional.
- **Why it matters:** Clear feedback reduces confusion and support requests.
- **Implementation notes:** Improve empty dashboards, failed uploads, rejected listings, suspended accounts, and unauthorized redirects.
- **Dependencies:** UI updates only for most cases.

## P4: Engineering Hardening

These features make the project easier to maintain and safer to operate.

### 19. Local Supabase Migrations

- **Goal:** Store database schema changes in the repository.
- **Why it matters:** The database currently exists in Supabase, but local migration files are needed for repeatable development and deployment.
- **Implementation notes:** Add versioned migrations for existing tables, enums, RLS policies, indexes, and future feature changes.
- **Dependencies:** Supabase CLI workflow.

### 20. Automated Tests

- **Goal:** Add confidence around auth, permissions, and core workflows.
- **Why it matters:** Role-based behavior can regress easily.
- **Implementation notes:** Cover auth redirects, role access, property creation and update, admin approvals, search filters, and lead creation.
- **Dependencies:** Test framework setup and database test strategy.

### 21. Audit Logs

- **Goal:** Track important admin and agent actions.
- **Why it matters:** Approvals, rejections, suspensions, and listing changes should be traceable.
- **Implementation notes:** Add an `audit_logs` table and write logs for sensitive actions.
- **Dependencies:** Database migration and action wrappers.

### 22. Rate Limiting and Abuse Protection

- **Goal:** Protect public forms and auth-adjacent flows from abuse.
- **Why it matters:** Enquiry forms and signup flows can be spammed.
- **Implementation notes:** Add rate limiting for lead creation, signup, login attempts, and contact event tracking.
- **Dependencies:** Rate limit storage or external provider.

### 23. Monitoring and Operational Alerts

- **Goal:** Detect production failures quickly.
- **Why it matters:** Upload failures, auth errors, and database errors need visibility.
- **Implementation notes:** Add structured logging and error monitoring for server actions, R2 uploads, and Supabase operations.
- **Dependencies:** Monitoring provider or logging destination.

## Recommended First Sprint

1. Implement saved properties.
2. Implement lead management statuses, notes, and full leads page.
3. Add agent profile editing.
4. Add admin filtering and search.
5. Add stronger server-side validation.

This sprint completes the most important user loops: users can shortlist listings, agents can manage enquiries, agents can maintain their profiles, and admins can review marketplace activity more efficiently.
