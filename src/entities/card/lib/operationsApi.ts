import { isDecimalAmount } from '~/shared/lib/decimal';
import {
  AtlasCardV1CardOperationType,
  AtlasCardV1CardOperationStatus,
  type AtlasCardV1CardOperation,
  type AtlasCardV1ListCardOperationsResponse,
} from '~/generated/atlas/model';
import { requestCard, CardRequestError } from './cardsApi';
export type CardOperation = AtlasCardV1CardOperation;
function isOperation(value: unknown): value is CardOperation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const operation = value as CardOperation;
  return (
    typeof operation.id === 'string' &&
    !!operation.id &&
    !!operation.type &&
    Object.values(AtlasCardV1CardOperationType).includes(operation.type) &&
    !!operation.status &&
    Object.values(AtlasCardV1CardOperationStatus).includes(operation.status) &&
    [operation.merchantName, operation.transactionTime].every(
      (value) => value == null || typeof value === 'string',
    ) &&
    [operation.amount, operation.fee, operation.settlement].every(
      (money) =>
        money == null ||
        (isDecimalAmount(money.amount) &&
          typeof money.currency === 'string' &&
          /^[A-Z][A-Z0-9]{2,11}$/.test(money.currency)),
    )
  );
}
export async function listCardOperations(id: string, token: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ page_size: '20', page_token: token });
  const data: AtlasCardV1ListCardOperationsResponse = await requestCard(
    `/v1/cards/${encodeURIComponent(id)}/operations?${params}`,
    signal,
  );
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    (data.operations != null &&
      (!Array.isArray(data.operations) || data.operations.some((operation) => !isOperation(operation)))) ||
    (data.nextPageToken != null && typeof data.nextPageToken !== 'string') ||
    (data.nextPageToken && (data.nextPageToken === token || !data.operations?.length))
  )
    throw new CardRequestError(503);
  return data;
}
