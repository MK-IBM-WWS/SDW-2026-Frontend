export interface NativeTariff {
 tariff_id: number; tariff_name: string; short_description: string;
 price_per_month: number; ram_gb: number; image_url: string; like_count?: number;
}
export interface CatalogPage { data: NativeTariff[]; total: number }
export interface RankedTariff extends NativeTariff { score: number; cosine: number }
