// 서버(NestJS) 호출을 한곳에서 처리한다. 성공하면 응답 본문을 그대로 돌려주고,
// 실패하면 서버의 { statusCode, message, error } 를 ApiError 로 바꿔 던진다.
// 서버 팀이 공통 응답 형식을 정하면 이 파일만 고친다.

/** 서버가 실패로 응답했거나 서버에 닿지 못했을 때 던진다. message 는 화면에 그대로 보여 줄 수 있다. */
export class ApiError extends Error {
  /** HTTP 상태 코드. 서버에 닿지 못했으면 0 */
  readonly status: number
  /** 검증 실패처럼 서버가 메시지를 여러 개 보낸 경우 전체 목록 */
  readonly details: string[]

  constructor(message: string, status: number, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 10_000
const FALLBACK_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'

type Body = Record<string, unknown> | FormData

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new ApiError('서버에 연결할 수 없어요. 네트워크 상태를 확인해 주세요.', 0)
  }

  const text = await response.text()
  let data: unknown = text === '' ? undefined : text
  try {
    if (text !== '') data = JSON.parse(text)
  } catch {
    // JSON 이 아닌 문자열 응답은 그대로 쓴다.
  }

  if (!response.ok) {
    const raw = (data as { message?: string | string[] } | undefined)?.message
    const details = Array.isArray(raw) ? raw : raw ? [raw] : []
    throw new ApiError(details[0] ?? FALLBACK_MESSAGE, response.status, details)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Body) => request<T>('POST', path, body),
  put: <T>(path: string, body?: Body) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: Body) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}
