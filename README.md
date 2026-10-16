# HOPP — Every Hop Carries Hope.

A mobile-first Next.js PWA with an Express API, Supabase Auth/PostgreSQL schema, and local IndexedDB queues. The app runs in guest mode without credentials. It is a functional hackathon foundation, not a certified emergency response system.

## Run locally

Node.js 20.9+ is required (tested with Node 24).

```sh
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000. For the API, use a second terminal:

```sh
npm run server
```

For reliable offline testing, use the production build instead of the development server:

```sh
npm run build
npm start
```

Visit the application online, allow its service worker to activate, then reload once before disconnecting. The production build generates a complete static-asset precache, including map/scanner modules. Camera, location, service workers, and installation require HTTPS outside localhost. iOS installation uses Share → Add to Home Screen.

## Supabase setup

1. Create a Supabase project. Run `supabase/schema.sql` once in its SQL editor.
2. Enable email/password authentication. Configure your site URL and permitted auth redirect URLs.
3. Fill in `.env`. Restart both servers after changes.
4. Create two accounts to test delivery and acknowledgments. Each account's UUID is displayed in Rescue Passport. Sender and recipient must both sign in and synchronize/refresh.
5. Optional: grant an administrator role using the trusted SQL example at the end of the schema. Role assignment is never taken from client-editable metadata.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by the frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key; database RLS enforces access |
| `NEXT_PUBLIC_API_URL` | Express API URL, default `http://localhost:4000` |
| `SUPABASE_URL` | Backend project URL |
| `SUPABASE_ANON_KEY` | Backend's user-scoped queries with the caller's verified JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; band activation, payments, and admin operations |
| `APP_ORIGIN` | Allowed frontend origin, default `http://localhost:3000` |
| `PORT` | Express port, default `4000` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Optional test credentials; only `rzp_test_` keys accepted |
| `NEXT_PUBLIC_MAP_TILE_URL` | Optional raster tile URL with `{z}/{x}/{y}` placeholders |
| `NEXT_PUBLIC_OFFLINE_TILE_URL` | Optional matching raster provider that explicitly permits offline download |

Never put service-role or payment secrets in `NEXT_PUBLIC_*` variables. Deploy the frontend and API over HTTPS. Configure your production reverse proxy and a shared rate-limit store before scaling the API across instances.

## Implemented behavior

- Responsive dashboard, dark mode, onboarding, guest mode, email signup/login, account-specific local data, and permission controls.
- IndexedDB persistence for outgoing direct/group messages, SOS, profile, community reports, inbox, and cached weather/alerts.
- SOS-first foreground synchronization every 20 seconds while signed in and online. Failed operations stay queued; a failed operation does not block later records. Guest records are deliberately not transferred automatically into an account.
- Messages: local search, timestamps, queued/server-stored state, group creation, authenticated inbox refresh, recipient receipt records. “Delivered” is based on a real receipt. For groups, it indicates at least one recipient acknowledged, not every member.
- SOS: category, explicit confirmation, optional GPS, notes, optional trusted recipient UUID, local history, server storage, and explicit recipient acknowledgment. With no recipient UUID, a signal is private storage only. No emergency dispatch exists.
- Leaflet map, current GPS/default Bengaluru location, community report filters, report severity, timestamps, and unverified labels. Reports sync to authenticated users; no fabricated shelters or safe routes.
- Open-Meteo forecast retrieval with saved timestamp and stale status. Weather alerts have a database/API and cached display. **No official ingestion feed is connected**; the interface links to IMD and never treats an empty feed as an all-clear.
- ₹299 band store, quantity/order totals, Razorpay test checkout and server signature/payment-capture verification, atomic single-use activation codes, QR generation and camera/manual-payload scanning, offline shared profile QR and scan-to-SOS.
- Admin-only inventory issuance, order fulfillment, and report moderation screens and APIs. Activation codes are hashed at rest and returned only on issuance.

## Explicit boundaries

