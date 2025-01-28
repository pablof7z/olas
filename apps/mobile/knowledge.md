# Performance Optimizations

## Reactions and Feed Performance

The app uses a global reactions store to track reactions, comments, and zaps for posts. This approach:
- Reduces redundant subscriptions and queries
- Centralizes reaction data management
- Improves performance by avoiding per-component observers
- Allows components to directly access reaction stats without additional queries

The store is hydrated by the Feed component's monitor and can be accessed using useReactionsStore.

Example usage:
```typescript
const stats = useReactionsStore(state => state.getStats(eventId));
console.log(stats.reactionCount, stats.comments);
```
