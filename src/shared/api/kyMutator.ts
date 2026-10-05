import { type KyInstance, type Options } from 'ky';
import { buildQueryPairs } from '../lib/buildQueryPairs';
import { request } from './request';

export type ErrorType<Error> = Error;
export type BodyType<BodyData> = BodyData;

type CustomInstanceOptions = RequestInit & {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, unknown>;
  data?: unknown;
  context?: Options['context'];
  responseType?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'formData';
  signal?: AbortSignal | null;
};

const createKyMutator =
  (requestInstance: KyInstance) =>
  async <Data>(url: string, options: CustomInstanceOptions): Promise<Data> => {
    const normalizedUrl = `/${url.replace(/^\/+/, '')}`;

    const kyOptions: Options = {
      method: options.method,
      searchParams: buildQueryPairs(options.params),
      headers: options.headers,
      body: options.body,
      json: options.body === undefined ? options.data : undefined,
      context: options.context,
      signal: options.signal,
    };

    const response = await requestInstance(normalizedUrl, kyOptions);

    if (options.responseType === 'text') {
      return (await response.text()) as Data;
    }

    if (options.responseType === 'blob') {
      return (await response.blob()) as Data;
    }

    if (options.responseType === 'arrayBuffer') {
      return (await response.arrayBuffer()) as Data;
    }

    if (options.responseType === 'formData') {
      return (await response.formData()) as Data;
    }

    const responseText = await response.text();

    if (!responseText) {
      return undefined as Data;
    }

    return JSON.parse(responseText) as Data;
  };

const executeRequestMutator = createKyMutator(request);

export async function kyMutator<Data>(url: string, options: CustomInstanceOptions): Promise<Data> {
  return executeRequestMutator<Data>(url, options);
}