- **Demo:** mesh peers and three-hop relay simulation. It never updates real message/SOS acknowledgments.
- **Future native:** background BLE relaying, live nearby discovery, battery-aware transport, NFC, push delivery, and continuous background sync. Browsers cannot provide reliable cross-platform BLE mesh.
- **Requires configuration:** Supabase, Razorpay test credentials, an offline-authorized map provider, and a vetted official-alert ingestion service. Production payments are intentionally blocked.
- The default OpenStreetMap raster service does not permit offline region prefetching. The Save Region action explains this until a licensed/self-hosted provider is configured. Set both map variables to the same compatible provider; the cache saves a 3×3 tile region at zoom 14 only, not all zoom levels. See https://operations.osmfoundation.org/policies/tiles/.
- Local emergency profiles are stored in browser storage, not end-to-end encrypted. Device lock and explicit local-data deletion are important on shared devices. QR medical fields are opt-in and readable by anyone holding that QR. Cloud medical data is owner-only through RLS.
- Payment validation follows Razorpay's order/signature model and independently checks captured amount, currency, and order. Real fulfillment, shipping/tax calculations, webhook reconciliation, and live-payment approval remain deployment work. Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/.
- Map community reports are unverified. Database alert records must only be inserted by trusted operators from verified official sources; users have no write permission.

## API overview

Every route below `/api` except `/api/health` requires a Supabase bearer token. Request sizes, validation, rate limiting, ownership checks, and database RLS apply.

- `GET/POST /api/profile`, `GET/POST /api/passport`
- `POST /api/sync` — idempotent UUID-keyed message/SOS/hazard insert
- `GET /api/messages`, `POST /api/messages/:id/ack`, `GET /api/receipts`
- `GET/POST /api/groups`
- `GET /api/sos`, `POST /api/sos/:id/ack`
- `GET /api/hazards`, `GET /api/alerts`
- `GET /api/bands`, `POST /api/bands/activate`
- `GET/POST /api/orders`, `POST /api/orders/verify`
- `GET /api/admin`, `POST /api/admin/bands`, `POST /api/admin/hazards/:id`, `POST /api/admin/orders/:id`

## Validation

```sh
npm run typecheck
npm test
npm run build
```

Security tests cover payment tampering, recipient validation, forged SOS acknowledgment fields, unverified community reports, and forbidden sync operation types. Supabase RLS and payment end-to-end verification require a configured test project; they cannot be validated using guest mode.

## Demo walkthrough

1. Explore as a guest, create and save a Rescue Passport.
2. Refresh the forecast and inspect the official-alert availability label.
3. Open LiveMap, allow GPS, save a community report.
4. Generate a passport QR. Scan it on another device or paste its JSON in the scanner to view the emergency profile and prepare SOS.
5. Confirm SOS. Observe “queued,” then open the explicitly labeled mesh demo. No real delivery is claimed.
6. Inspect SOS History, then the ₹299 Band store.
7. Reload after service-worker activation, disconnect internet, and save a message/SOS. Reconnect and sign in with configured credentials to test account-owned sync.

### Checks completed in this workspace

- Production compilation and TypeScript validation passed.
- All five security validation tests passed.
- Dependency audit reported zero known vulnerabilities after applying the PostCSS override.
- Desktop and 390×844 phone layouts inspected in the browser.
- API health returned HTTP 200; unconfigured protected API returned the expected HTTP 503.
- In an isolated `127.0.0.1` browser session, created a queued test message, stopped the frontend server, reloaded successfully from the service-worker cache, verified the saved message remained, and created a local SOS without the server.
- Ran the three-hop demo and confirmed its completion explicitly says no real delivery or acknowledgment occurred.
- Cloud RLS integration, two-account delivery, actual camera hardware, licensed map downloads, and payment-provider end-to-end flows were not tested because their external services/permissions were not configured.

The preview servers were stopped after validation. Restart with `npm start` and `npm run server` in separate terminals to use the production build.

## Temporary SOS SMS recipient

Confirm SOS bypasses the HOPP queue entirely and attempts to open the device's SMS composer addressed to **+91 9930923165**. The draft contains the entered person name (or the Rescue Passport name), category, notes, and a Google Maps link only when GPS has actually been attached. Missing/invalid GPS explicitly says location is not attached. The success sheet retains the draft, a retry link, and a copy-text fallback for browsers/devices that cannot open or prefill SMS.

The user must tap **Send** in their messaging app. HOPP does not send SMS automatically, cannot observe delivery, and does not create a local SOS record or acknowledgment. There is no SMS-provider integration. No live test SOS was sent during implementation.

The composer link follows [RFC 5724](https://www.rfc-editor.org/rfc/rfc5724.html). Prefilling varies by client; [Apple's documented SMS links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/SMSLinks/SMSLinks.html) only guarantee opening the destination, so the copy fallback is provided.
