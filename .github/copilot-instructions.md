---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## HEADERS

## TECH STACK
*   ThemeProvider with next-themes and a ThemeToggle
*   next-pwa
*   Tailwind v4 (@tailwindcss/postcss)
*   @supabase/supabase-js
*   shadcn/ui
*   React Hook Form
*   Zod
*   @radix-ui/react-popover
*   @radix-ui/react-hover-card

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
  profile_visibility: 'public' | 'friends' | 'private'
  show_location: boolean
  show_orientation: boolean
  show_friends: boolean
  
  created_at: string
  updated_at: string
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

### 2. System Postów i Feed
```typescript
interface Post {
  id: string
  user_id: string
  content: string
  media_urls?: string[]
  
  // Wsparcie dla różnych typów treści
  type: 'text' | 'image' | 'video' | 'event' | 'poll'
  embedded_links?: EmbeddedLink[]
  mentions?: string[] // user IDs
  hashtags?: string[]
  
  // Prywatność
  visibility: 'public' | 'friends' | 'private' | 'unlisted'
  share_token?: string // dla prywatnych postów z linkiem
  
  // Interakcje
  likes_count: number
  comments_count: number
  reposts_count: number
  
  created_at: string
  updated_at: string
}

interface PostInteraction {
  id: string
  post_id: string
  user_id: string
  type: 'like' | 'comment' | 'repost'
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
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  message?: string
  created_at: string
  responded_at?: string
}

interface Friendship {
  id: string
  user1_id: string
  user2_id: string
  status: 'active' | 'blocked'
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
  type: 'public' | 'private' | 'restricted'
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
  role: 'owner' | 'moderator' | 'member'
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

### 5. System Wiadomości
```typescript
interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  
  // Typ wiadomości
  type: 'text' | 'image' | 'file' | 'gif' | 'link'
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
  type: 'direct' | 'group'
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
  category: 'pride' | 'support' | 'social' | 'activism' | 'education' | 'other'
  is_online: boolean
  is_free: boolean
  max_participants?: number
  
  // Prywatność
  visibility: 'public' | 'friends' | 'community' | 'private'
  requires_approval: boolean
  
  // Media
  cover_image_url?: string
  
  created_at: string
}

interface EventParticipation {
  id: string
  event_id: string
  user_id: string
  status: 'interested' | 'attending' | 'not_attending'
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
  type: 'user' | 'post' | 'comment' | 'message'
  reason: 'hate_speech' | 'harassment' | 'spam' | 'inappropriate_content' | 'other'
  description: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
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
  type: 'identity' | 'organization' | 'activist' | 'business'
  status: 'pending' | 'verified' | 'rejected'
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
const locales = ['pl', 'en', 'de', 'fr', 'es', 'it', 'uk', 'ru']
const defaultLocale = 'pl'
```

## Design System i UI/UX

### General UI Standards
*   Create fluent, modern UI with the best UX.
*   Ensure all UI elements are mobile responsive.
*   Ensure all UI elements are accessible for disabled people (WCAG-friendly).
*   Ensure all UI elements are accessible for disabled people (WCAG 2.1 guidelines).
*   Implement a dark theme version for all UI elements.
*   Use semantic landmarks, aria-labels, focus styles, and a consistent heading hierarchy for accessibility.
*   Buttons/links must have clear focus rings and labels.

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
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px'   // Large Desktop
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  
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
serve(async (req) => {
  const { user_id, title, body, type } = await req.json()
  
  await sendPushNotification({
    user_id,
    title,
    body,
    icon: '/icons/pride-icon-192.png',
    badge: '/icons/pride-badge-72.png',
    data: { type, timestamp: Date.now() }
  })
})
```

## Deployment i CI/CD

### Vercel Deployment
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://your-supabase-project.supabase.co/rest/v1/:path*'
      }
    ]
  }
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

