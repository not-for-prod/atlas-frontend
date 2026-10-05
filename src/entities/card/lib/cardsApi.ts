import { isDecimalAmount } from '~/shared/lib/decimal';
import { backendOrigin } from '~/shared/api/backendOrigin';
import {
  AtlasCardV1CardStatus,
  type AtlasCardV1Card,
  type AtlasCardV1ListCardsResponse,
  type AtlasCardV1GetCardResponse,
  type AtlasCardV1CardRequisites,
} from '~/generated/atlas/model';
export type Card = AtlasCardV1Card;
export class CardRequestError extends Error {
  constructor(public status: number) {
    super('Card request unavailable');
  }
}
export async function requestCard(path: string, signal?: AbortSignal) {
  const response = await fetch(`${backendOrigin()}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(20000), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new CardRequestError(response.status);
  return response.json();
}
function isCard(value: unknown): value is Card {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const card = value as Card;
  if (
    typeof card.id !== 'string' ||
    !card.id ||
    typeof card.cardTypeId !== 'string' ||
    !card.cardTypeId ||
    typeof card.currency !== 'string' ||
    !card.currency ||
    !card.status ||
    !Object.values(AtlasCardV1CardStatus).includes(card.status) ||
    card.status === 'CARD_STATUS_UNSPECIFIED'
  )
    return false;
  if ([card.name, card.maskedNumber].some((item) => item !== undefined && typeof item !== 'string'))
    return false;
  if (
    card.balance != null &&
    (!isDecimalAmount(card.balance.amount) || card.balance.currency !== card.currency)
  )
    return false;
  return true;
}
export async function listCards(token: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ page_size: '20', page_token: token });
  const data: AtlasCardV1ListCardsResponse = await requestCard(`/v1/cards?${params}`, signal);
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    (data.cards !== undefined && (!Array.isArray(data.cards) || data.cards.some((card) => !isCard(card)))) ||
    (data.nextPageToken !== undefined && typeof data.nextPageToken !== 'string') ||
    (data.nextPageToken && (data.nextPageToken === token || !data.cards?.length))
  )
    throw new CardRequestError(503);
  return data;
}
export async function getCard(id: string, signal?: AbortSignal) {
  const data: AtlasCardV1GetCardResponse = await requestCard(`/v1/cards/${encodeURIComponent(id)}`, signal);
  if (!isCard(data?.card) || data.card.id !== id) throw new CardRequestError(503);
  return data.card;
}

// Explicit reveal reads bypass the query cache and remain local to the mounted feature.
export async function getCardRequisites(id: string, signal: AbortSignal) {
  const data: AtlasCardV1GetCardResponse = await requestCard(`/v1/cards/${encodeURIComponent(id)}`, signal);
  if (!isCard(data?.card) || data.card.id !== id) throw new CardRequestError(503);
  const requisites = data.requisites;
  if (requisites == null) return undefined;
  if (
    typeof requisites !== 'object' ||
    Array.isArray(requisites) ||
    [
      requisites.number,
      requisites.securityCode,
      requisites.expirationMonth,
      requisites.expirationYear,
      requisites.holderName,
    ].some((value) => value !== undefined && typeof value !== 'string')
  )
    throw new CardRequestError(503);
  const address = requisites.billingAddress;
  if (
    address != null &&
    (typeof address !== 'object' ||
      Array.isArray(address) ||
      [
        address.countryCode,
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.region,
        address.postalCode,
      ].some((value) => value !== undefined && typeof value !== 'string'))
  )
    throw new CardRequestError(503);
  return requisites;
}
export type CardRequisites = AtlasCardV1CardRequisites;
