// 서버(NestJS) 호출을 한곳에서 처리한다. 서버는 { success, code, message, data } 로 응답한다.
// 성공하면 data 만 꺼내 돌려주고, 실패하면 message 와 code 를 ApiError 로 바꿔 던진다.
// 서버의 공통 응답 형식이 바뀌면 이 파일만 고친다.

/** 서버가 실패로 응답했거나 서버에 닿지 못했을 때 던진다. message 는 화면에 그대로 보여 줄 수 있다. */
export class ApiError extends Error {
  /** HTTP 상태 코드. 서버에 닿지 못했으면 0 */
  readonly status: number
  /** 검증 실패처럼 서버가 메시지를 여러 개 보낸 경우 전체 목록 */
  readonly details: string[]
  /** 서버가 보낸 에러 코드. 예: NOT_FOUND, INVALID_INPUT. 서버에 닿지 못했으면 없다 */
  readonly code: string | undefined

  constructor(message: string, status: number, details: string[] = [], code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.code = code
  }
}

/** 서버의 공통 응답 형식 */
type Envelope = { success: boolean; code?: string; message?: string | string[]; data: unknown }

// /api/health 처럼 공통 형식을 쓰지 않는 응답도 있어서 모양을 보고 가린다.
const isEnvelope = (value: unknown): value is Envelope =>
  typeof value === 'object' &&
  value !== null &&
  'data' in value &&
  typeof (value as Envelope).success === 'boolean'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 10_000
const FALLBACK_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'

type Body = Record<string, unknown> | FormData
/** 요청에 덧붙일 헤더. 참가자 토큰처럼 요청마다 다른 값을 넣을 때 쓴다 */
type Headers = Record<string, string>

async function request<T>(
  method: string,
  path: string,
  body?: Body,
  headers?: Headers,
): Promise<T> {
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: { ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}), ...headers },
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

  const envelope = isEnvelope(data) ? data : undefined

  if (!response.ok || envelope?.success === false) {
    const raw = (data as { message?: string | string[] } | undefined)?.message
    const details = Array.isArray(raw) ? raw : raw ? [raw] : []
    throw new ApiError(details[0] ?? FALLBACK_MESSAGE, response.status, details, envelope?.code)
  }
  return (envelope ? envelope.data : data) as T
}

export const api = {
  get: <T>(path: string, headers?: Headers) => request<T>('GET', path, undefined, headers),
  post: <T>(path: string, body?: Body, headers?: Headers) =>
    request<T>('POST', path, body, headers),
  put: <T>(path: string, body?: Body, headers?: Headers) => request<T>('PUT', path, body, headers),
  patch: <T>(path: string, body?: Body, headers?: Headers) =>
    request<T>('PATCH', path, body, headers),
  delete: <T = void>(path: string, headers?: Headers) =>
    request<T>('DELETE', path, undefined, headers),
}
