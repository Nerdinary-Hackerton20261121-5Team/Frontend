import { create } from 'zustand';

// 카메라 영상은 화면을 옮겨 다녀도 끊기지 않게 한곳에서 들고 있는다. 영상은 저장하거나 보내지 않는다.

export type CameraError = 'denied' | 'unavailable';

interface CameraStore {
  stream: MediaStream | null;
  error: CameraError | null;
  starting: boolean;
  /** 카메라를 켠다. 성공하면 true */
  start: () => Promise<boolean>;
  stop: () => void;
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  stream: null,
  error: null,
  starting: false,

  start: async () => {
    if (get().stream) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      set({ error: 'unavailable' });
      return false;
    }
    set({ starting: true, error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      set({ stream, starting: false });
      return true;
    } catch (cause) {
      const denied = cause instanceof DOMException && cause.name === 'NotAllowedError';
      set({ error: denied ? 'denied' : 'unavailable', starting: false });
      return false;
    }
  },

  stop: () => {
    get()
      .stream?.getTracks()
      .forEach((track) => track.stop());
    set({ stream: null });
  },
}));
