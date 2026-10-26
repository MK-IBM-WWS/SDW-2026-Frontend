import type { Tariff } from '../types/tariff';

// Единственный источник данных карточек. Все URL ведут в public/ этого SPA.
// Пустые поля специально оставлены для проверки стандартных изображения и видео.
export const TARIFFS_MOCK: readonly Tariff[] = [
  {
    tariff_id: 1,
    tariff_name: 'AWS EC2 Medium',
    short_description: 'Новый тариф для небольших веб-проектов и учебных серверов.',
    tariff_status: 'опубликован',
    image_url: '/media/aws_ec2_medium.jpg',
    video_url: '/media/aws_ec2_medium.mp4',
    price_per_month: 400,
    ram_gb: 4,
    like_count: 2,
  },
  {
    tariff_id: 2,
    tariff_name: 'Yandex Cloud Pro',
    short_description: 'Виртуальная машина для постоянно работающего сайта с резервом оперативной памяти.',
    tariff_status: 'опубликован',
    image_url: '',
    video_url: '',
    price_per_month: 600,
    ram_gb: 8,
    like_count: 1,
  },
  {
    tariff_id: 3,
    tariff_name: 'Azure AI Medium',
    short_description: 'Конфигурация для ресурсоёмкого API, аналитики и прикладных задач машинного обучения.',
    tariff_status: 'опубликован',
    image_url: '/media/azure_ai_medium.jpg',
    video_url: '',
    price_per_month: 12000,
    ram_gb: 32,
    like_count: 1,
  },
  {
    tariff_id: 4,
    tariff_name: 'Google AI Max',
    short_description: 'Высокопроизводительный облачный экземпляр для интенсивных вычислений и больших нагрузок.',
    tariff_status: 'опубликован',
    image_url: '/media/google_ai_max.jpg',
    video_url: '',
    price_per_month: 40000,
    ram_gb: 128,
    like_count: 1,
  },
  {
    tariff_id: 5,
    tariff_name: 'Selectel Start',
    short_description: '',
    tariff_status: 'черновик',
    image_url: '',
    video_url: '',
    price_per_month: 0,
    ram_gb: 0,
    like_count: 0,
  },
  {
    tariff_id: 6,
    tariff_name: 'Legacy Hosting',
    short_description: 'Архивный тариф, исключённый из публикации.',
    tariff_status: 'удален',
    image_url: '',
    video_url: '',
    price_per_month: 500,
    ram_gb: 1,
    like_count: 0,
  },
];

export function getPublishedTariffs(): Tariff[] {
  return TARIFFS_MOCK.filter((tariff) => tariff.tariff_status === 'опубликован');
}
