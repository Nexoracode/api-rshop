export const makeCacheKey = {
    search: (term: string, limit: number) =>
        `smart-search:${term.toLowerCase().trim()}:${limit}`,
    stats: (term: string) => `search-stats:${term.toLowerCase().trim()}`,
};
