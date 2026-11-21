import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** 서버가 저장한 사진. url 은 화면에 쓸 수 있게 크기를 줄인 주소다 */
export type UploadedImage = {
  key: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl: string;
};

/** 퍼즐로 만들 사진을 서버에 올린다 */
export const useUploadPhoto = () => {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post<UploadedImage>('/api/images', form);
    },
  });
};
