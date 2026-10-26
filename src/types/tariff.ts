export interface Tariff {
  tariff_id: number;
  tariff_name: string;
  short_description: string;
  tariff_status: 'черновик' | 'опубликован' | 'удален';
  image_url: string;
  video_url: string;
  price_per_month: number;
  ram_gb: number;
  like_count: number;
}
