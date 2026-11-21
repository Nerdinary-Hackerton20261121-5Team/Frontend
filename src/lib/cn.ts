import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// 글자 토큰(text-body-m-medium)과 색 토큰(text-text-primary)이 모두 text- 로 시작한다.
// 글자 토큰을 알려 주지 않으면 twMerge 가 둘을 같은 종류로 보고 하나를 지운다.
// src/styles/typography.css 에 토큰을 더하면 여기에도 더한다.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'title-l',
            'title-m',
            'body-l-bold',
            'body-l-medium',
            'body-l-regular',
            'body-m-bold',
            'body-m-medium',
            'body-m-regular',
            'caption-medium',
            'caption-regular',
          ],
        },
      ],
    },
  },
});

/** 조건에 따라 클래스를 합치고, 겹치는 Tailwind 클래스는 뒤의 것만 남긴다. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
