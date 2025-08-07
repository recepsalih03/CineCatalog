export interface Movie {
  id?: string;
  title: string;
  year: number;
  director: string;
  hardDrive: string;
  videoQuality: string;
  audioQuality: string;
  hasSubtitles: boolean;
  watched?: boolean;
  movieLink?: string;
  directorLink?: string;
  posterUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MovieFormData {
  title: string;
  year: string;
  director: string;
  hardDrive: string;
  videoQuality: string;
  audioQuality: string;
  hasSubtitles: boolean;
  watched?: boolean;
  movieLink: string;
  directorLink: string;
}

export interface MovieFilters {
  search?: string;
  hardDrive?: string;
  year?: number;
  hasSubtitles?: boolean;
}