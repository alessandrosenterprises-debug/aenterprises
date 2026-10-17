# AEOS customer app native migration

The Expo app uses a native sign-in and app shell, with the complete AEOS customer pages rendered inside it until each screen has a native implementation that passes a full visual and workflow parity check. This keeps every website design and customer flow available while native screens are improved. Do not replace a styled customer page with a simplified native screen until its full content, cards, actions, and responsive layout have been checked.

## Native foundation

- [x] AEOS color, spacing, and radius tokens
- [x] Secure Supabase session storage on device
- [x] Native customer sign-in with the same active-customer checks
- [x] Native home foundation: business feature card, promotions, gallery preview, updates, weather, contact shortcuts, and quick links
- [x] Native bottom navigation for Home, Businesses, Services, Bookings, and Orders
- [x] Shared native account header and profile menu across native and fallback screens
- [x] Styled website pages for business discovery, services, orders, bookings, gallery, and all remaining customer routes inside the native shell
- [x] Existing customer order and booking cards, detail, creation, payment, courier tracking, and proof flows retained with the website pages
- [x] Existing all-business gallery with tappable previews, business/category tags, and related actions retained
- [x] Single customer live-chat widget with realtime replies and its unread badge; the native overlay is not shown over the website widget
- [x] Native home unread-notification badge with realtime refresh and a periodic count refresh
- [x] Website fallback for all customer pages not yet ported
- [ ] Native sign-up, password recovery, profile and account settings
- [ ] Native business discovery and business detail pages with website visual parity
- [ ] Native product, service, and promotion flows
- [ ] Native booking, order, and delivery workflows with website visual parity
- [ ] Native communication, support, request, and activity pages
- [ ] Native parity review across small and large Android/iOS screens

## Customer route inventory

### Entry and account

- [x] `/customer/login` — native sign-in; account creation and password recovery remain available through the website fallback
- [ ] `/customer/register`
- [ ] `/customer/profile`
- [ ] `/customer/preferences`
- [ ] `/customer/activity`

### Home and discovery

- [x] `/customer` — full styled customer home page
- [x] `/customer/businesses` — full styled business list and search
- [x] `/customer/gallery` — full styled gallery and preview actions
- [x] `/customer/services` — full styled service list and search
- [ ] `/customer/services/[serviceId]`
- [ ] `/customer/businesses/[slug]`
- [ ] `/customer/businesses/[slug]/updates`
- [ ] `/customer/businesses/[slug]/history`
- [ ] `/customer/businesses/[slug]/gallery`
- [ ] `/customer/businesses/[slug]/products`
- [ ] `/customer/businesses/[slug]/services`
- [ ] `/customer/businesses/[slug]/promotions`
- [ ] `/customer/businesses/[slug]/status`
- [ ] `/customer/businesses/[slug]/apply`

### Technology business

- [ ] `/customer/businesses/[slug]/technology/[category]`
- [ ] `/customer/businesses/[slug]/technology/[category]/products`
- [ ] `/customer/businesses/[slug]/technology/[category]/services`
- [ ] `/customer/businesses/[slug]/technology/[category]/gallery`
- [ ] `/customer/businesses/[slug]/technology/[category]/repair`
- [ ] `/customer/businesses/[slug]/technology/[category]/support`
- [ ] `/customer/businesses/[slug]/technology/[category]/support/request`
- [ ] `/customer/technology-consultation`

### Orders, courier, and bookings

- [x] `/customer/orders` — styled order cards, including courier delivery classification
- [ ] `/customer/orders/new`
- [ ] `/customer/orders/[id]`
- [ ] `/customer/businesses/delivery-service`
- [x] `/customer/bookings` — styled customer booking list
- [ ] `/customer/bookings/new`
- [ ] `/customer/bookings/new/[serviceId]`
- [ ] `/customer/bookings/[id]`

### Communication and assistance

- [ ] `/customer/messages`
- [ ] `/customer/messages/new`
- [ ] `/customer/emails`
- [ ] `/customer/emails/compose`
- [ ] `/customer/emails/[id]`
- [ ] `/customer/notifications`
- [ ] `/customer/requests`
- [ ] `/customer/support`

## Migration rule

For each route, preserve its current customer permissions, data relationships, validation, actions, payment behavior, visual hierarchy, branding, and mobile responsiveness. A native route only replaces its website fallback after its complete customer journey has been ported. Keep route access through the Expo app throughout the migration.
