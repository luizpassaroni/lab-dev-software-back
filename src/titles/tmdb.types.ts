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

export interface TmdbDiscoverResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
}

export interface TmdbDiscoverResponse {
  page: number;
  results: TmdbDiscoverResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreListResponse {
  genres: TmdbGenre[];
}

export interface TmdbCastMember {
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
}

export interface TmdbTitleDetails {
  id: number;
  title?: string; // movie
  name?: string; // tv
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genres: TmdbGenre[];
  release_date?: string; // movie
  first_air_date?: string; // tv
  runtime?: number; // movie
  number_of_seasons?: number; // tv
  credits?: TmdbCredits;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

export interface TmdbWatchProvidersResponse {
  results: Record<
    string,
    {
      flatrate?: TmdbProvider[];
      rent?: TmdbProvider[];
      buy?: TmdbProvider[];
    }
  >;
}
