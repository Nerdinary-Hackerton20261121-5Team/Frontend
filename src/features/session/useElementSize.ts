import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** 요소의 크기를 px 로 알려 준다. 퍼즐을 그릴 자리의 크기를 잴 때 쓴다 */
export const useElementSize = (ref: RefObject<HTMLElement | null>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};
