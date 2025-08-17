---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## HEADERS

## TECH STACK

- ThemeProvider with next-themes and a ThemeToggle
- next-pwa
- Tailwind v4 (@tailwindcss/postcss)
- @supabase/supabase-js
- shadcn/ui
- React Hook Form
- Zod
- @radix-ui/react-popover
- @radix-ui/react-hover-card
- date-fns
- @ffmpeg/ffmpeg (for video transcoding in Edge Functions)

## PROJECT DOCUMENTATION & CONTEXT SYSTEM

### Frontend

- **Next.js 15** z App Router i Server Components
- **shadcn/ui** do komponentów UI z Tailwind CSS
- **TanStack React Query** do zarządzania stanem i cache'owaniem danych
- **React Hook Form + Zod** do walidacji formularzy
- **Tailwind CSS** do responsywnego stylu

### Backend i Infrastruktura

- **Supabase Auth** do autentykacji i autoryzacji
- **Supabase Database** (PostgreSQL) z Row Level Security
- **Supabase Storage** do przechowywania plików i zdjęć
- **Supabase Edge Functions** do funkcji backendowych
- **Supabase Realtime** do wiadomości na żywo

### PWA i Mobile-First

- **Progressive Web App** z service workers
- **Mobile-first design** z pełną responsywnością
- **Push notifications** dla powiadomień
- **Offline functionality** dla podstawowych funkcji

## Główne Funkcje Aplikacji

### 1. Profil Użytkownika

```typescript
interface UserProfile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  cover_image_url: string
  private_key_vault JSONB,

  // Informacje LGBTQ-specyficzne
  sexual_orientation?: string[]
  gender_identity?: string[]
  pronouns: string

  // Kontakt
  email?: string
  website?: string
  social_links?: {
    instagram?: string
    twitter?: string
    tiktok?: string
  }

  // Lokalizacja
  city?: string
  country: string

  // Prywatność
  profile_visibility: "public" | "friends" | "private"
  show_location: boolean
  show_orientation: boolean
  show_friends: boolean

  created_at: string
  updated_at: string
  roles: app_role[]
  badges: string[]
  onboarded_at: string // Tracks onboarding completion
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_reason TEXT,
  suspended_by UUID REFERENCES users(id) ON DELETE SET NULL
}
```

**Funkcje profilu:**[1][2]

- Personalny awatar z możliwością uploadowania (max size: 2MB)
- Rozbudowane opcje tożsamości płciowej i orientacji seksualnej
- System zaimków (on/ona/ono, they/them, własne)
- Galeria zdjęć użytkownika
- Lista wspólnych znajomych
- Posty użytkownika z paginacją
- Wydarzenia w których uczestniczy
- Społeczności do których należy
- Cover image (max size: 5MB)
- Add "follow/observe" functionality to profiles with counts and safe guards.
- Build addictional profile badges based on uploaded icons in `/tecza-badge` and database, admin panel.
- Focus to correct UI on mobile devices for user profile page cause currently is problem to navigate profile on mobile devices and see ex. profile avatar.

### 2. System Postów i Feed

```typescript
interface Post {
  id: string
  user_id: string
  content: string
  media_urls?: string[]

  // Wsparcie dla różnych typów treści
  type: "text" | "image" | "video" | "event" | "poll"
  embedded_links?: EmbeddedLink[]
  mentions?: string[] // user IDs
  hashtags?: string[]

  // Prywatność
  visibility: "public" | "friends" | "private" | "unlisted"
  share_token?: string // dla prywatnych postów z linkiem

  // Interakcje
  likes_count: number
  comments_count: number
  reposts_count: number

  created_at: string
  updated_at: string
  hidden_at TIMESTAMP WITH TIME ZONE,
  hidden_reason TEXT,                -- Added for moderation
  hidden_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Added for moderation

}

interface PostInteraction {
  id: string
  post_id: string
  user_id: string
  type: "like" | "comment" | "repost"
  content?: string // dla komentarzy
  created_at: string
}
```

**Funkcje feedu:**[3][4]

