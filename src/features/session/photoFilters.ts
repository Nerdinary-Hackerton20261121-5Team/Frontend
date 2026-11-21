// 사진에 씌우는 필터. 어떤 필터인지는 퍼즐을 다 맞춘 뒤에 알려 준다.

export type PhotoFilter = {
  id: string;
  name: string;
  /** SVG feColorMatrix 의 type 과 values */
  type: 'saturate' | 'hueRotate';
  value: number;
};

export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: 'mono', name: '흑백 필름', type: 'saturate', value: 0 },
  { id: 'vivid', name: '쨍한 색', type: 'saturate', value: 2.4 },
  { id: 'shift', name: '뒤바뀐 색', type: 'hueRotate', value: 160 },
];

export const randomFilterId = () =>
  PHOTO_FILTERS[Math.floor(Math.random() * PHOTO_FILTERS.length)].id;

export const findFilter = (id: string) =>
  PHOTO_FILTERS.find((filter) => filter.id === id) ?? PHOTO_FILTERS[0];
