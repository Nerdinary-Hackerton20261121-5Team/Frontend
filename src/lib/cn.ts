import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge 는 우리 글자 토큰(text-body-m-medium)을 몰라서 글자색으로 보고 text-text-primary 와 합쳐 버린다.
// typography.css 의 글자 토큰 이름을 알려 줘서 글자 크기와 글자색이 따로 남게 한다.
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
});

/** cva 로 만든 기본 클래스 뒤에 바깥에서 넘긴 className 을 덮어쓴다 */
export const cn = (...classes: (string | undefined | null | false)[]) =>
  twMerge(classes.filter(Boolean).join(' '));