- **Infinite scrolling** z TanStack Query
- **Optimistic updates** dla polubień i komentarzy
- **Markdown support** w postach i komentarzach
- **Emoji picker** z custom LGBTQ emoji
- **Link embedding** z preview
- **Hashtag system** (#PrideWarsaw, #TransRights)
- **Mention system** (@username)
- **Repost/Quote tweet** functionality
- **Tęczowe polubienia** zamiast standardowych serc

### 3. System Znajomych "Połącz się"

```typescript
interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: "pending" | "accepted" | "rejected" | "cancelled"
  message?: string
  created_at: string
  responded_at?: string
}

interface Friendship {
  id: string
  user1_id: string
  user2_id: string
  status: "active" | "blocked"
  created_at: string
}
```

**Inspirowany aplikacją BARQ:**[5]

- Obaj użytkownicy muszą kliknąć "Połącz się" aby zostać znajomymi
- Prywatne wiadomości dostępne tylko między znajomymi
- Posty "dla znajomych" widoczne tylko dla połączonych użytkowników
- System blokowania użytkowników
- Lista wspólnych znajomych

### 4. Społeczności

```typescript
interface Community {
  id: string
  name: string
  description: string
  avatar_url: string
  cover_image_url: string

  // Typ społeczności
  type: "public" | "private" | "restricted"
  category: string // 'support', 'social', 'activism', 'hobby'

  // Lokalizacja
  city?: string
  country?: string
  is_local: boolean

  // Członkowie
  members_count: number
  owner_id: string
  moderators: string[]

  // Funkcje
  has_chat: boolean
  has_events: boolean
  has_wiki: boolean

  created_at: string
}

interface CommunityMembership {
  id: string
  community_id: string
  user_id: string
  role: "owner" | "moderator" | "member"
  joined_at: string
}
```

**Funkcje społeczności:**[2][3]

- Tworzenie i zarządzanie społecznościami
- Społeczności lokalne (np. "LGBTQ Kraków", "Trans Warszawa")
- Grupy wsparcia i aktywizmu
- Automatyczny grupowy chat z kanałami (#ogólny, #wydarzenia, #wsparcie)
- System ról (właściciel, moderator, członek)
- Baza wiedzy/Wiki dla każdej społeczności
- Wydarzenia społeczności
- Build fully functional communities functionality based on instructions and add missing setups to database cause currently creating community:
  - POST https://earfxvgvrqgyfzuwaqga.supabase.co/rest/v1/communities?select=id%2Cslug 500 (Internal Server Error)
  - if user not company-supporter, moderator, administrator, or have dedicated privilige setup in admin panel, before creating new community need to be moderated and accepted to create in admin panel. Build also functionalities for admins and mods to moderate communities, delete or edit details, delete icons and banners
  - After creating new community, if user is not `company-supporter`, `moderator`, `administrator`, or has a dedicated privilege set up in the admin panel, the community needs to be moderated and accepted by admins/mods before it becomes active.
  - Update community creation and listing pages to use the `/c` routes and handle pending status cleanly, with basic error handling for join attempts on pending communities.

### 5. System Wiadomości

```typescript
interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string

  // Typ wiadomości
  type: "text" | "image" | "file" | "gif" | "link"
  media_url?: string
  file_name?: string
  file_size?: number

  // Status
  is_read: boolean
  read_at?: string
  is_deleted: boolean

  created_at: string
}

interface Conversation {
  id: string
  type: "direct" | "group"
  participants: string[]
  last_message_at: string
  created_at: string
}
```

**Funkcje wiadomości:**[6]

- Wiadomości prywatne między znajomymi
- Grupowe czaty społeczności
- Wsparcie dla plików, zdjęć, GIF-ów (TENOR API)
- Markdown w wiadomościach
- Link embedding
- Emoji reactions
- Status "przeczytane"
- Push notifications dla nowych wiadomości
- Encrypted messages communication between friendship users with possibility to exchange images (converted to webp, supabase storage support with encryption), videos (converted to webm, supabase storage support with encryption) and files max to 10mb, emoji picker.
- Implement client-side encryption using Web Crypto API.
- Set up real-time message updates with Supabase Realtime.
- Process and encrypt images/videos before storage.
- Ensure only friends can message each other.
- Repair importing after moving to correct dir
- Build `@/hooks/use-auth`
- Check Supabase DB migrations to ensure `conversationID` is based on the routing folder in `app/messages`
  - Ensure migrations use conversationId matching route
- Setup user key management:
  - Implement secure key storage (consider avoiding IndexedDB with encryption) Consider avoiding indexedDB when users will be using message functionality on different devices.
    - Secure key storage (avoid IndexedDB) — Implemented (session-only; server-persisted public key), propose optional passphrase vault — Partial
  - Add key generation during user registration
    - Key generation on registration/first login — Done (on first authenticated session)
  - Implement key exchange protocol for conversations
    - Key exchange in conversations — Done (wrap with RSA if public keys present, fallback to raw AES)
- Add server-side video processing:
  - Set up Supabase Edge Function with ffmpeg for video transcoding
    - Server-side video processing (Edge Function with ffmpeg) — Scaffolded placeholders — Partial
- Implement chunked upload for large files
  - Chunked upload for large files — Done (client helper)
- Enhance security:
  - Add rate limiting for message sending
    - Rate limiting for message sending — Done (trigger-based)
  - Implement message deletion with secure overwrite
    - Message deletion with secure overwrite — Schema + helper function added; needs Edge job — Partial
  - Add virus scanning for uploaded files
    - Virus scanning for uploads — Scaffolded placeholder — Partial
  - Consider using this encryption flow:
    - User composes a message in the UI.
    - Client encrypts the message (E2EE) or sends plain text to API.
    - Server encrypts message using Node.js crypto before storage.
    - When retrieving, server decrypts and passes to authenticated users.
  - Client E2EE: uses AES-GCM conversation keys. If both participants have `profiles.public_key`, the shared key is wrapped with RSA-OAEP per user; otherwise it falls back to a raw exported AES key per user (not ideal long-term but keeps UX unblocked).
  - Server-side encryption path: keep plaintext on the client until a Supabase Edge Function encrypts it with a service-held key and stores ciphertext. We scaffolded the Edge entry points so you can move encryption off the client when preferred. Deno’s SubtleCrypto works well for AES-GCM in Edge Functions.
  - Multi-device note: we avoided IndexedDB by default. Private keys aren’t uploaded. To use E2EE across devices:
    - Option A (manual): export the private key from one device and import on another (offer a simple “export/import key” UI).
    - Option B (passphrase vault): encrypt the private key client-side with a passphrase-derived key (PBKDF2/Argon2) and store the encrypted blob in Supabase; decrypt locally on each device when the user enters the passphrase. This keeps the server zero-knowledge.
  - Implement the passphrase-protected private key vault and export/import UI.
  - Finish the ffmpeg transcode Edge Function and route it into the upload flow.
  - Add the purge worker and wire a “Delete securely” action in the UI.
  - Continue building messages to working functionality with push notification, encryption, emoji reactions, image, video sending, link preview and dedicated messages page to list all chats and communite with users based on instructions. Check are supabase properly support all chat functionalities. Check UI are mobile responsive, accessible. Check are code optimized for large database communication.

### 6. System Wydarzeń

```typescript
interface Event {
  id: string
  title: string
  description: string

  // Lokalizacja i czas
  location: string
  city: string
  country: string
  coordinates?: { lat: number; lng: number }
  start_date: string
  end_date?: string
  timezone: string

  // Organizator
  organizer_id: string
  community_id?: string

  // Typ wydarzenia
  category: "pride" | "support" | "social" | "activism" | "education" | "other"
  is_online: boolean
  is_free: boolean
  max_participants?: number

  // Prywatność
  visibility: "public" | "friends" | "community" | "private"
  requires_approval: boolean

  // Media
  cover_image_url?: string

  created_at: string
}

interface EventParticipation {
  id: string
  event_id: string
  user_id: string
  status: "interested" | "attending" | "not_attending"
  created_at: string
}
```

**Funkcje wydarzeń:**[2]

- Tworzenie publicznych i prywatnych wydarzeń
- Filtrowanie po lokalizacji, kategorii, czasie
- "Obserwuj" vs "Biorę udział" opcje
- Export do kalendarza (iCal format)
- Mapa wydarzeń
- Wydarzenia cykliczne
- Integracja z wydarzeniami społeczności
- Build fully functional events functionality based on instructions and add missing setups to database cause currently creating events:
  - POST https://earfxvgvrqgyfzuwaqga.supabase.co/rest/v1/communities?select=id%2Cslug 500 (Internal Server Error)
  - Events can be created by users without any specific permissions.

### 7. System Bezpieczeństwa i Moderacji

**Funkcje bezpieczeństwa:**[7][8][9]

- **Content moderation** z AI i manual review
- **Report system** dla treści i użytkowników
- **Block/Mute functionality**
- **Privacy controls** per post
- **Two-factor authentication** (2FA)
- **Email verification**
- **Phone verification** (opcjonalne)

```typescript
interface ModerationReport {
  id: string
  reporter_id: string
  reported_id: string // user or post ID
  type: "user" | "post" | "comment" | "message"
  reason:
    | "hate_speech"
    | "harassment"
    | "spam"
    | "inappropriate_content"
    | "other"
  description: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
}
```

### 8. Progressive Web App Features

**PWA Capabilities:**[10][11][12]

```typescript
// Service Worker dla offline functionality
interface PWAFeatures {
  offline_support: boolean
  push_notifications: boolean
  installable: boolean
  home_screen_icon: boolean
  splash_screen: boolean
  background_sync: boolean
}
```

- **Offline reading** cached postów
- **Push notifications** dla wiadomości i wydarzeń
- **Home screen installation**
- **Background sync** dla nowych treści
- **Camera integration** dla zdjęć
- **File sharing** między aplikacjami
- **Deep linking** do postów i profili

## Dodatkowe Funkcje Społecznościowe

### 1. Stories/Status (24h)

```typescript
interface Story {
  id: string
  user_id: string
  media_url: string
  text?: string
  expires_at: string
  viewers: string[]
  created_at: string
}
```

### 2. Live Streaming

- Wsparcie dla live streamów
- Q&A sessions z aktywistami
- Virtual Pride events

### 3. Marketplace/Resources

- Local LGBTQ-friendly businesses
- Job board z LGBTQ-inclusive companies
- Housing/roommate finder

### 4. Mental Health & Support

- Crisis resources per location
- Anonymous support groups
- Integration z helplines (116 111, Kampania Przeciw Homofobii)

### 5. Dating/Connections (opcjonalnie)

- Optional dating mode
- Friendship-focused matching
- Event buddies matching

### 6. Verification System

```typescript
interface Verification {
  id: string
  user_id: string
  type: "identity" | "organization" | "activist" | "business"
  status: "pending" | "verified" | "rejected"
  documents: string[]
  verified_at?: string
}
```

### 7. Observation Functionality

- Add "follow/observe" functionality to profiles with counts and safe guards.

## Internationalization (i18n)

**Supported Languages:**

- **Polski** (podstawowy)
- **English**
- **Deutsch**
- **Français**
- **Español**
- **Italiano**
- **Українська** (wsparcie dla uchodźców)
- **Русский**

```typescript
// i18n configuration
const locales = ["pl", "en", "de", "fr", "es", "it", "uk", "ru"]
const defaultLocale = "pl"
```

## Design System i UI/UX

### General UI Standards

- Create fluent, modern UI with the best UX.
- Ensure all UI elements are mobile responsive.
- Ensure all UI elements are accessible for disabled people (WCAG-friendly).
- Ensure all UI elements are accessible for disabled people (WCAG 2.1 guidelines).
- Implement a dark theme version for all UI elements.
- Use semantic landmarks, aria-labels, focus styles, and a consistent heading hierarchy for accessibility.
- Buttons/links must have clear focus rings and labels.

### Color Palette

```css
:root {
  /* Pride Colors */
  --pride-red: #e40303;
  --pride-orange: #ff8c00;
  --pride-yellow: #ffed00;
  --pride-green: #008018;
  --pride-blue: #0078d7;
  --pride-purple: #732982;

  /* App Colors */
  --primary: #0078d7;
  --secondary: #732982;
  --accent: #ff8c00;

  /* Dark Mode */
  --background-dark: #0a0a0a;
  --surface-dark: #1a1a1a;
  --text-dark: #ffffff;
}
```

### UI Components (shadcn/ui based)

- **Rainbow buttons** z gradient effects
- **Pride-themed badges** dla różnych tożsamości
- **Animated icons** i micro-interactions
- **Glassmorphism effects** dla kart
- **Custom emoji picker** z LGBTQ emoji
- **Dark/Light/System theme toggle**

### Mobile-First Layout

```tsx
// Layout responsive breakpoints
const breakpoints = {
  sm: "640px", // Mobile
  md: "768px", // Tablet
  lg: "1024px", // Desktop
  xl: "1280px", // Large Desktop
}
```

## Database Schema (Supabase)

### Tables Structure

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  private_key_vault JSONB,

  -- LGBTQ Identity
  sexual_orientation TEXT[],
  gender_identity TEXT[],
  pronouns TEXT,

  -- Location
  city TEXT,
  country TEXT DEFAULT 'Poland',

  -- Privacy
  profile_visibility TEXT DEFAULT 'public',
  show_location BOOLEAN DEFAULT false,
  show_orientation BOOLEAN DEFAULT true,
  show_friends BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  roles app_role[] DEFAULT ARRAY['user']::app_role[],
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  onboarded_at TIMESTAMPTZ,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_reason TEXT,
  suspended_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  type TEXT DEFAULT 'text',
  visibility TEXT DEFAULT 'public',
  hashtags TEXT[],
  mentions UUID[],
  hidden_at TIMESTAMP WITH TIME ZONE, -- Added for moderation
  hidden_reason TEXT,                -- Added for moderation
  hidden_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Added for moderation

  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER 0,
  reposts_count INTEGER 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (profile_visibility = 'public');

CREATE POLICY "Users can view friends profiles" ON users
  FOR SELECT USING (
    profile_visibility = 'friends' AND
    id IN (
      SELECT CASE
        WHEN user1_id = auth.uid() THEN user2_id
        ELSE user1_id
      END
      FROM friendships
      WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
      AND status = 'active'
    )
  );
```

## Supabase Edge Functions

### 1. Content Moderation Function

```typescript
// supabase/functions/moderate-content/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { content, type } = await req.json()

  // AI moderation check
  const moderationResult = await moderateContent(content, type)

  if (moderationResult.flagged) {
    // Auto-hide content and notify moderators
    await hideContent(content.id)
    await notifyModerators(content.id, moderationResult.reason)
  }

  return new Response(JSON.stringify({ success: true }))
})
```

### 2. Push Notifications

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { user_id, title, body, type } = await req.json()

  await sendPushNotification({
    user_id,
    title,
    body,
    icon: "/icons/pride-icon-192.png",
    badge: "/icons/pride-badge-72.png",
    data: { type, timestamp: Date.now() },
  })
})
```