## Monitoring i Analytics

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
*   Create fluent, modern UI with the best UX.
*   Ensure all UI elements are mobile responsive.
*   Ensure all UI elements are accessible for disabled people (WCAG-friendly).
*   Ensure all UI elements are accessible for disabled people (WCAG 2.1 guidelines).
*   Implement a dark theme version for all UI elements.
*   Use semantic landmarks, aria-labels, focus styles, and a consistent heading hierarchy for accessibility.
*   Buttons/links must have clear focus rings and labels.
*   For logged-in users, create custom site headers with profile icons and menu options (Profil, Ustawienia, Wyloguj się) and dedicated header navigation and footers.
*   After successful login, the user should be redirected to the /dashboard page.
*   If a user profile does not exist for a given username, return a 404 error.

### Homepage Standards
*   The homepage should include an introduction to the application.
*   The homepage should describe the public feed lookup functionality.
*   The homepage should list the application's features.
*   The homepage should explain how users can contribute.
*   The homepage should be written in Polish.
*   The homepage should contain a header with navigation, a login button, and a logotype.
*   The homepage should include a "Społeczności" link in the public site header (desktop and mobile menus).
*   The homepage should contain a global small footer with a copyright notice.
*   The homepage must include a "skip to content" link.
*   The site language must be set to Polish and metadata/OG tags should be improved.
*   Add `suppressHydrationWarning` to the body to minimize hydration mismatches.
*   Make the footer year robust with a `<time>` element.

### Login/Register Page Standards
*   The login/register page should support OAuth login using Discord or Google.
*   The login/register page should support 2FA.
*   The login/register page should support "forgot password" functionality.
*   The login/register page must be accessible based on WCAG 2.1 guidelines.
*   The login/register page must be mobile responsive.
*   Develop register option to add possibility to choose username with tag and rebuild settings to block changing username, force only visible name and email (also private email).
    *   Remove tags from username (in login, register and profile) and use only unique created username on registering profile.
    *   Add Visible name to register process.
    *   Usernames must be unique.
    *   During registration, the username is saved in the `profiles.username` and the visible name in `profiles.display_name`.
    *   The `username` is stored in lowercase and its uniqueness is checked against `profiles`.

### Dashboard Standards
*   The user dashboard should display a feed of new posts.
*   The user dashboard should include a composer for adding new posts with markdown and embed link support. The post composer should be a dialog component from shadcn.
*   The post composer should allow users to set post visibility to public, friends, or custom.
*   User posts must be stored in the database.
*   Design more dashboard page for removing heading and sub heading, leaving twój pulpit badge and Adding create new post button
*   Change refresh button as reshesh icon next to create new post button in dashboard.

### User Profile and Settings Standards
*   Implement user profile pages displaying user information.
*   Implement user settings pages allowing users to edit their profile information.
*   The header "Profil" option for logged in users should link to `/u/[username]`.
*   The old `/profile` page should be removed.
*   The `/u/[username]` page should:
    *   Display the user's avatar, cover, display name/username, and pronouns.
    *   Display the user's bio and badges for sexual orientation/gender identity (based on privacy flags).
    *   Optionally display the user's location, website, and social links.
    *   Include a "Połącz się" button wired to the friendships table; show "Połączeni" when already connected. This should implement a friend request flow (pending/accept/cancel) instead of instant connect.
    *   List recent posts for that user, limited to 20, with visibility enforced by RLS.
    *   Implement user profile editting background image, avatar image, adding information column, visible public post based on database, visible public list of connected friends based on database (based on user settings). Images locate in supabase storage functionality.
        *   Avatar image max size: 2MB.
        *   Cover image max size: 5MB.
    *   Build full functional user settings with options to change user details, accessibility settings, 2fa options, oauth connections, change password, privacy settings, delete account (with full clearing data).
    *   Remove profile editing from settings and move edit own user profile to `/u/[username]` adding edit profile button and intuitive build UI to freely edit profile components. Note to load properly username with hashtag tag which are not changeable after registration. All things in profile like bio, pronouns, city, country, webpage, public email, avatar, background image, instagram, twitter, tiktok are optional. Visible location, visible orientation, visible list of friends leave only in privacy section in settings.
    *   Add support for sexual orientation, gender identity in user profiles and editing them.
    *   Add support for pronouns on profile (add badge next to visible name in profile)
    *   Build more interesting Information section using badges and icons.
    *   Use drawer component from shadcn for edit profile form.
    *   Ensure the "Edytuj profil" button shows when the URL username matches the logged-in user’s metadata or profile row.
    *   If a user profile does not exist for a given username, return a 404 error.
    *   Add options to edit or remove own published post on feed looking into own user profile preview

