import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// 직접 만든 글자 토큰(src/styles/typography.css)을 알려 줘야 text-title-l 과 text-text-primary 를 둘 다 남긴다.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
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
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