### 3. Video Transcode Function

```typescript
// supabase/functions/video-transcode/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Placeholder - implement ffmpeg transcoding here
  return new Response(
    JSON.stringify({ success: false, message: "Not implemented" }),
    {
      status: 501,
    },
  )
})
```

### 4. Virus Scan Function

```typescript
// supabase/functions/virus-scan/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Placeholder - implement virus scanning here
  return new Response(
    JSON.stringify({ success: false, message: "Not implemented" }),
    {
      status: 501,
    },
  )
})
```

### 5. Secure Purge Worker

```typescript
// supabase/functions/purge-messages/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Placeholder - implement secure message purging here
  return new Response(
    JSON.stringify({ success: false, message: "Not implemented" }),
    {
      status: 501,
    },
  )
})
```

## Deployment i CI/CD

### Vercel Deployment

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: false,
  },
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://your-supabase-project.supabase.co/rest/v1/:path*",
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/communities/:path*",
        destination: "/c/:path*",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/d",
        permanent: true,
      },
      {
        source: "/events/:path*",
        destination: "/w/:path*",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/l",
        permanent: true,
      },
      {
        source: "/messages/:path*",
        destination: "/m/:path*",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/r",
        permanent: true,
      },
      {
        source: "/settings",
        destination: "/s",
        permanent: true,
      },
      {
        source: "/profile",
        destination: "/u",
        permanent: false, // Non-permanent redirect to /u
      },
      {
        source: "/reset-password",
        destination: "/l",
        permanent: true,
      },
      {
        source: "/tos",
        destination: "/tos",
        permanent: true,
      },
      {
        source: "/pp",
        destination: "/pp",
        permanent: true,
      },
      {
        source: "/messages/[conversationId]",
        destination: "/m/[conversationId]",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/admin",
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
```

### PWA Configuration

```javascript
// PWA manifest
{
  "name": "Tęcza.app - LGBTQ Polska",
  "short_name": "Tęcza",
  "description": "Aplikacja społecznościowa dla polskiej społeczności LGBTQ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0078d7",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Monitoring i Analytics

### Privacy-First Analytics

- **Plausible Analytics** zamiast Google Analytics
- **User consent** dla wszystkich cookies
- **GDPR compliance** z prawem do usunięcia danych
- **No tracking** bez zgody użytkownika

## Launch Strategy

### Phase 1: MVP (3 miesiące)

- Basic profile system
- Post creation and feed
- Friend connections
- Direct messaging
- Basic moderation

### Phase 2: Community (6 miesięcy)

- Communities system
- Events system
- Enhanced moderation
- Mobile app optimization

### Phase 3: Advanced Features (9 miesięcy)

- Stories/Status
- Live streaming
- Advanced privacy controls
- Business directory

## CODING STANDARDS

### General UI Standards

- Create fluent, modern UI with the best UX.
- Ensure all UI elements are mobile responsive.
- Ensure all UI elements are accessible for disabled people (WCAG-friendly).
- Ensure all UI elements are accessible for disabled people (WCAG 2.1 guidelines).
- Implement a dark theme version for all UI elements.
- Use semantic landmarks, aria-labels, focus styles, and a consistent heading hierarchy for accessibility.
- Buttons/links must have clear focus rings and labels.
- For logged-in users, create custom site headers with profile icons and menu options (Profil, Ustawienia, Wyloguj się) and dedicated header navigation and footers.
- After successful login, the user should be redirected to the /dashboard page.
- If a user profile does not exist for a given username, return a 404 error.
- Focus to correct UI on mobile devices for user profile page cause currently is problem to navigate profile on mobile devices and see ex. profile avatar.
- After providing changes, always start new finalizing process to first run prettier formatting, then linting, and finally a build process to check proper validation and code combatibility.

### Homepage Standards

- The homepage should include an introduction to the application.
- The homepage should describe the public feed lookup functionality.
- The homepage should list the application's features.
- The homepage should explain how users can contribute.
- The homepage should be written in Polish.
- The homepage should contain a header with navigation, a login button, and a logotype.
- The homepage should include a "Społeczności" link in the public site header (desktop and mobile menus).
- The homepage should contain a global small footer with a copyright notice.
- The homepage must include a "skip to content" link.
- The site language must be set to Polish and metadata/OG tags should be improved.
- Add `suppressHydrationWarning` to the body to minimize hydration mismatches.
- Make the footer year robust with a `<time>` element.
- The public footer `site-footer.tsx` must include “Regulamin” link to `/tos` and “Prywatność” link to `/pp`.
- Remove from global search using "/" cause does making missclicking and opening search bar when it's not wanted

### Login/Register Page Standards

- The login/register page should support OAuth login using Discord or Google.
- The login/register page should support 2FA.
- The login/register page should support "forgot password" functionality.
- The login/register page must be accessible based on WCAG 2.1 guidelines.
- The login/register page must be mobile responsive.
- Develop register option to add possibility to choose username with tag and rebuild settings to block changing username, force only visible name and email (also private email).
  - Remove tags from username (in login, register and profile) and use only unique created username on registering profile.
  - Add Visible name to register process.
  - Usernames must be unique.
  - During registration, the username is saved in the `profiles.username` and the visible name in `profiles.display_name`.
  - The `username` is stored in lowercase and its uniqueness is checked against `profiles`.

### Dashboard Standards

- The user dashboard should display a feed of new posts.
- The user dashboard should include a composer for adding new posts with markdown and embed link support. The post composer should be a dialog component from shadcn.
- The post composer should allow users to set post visibility to public, friends, or custom.
- User posts must be stored in the database.
- Design more dashboard page for removing heading and sub heading, leaving twój pulpit badge and Adding create new post button
- Change refresh button as reshesh icon next to create new post button in dashboard.

### User Profile and Settings Standards

- Implement user profile pages displaying user information.
- Implement user settings pages allowing users to edit their profile information.
- The header "Profil" option for logged in users should link to `/u/[username]`.
- The old `/profile` page should be removed.
- The `/u/[username]` page should:
  - Display the user's avatar, cover, display name/username, and pronouns.
  - Display the user's bio and badges for sexual orientation/gender identity (based on privacy flags).
  - Optionally display the user's location, website, and social links.
  - Include a "Połącz się" button wired to the friendships table; show "Połączeni" when already connected. This should implement a friend request flow (pending/accept/cancel) instead of instant connect.
  - Implement user profile editting background image, avatar image, adding information column, visible public post based on database, visible public list of connected friends based on database (based on user settings). Images locate in supabase storage functionality.
    - Avatar image max size: 2MB.
    - Cover image max size: 5MB.
  - Build full functional user settings with options to change user details, accessibility settings, 2fa options, oauth connections, change password, privacy settings, delete account (with full clearing data).
  - Remove profile editing from settings and move edit own user profile to `/u/[
