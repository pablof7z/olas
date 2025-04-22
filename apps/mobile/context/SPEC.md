<!--
  context/SPEC.md
  Product specification and stakeholder overview
-->
# Product Specification (Olas Mobile App)

## 1. Purpose & Vision
Olas Mobile is a decentralized social networking application built on the Nostr protocol, designed to:
- Deliver a real-time, permissionless feed of user-generated content.
- Enable seamless microtransactions (zaps) via Lightning Network and Cashu integration.
- Provide rich media sharing (text, images, video, ephemeral stories) and community interactions.

## 2. Target Audience & Stakeholders
- **End Users**: Nostr enthusiasts, content creators, Lightning Network users.
- **Community Maintainers**: Nostr relay operators, open-source contributors.
- **Business / Monetization**: Lightning service providers, sponsorship partners.

## 3. Core Features
1. **Global Feed**: Discover content by users and hashtags, with customizable feed types (For You, Following, Communities).
2. **Content Creation**: Publish text, media posts, short videos, and ephemeral stories with rich metadata (location, duration, visibility).
3. **Reactions & Engagement**: Commenting, reacting (likes, emojis), reposting, bookmarking, and zapping.
4. **Communities**: Create and join group channels, post to group feeds, and moderate community content.
5. **Wallet Integration**: Onboard and manage Lightning wallets (NWC) and Cashu tokens, mint & spend in-app.
6. **Search & Discover**: Search by hashtag, user, or content type, with saved-search functionality.
7. **Notifications**: Real-time notifications for mentions, reactions, follows, and zaps.
8. **Settings & Onboarding**: User profile management, blacklist/whitelist, advanced Nostr and relay settings.

## 4. User Journeys
- **Onboarding**: Sign up via public key, import wallet seed, configure relays.
- **Browsing**: Switch feed types, search hashtag, scroll infinite feed, view trending communities.
- **Publishing**: Open composer, add media/stickers, set visibility, publish to Nostr relays.
- **Engaging**: Tap to react or comment, send zaps, view conversation threads in bottom sheets.
- **Wallet Flow**: Enable wallet, mint Cashu tokens, send/receive payments.

## 5. Success Metrics & KPIs
- Daily Active Users (DAU) and Session Length
- Volume of Zaps and Payment Transactions
- Number of Posts, Comments, Reactions per Day
- Community Growth (channels created, members)
- Onboarding Completion Rate (wallet & profile setup)

## 6. Technical Requirements
- **Availability**: Leverage multiple public Nostr relays, handle relay failures gracefully.
- **Performance**: Paginated feed, media compression, debounce expensive renders.
- **Security & Privacy**: End-to-end visibility controls, secure storage of keys (Expo SecureStore).
- **Offline Support**: Cache recent feed and drafts, provide fallback UI.

## 7. Roadmap & Future Enhancements
- Unified direct messaging (DM) interface
- Advanced content moderation tools for communities
- Multi-account management
- Enhanced federation with other decentralized protocols
- Plugin ecosystem for custom Nostr event types