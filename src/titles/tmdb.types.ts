export interface TmdbMultiSearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string; // movie
  name?: string; // tv / person
  release_date?: string; // movie
  first_air_date?: string; // tv
  poster_path?: string | null;
}

export interface TmdbMultiSearchResponse {
  page: number;
  results: TmdbMultiSearchResult[];
  total_pages: number;
  total_results: number;
}