### Community Standards
*   The header should include a "Społeczności" link.

### Events Standards
*   Implement events database migration with RLS and storage bucket.

## WORKFLOW & RELEASE RULES

## DEBUGGING
*   To minimize hydration mismatches: add `suppressHydrationWarning` to the body and html.
*   To further minimize hydration mismatches, the theme toggle should render a neutral, static button until the client mounts, then switch to the dynamic label/icons. Add `suppressHydrationWarning` on the button for extra safety.
*   If CSS is not loading properly on the homepage:
    *   Kill stale service worker that can serve old HTML.
        1.  Chrome/Edge: open the site, press F12 → Application (or Application > Service Workers)
        2.  Under Service Workers, click “Unregister” for your site
        3.  Also clear storage: Application > Clear storage → check “Unregister service workers” + “Cache storage” + “IndexedDB” → Clear site data
        4.  Alternatively, open in an Incognito window to test fresh
    *   Restart the dev server in Webpack mode
        1.  `npm run dev`
        2.  If it errors, try a clean:
            `rd /s /q .next`
            `npm run dev`
    *   Hard reload your browser
        1.  Windows: Ctrl+F5 (or Shift+Refresh) on the home page
        2.  Verify that you see:
            *   Polish hero: “Tęcza.app — bezpieczna, nowoczesna społeczność…”
            *   Header with logo, nav, Zaloguj
            *   Footer with copyright
    *   If it still shows the stock page
        1.  Verify you’re opening the running dev URL (usually http://localhost:3000/) and not a static file/old build tab.
        2.  Try a private window.
        3.  Check the DevTools Network tab (Disable cache) and reload—confirm /_next/* assets load and there’s no 404 for /_next/app-build-manifest.json.
*   To fix "useSearchParams should be wrapped in a suspense boundary" on the 404 page: remove `useSearchParams` and read query params via `window.location` in `useEffect` after mount.
*   When encountering a "Multiple GoTrueClient instances detected" error, review the Supabase browser client helper (`supabase-browser.ts`) for potential multiple client instantiations. Use a singleton with storageKey "tecza-app-auth" to avoid this warning.
*   When encountering `Event handlers cannot be passed to Client Component props` error, do not pass functions from Server Components to Client Components during prerender. Client components should handle their own interactivity, or you can invoke client-server actions via server actions, not as props.
*   If local Supabase fails due to a Postgres version mismatch (data dir init’d with v17, container expects v15), reset the local DB volume by removing the supabase_db_tecza-app Docker volume and restarting Supabase. Also, disable analytics in `config.toml` to avoid the vector “unhealthy” loop during local dev.
*   If migrations fail due to `create policy if not exists ...` errors, remove `IF NOT EXISTS` from policy statements in the migration files. PostgreSQL versions prior to 16 do not support this syntax.
*   If facing issues with homepage not loading or CSS not loading properly:
    *   Kill stale service worker that can serve old HTML.
        1.  Chrome/Edge: open the site, press F12 → Application (or Application > Service Workers)
        2.  Under Service Workers, click “Unregister” for your site
        3.  Also clear storage: Application > Clear storage → check “Unregister service workers” + “Cache storage” + “IndexedDB” → Clear site data
        4.  Alternatively, open in an Incognito window to test fresh
    *   Restart the dev server in Webpack mode
        1.  `npm run dev`
        2.  If it errors, try a clean:
            `rd /s /q .next`
            `npm run dev`
    *   Hard reload your browser
        1.  Windows: Ctrl+F5 (or Shift+Refresh) on the home page
        2.  Verify that you see:
            *   Polish hero: “Tęcza.app — bezpieczna, nowoczesna społeczność…”
            *   Header with logo, nav, Zaloguj
            *   Footer with copyright
    *   If it still shows the stock page
        1.  Verify you’re opening the running dev URL (usually http://localhost:3000/) and not a static file/old build tab.
        2.  Try a private window.
        3.  Check the DevTools Network tab (Disable cache) and reload—confirm /_next/* assets load and there’s no 404 for /_next/app-build-manifest.json.
*   When encountering a "Multiple GoTrueClient instances detected" error, review the Supabase browser client helper (`supabase-browser.ts`) for potential multiple client instantiations. Use a singleton with storageKey "tecza-app-auth" to avoid this warning.
*   When a "Multiple GoTrueClient instances detected" error is encountered, review the Supabase browser client helper (`supabase-browser.ts`) for potential multiple client instantiations. Use a singleton with storageKey "tecza-app-auth" to avoid this warning.
*   If a "Module not found: Can't resolve '@/components/ui/popover'" error occurs during the build, add the shadcn popover wrapper.
*   If a "Component is not a function" error occurs for `Textarea` in the profile page, ensure `textarea.tsx` is marked with `"use client"`. Also, ensure the export/import import form matches to avoid interop issues: use default import: `import Textarea from "@/components/ui/textarea"`.
*   If a `DialogContent` error occurs in console, `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users. If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.
*   If the local Supabase ports are not available, it indicates that another process on the machine is using the required port. In this case, identify and stop the process that is using the required port. Update `config.toml` to move ports out of the Windows excluded range and then restart Supabase again. The new ports are:
    *   API: 55421
    *   DB: 55432 (shadow: 55430)
    *   Studio: 55423
    *   Inbucket: 55424
    *   Analytics: 55427
    *   Pooler: 55439
*   If a `NetworkError when attempting to fetch resource` error occurs, check that the app has a proper connection to local supabase.
*   When encountering  `[Error: EINVAL: invalid argument, readlink 'C:\Users\Artur\OneDrive\Dokumenty\tecza-app\.next\server\middleware-build-manifest.js']` , prune containers and network by running `docker system prune -a --volumes` and then restart.
*   If you encounter the error `ERROR: function storage.create_bucket(unknown, public => boolean) does not exist (SQLSTATE 42883)`, update the storage migration to be compatible with environments lacking `storage.create_bucket` by adding a safe fallback, then retry the reset to confirm.
*   If you encounter the error `ERROR: policy "Profiles select" for table "profiles" already exists (SQLSTATE 42710)`, remove duplicate migrations and make the profiles policy creation idempotent, then rerun the database reset to verify migrations apply cleanly.
*   If you encounter the error `ERROR: duplicate key value violates unique constraint "schema_migrations_pkey" (SQLSTATE 23505)`, verify the legacy migration files are removed, then rerun the database reset to confirm the duplicate key error is gone.
*   If you encounter the error about missing Radix UI hover card module, install the `@radix-ui/react-hover-card` package.
*   The ReshareButton component must be added to PostItem.
*   When a "Module not found: Can't resolve '@radix-ui/react-hover-card'" error occurs, install the `@radix-ui/react-hover-card` package and restart the dev server.
*   If a "You're importing a component that needs `useState`" error occurs mark the file (or its parent) with the `"use client"` directive.
*   If an `EINVAL: invalid argument, readlink