# DeckPool

**DeckPool** is a personal English One Piece Card Game deckbuilder that helps you manage your card collection and build competitive decks.

## What is DeckPool?

DeckPool is designed for One Piece Card Game players who want to:

1. **Track your owned cards** – Log every card in your binder with accurate counts
2. **Build decks from your collection** – Create 50-card lists that default to cards you actually own
3. **Manage deck variations** – Store multiple builds for each Leader (e.g., "Main" and "Anti-yellow")
4. **Track what you need** – Maintain a "Wanted" board of cards you're shopping for
5. **Share with friends** – Add friends to browse their decks and collection, or copy their lists
6. **Check legality** – Automatically verify that your decks meet Standard format rules

### Key Features

- **Collection Management**: Log and organize all your owned cards
- **Deck Builder**: Visual deck building with smart filters and legal/owned status checking
- **Variations**: Store multiple builds per Leader without creating separate decks
- **Wanted Board**: Track extra copies you need to buy
- **Friends System**: Connect with other players to share decks and collections
- **Legal Status**: Automatic validation against Standard format rules (color identity, copy limits, banned cards)
- **Card Search**: Powerful filtering by color, cost, type, keywords, and more
- **Share Links**: Generate public links to share your deck builds

## What DeckPool Is Not

DeckPool is focused on collection and deck management. It does **not**:
- Scan physical cards
- Track card prices
- Host a public deck gallery
- Simulate games or track match history
- Support other languages (English cards only)

These features may be added in the future (see `DECKPOOL_FUTURE_FEATURES.md`).

## Tech Stack

- **Framework**: Next.js 16.3.1 (App Router)
- **UI**: React 19, TypeScript, Tailwind CSS 4
- **Authentication**: Firebase Auth (email/password)
- **Database**: Cloud Firestore
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js (latest LTS recommended)
- npm
- A Firebase project with Firestore and Auth enabled

### Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

### Available Commands

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm test` – Run unit tests
- `npm run lint` – Run ESLint
- `firebase deploy --only firestore:rules` – Deploy Firestore security rules

## Documentation

For detailed information about the codebase, see:

- **[DECKPOOL_CODEBASE.md](./DECKPOOL_CODEBASE.md)** – Complete as-built documentation of routes, data model, and behavior
- **[DECKPOOL_V1_BLUEPRINT.md](./DECKPOOL_V1_BLUEPRINT.md)** – Original product specifications and rules
- **[DECKPOOL_FUTURE_FEATURES.md](./DECKPOOL_FUTURE_FEATURES.md)** – Planned features for future releases
- **[DECKPOOL_FRIENDS.md](./DECKPOOL_FRIENDS.md)** – Friends feature design and testing checklist

## License

This project is for personal use.

## Contributing

This is a personal project. If you have suggestions or find bugs, please open an issue.
