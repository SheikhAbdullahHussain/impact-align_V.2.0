export interface SdgDto {
    id: string;
    number: number;
    code: string;
    title: string | null;
    description: string | null;
    officialUrl: string | null;
  }

  export interface SdgTargetDto {
    id: string;
    sdgId: string;
    code: string;
    title: string | null;
    description: string | null;
    officialUrl: string | null;
  }

  export interface SdgIndicatorDto {
    id: string;
    sdgId: string;
    targetId: string | null;
    code: string;
    title: string | null;
    description: string | null;
    officialUrl: string | null;
  }