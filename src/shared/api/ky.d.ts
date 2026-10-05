import 'ky';

type RequestContext = Record<string, unknown> & { skipErrorNotification?: boolean };

declare global {
  interface RequestInit {
    context?: RequestContext;
  }
}
