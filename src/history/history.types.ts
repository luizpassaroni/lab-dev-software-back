export type HistoryTitleType = 'MOVIE' | 'TV';

export type HistoryTitleRef = {
  tmdbId: number;
  tmdbType: HistoryTitleType;
};

export type WatchedOrigem = 'auto' | 'manual';

export function historyWhere(userId: number, title: HistoryTitleRef) {
  return {
    userId_tmdbId_tmdbType: {
      userId,
      tmdbId: title.tmdbId,
      tmdbType: title.tmdbType,
    },
  };
}
