import { Decimal, isDecimalAmount } from '~/shared/lib/decimal';
import { backendOrigin } from '~/shared/api/backendOrigin';
import {
  AtlasCardV1CardTopUpStatus,
  AtlasCardV1CardTopUpStage,
  AtlasCardV1CardTopUpStepStatus,
  type AtlasCardV1CardTopUp,
  type AtlasCardV1VirtualCardServiceTopUpCardBody,
  type AtlasCardV1GetTopUpQuoteResponse,
} from '~/generated/atlas/model';
import { CardRequestError } from './cardsApi';
export type CardTopUp = AtlasCardV1CardTopUp;
export type TopUpCardRequest = AtlasCardV1VirtualCardServiceTopUpCardBody & { cardId: string };
export type TopUpQuote = AtlasCardV1GetTopUpQuoteResponse;
export class TopUpRequestError extends CardRequestError {
  constructor(
    status: number,
    public insufficient = false,
    public quoteChanged = false,
  ) {
    super(status);
  }
}
export function isTopUpTerminal(order: CardTopUp) {
  return [
    'CARD_TOP_UP_STATUS_COMPLETED',
    'CARD_TOP_UP_STATUS_FAILED',
    'CARD_TOP_UP_STATUS_REJECTED',
  ].includes(order.status || '');
}
function isMoney(money: CardTopUp['amount']) {
  return !!money && money.currency === 'USD' && isDecimalAmount(money.amount);
}
async function request(path: string, signal?: AbortSignal, body?: unknown) {
  const response = await fetch(`${backendOrigin()}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(15000), ...(signal ? [signal] : [])]),
    ...(body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new TopUpRequestError(
      response.status,
      response.status === 412 && /insufficient/i.test(text),
      response.status === 412 && /tariff changed/i.test(text),
    );
  }
  const data = await response.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new CardRequestError(503);
  return data;
}
function parseOrder(data: { topUp?: CardTopUp }, cardId?: string): CardTopUp {
  const order = data.topUp;
  const stages = Object.values(AtlasCardV1CardTopUpStage).filter(
    (stage) => stage !== 'CARD_TOP_UP_STAGE_UNSPECIFIED',
  );
  if (
    !order ||
    typeof order.id !== 'string' ||
    !order.id ||
    typeof order.cardId !== 'string' ||
    !order.cardId ||
    (cardId && order.cardId !== cardId) ||
    !order.status ||
    order.status === 'CARD_TOP_UP_STATUS_UNSPECIFIED' ||
    !Object.values(AtlasCardV1CardTopUpStatus).includes(order.status) ||
    !order.stage ||
    !Object.values(AtlasCardV1CardTopUpStage).includes(order.stage) ||
    order.stage === 'CARD_TOP_UP_STAGE_UNSPECIFIED' ||
    !isMoney(order.amount) ||
    new Decimal(order.amount!.amount!).eq('0') ||
    !isMoney(order.fee) ||
    !Array.isArray(order.steps) ||
    order.steps.length !== 3 ||
    order.steps.some(
      (step, index) =>
        step.stage !== stages[index] ||
        !step.status ||
        step.status === 'CARD_TOP_UP_STEP_STATUS_UNSPECIFIED' ||
        !Object.values(AtlasCardV1CardTopUpStepStatus).includes(step.status) ||
        (step.completedAt != null &&
          (typeof step.completedAt !== 'string' || !Number.isFinite(Date.parse(step.completedAt)))),
    )
  )
    throw new CardRequestError(503);
  return order;
}
export async function getCurrentTopUp(cardId: string, signal?: AbortSignal) {
  const data = await request(`/v1/cards/${encodeURIComponent(cardId)}/top-ups/current`, signal);
  return data.topUp ? parseOrder(data, cardId) : null;
}
export async function getTopUp(id: string, cardId: string, signal?: AbortSignal) {
  const order = parseOrder(await request(`/v1/card-top-ups/${encodeURIComponent(id)}`, signal), cardId);
  if (order.id !== id) throw new CardRequestError(503);
  return order;
}
export async function topUpCard(body: TopUpCardRequest) {
  return parseOrder(
    await request(`/v1/cards/${encodeURIComponent(body.cardId!)}/top-ups`, undefined, body),
    body.cardId,
  );
}
export async function getTopUpQuote(
  cardId: string,
  amount: string,
  signal?: AbortSignal,
): Promise<TopUpQuote> {
  const data: TopUpQuote = await request(`/v1/cards/${encodeURIComponent(cardId)}/top-ups/quote`, signal, {
    amount: { amount, currency: 'USD' },
  });
  if (!isMoney(data.amount) || data.amount?.amount !== amount || !isMoney(data.fee))
    throw new CardRequestError(503);
  return data;
}
