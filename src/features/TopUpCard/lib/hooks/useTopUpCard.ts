import { Decimal } from '~/shared/lib/decimal';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useTopUp,
  getTopUpQuote,
  topUpCard,
  TopUpRequestError,
  useCurrentTopUp,
  useCard,
  useCardTariff,
  type TopUpCardRequest,
} from '~/entities/card';
import { useBalance } from '~/entities/client-asset';
import { parseAmount } from '../utils/parseAmount';
export function useTopUpCard(cardId: string) {
  const client = useQueryClient();
  const [input, setInput] = useState('');
  const [submittedId, setSubmittedId] = useState<string>();
  const [locked, setLocked] = useState(false);
  const [fresh, setFresh] = useState(false);
  const pending = useRef<TopUpCardRequest | null>(null);
  const retained = useSearchParams().get('topup');
  const current = useCurrentTopUp(cardId);
  const id = submittedId || (!fresh ? retained || current.data?.id : undefined);
  const card = useCard(cardId);
  const tariff = useCardTariff();
  const balance = useBalance(15000);
  const category = tariff.data?.categories.find((item) => item.id === card.data?.cardTypeId);
  const limits = category?.topup;
  const amount = parseAmount(input);
  const amountError =
    input && !amount
      ? 'topup.invalidAmount'
      : amount && limits?.minimalAmount !== undefined && new Decimal(amount).lt(limits.minimalAmount)
        ? 'topup.belowMinimum'
        : amount && limits?.maximumAmount !== undefined && new Decimal(amount).gt(limits.maximumAmount)
          ? 'topup.aboveMaximum'
          : undefined;
  const ready = !!category && !!balance.data && !card.isError && !tariff.isError && !balance.isError;

  const progress = useTopUp(id, cardId);
  const quote = useQuery({
    queryKey: ['card', 'topup', 'quote', cardId, amount],
    queryFn: ({ signal }) => getTopUpQuote(cardId, amount!, signal),
    enabled: !!amount && !amountError && ready && !id,
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });
  const calculation =
    quote.data && amount && !amountError && ready
      ? {
          received: quote.data.amount!.amount!,
          fee: quote.data.fee!.amount!,
          total: new Decimal(quote.data.amount!.amount!).plus(quote.data.fee!.amount!).toFixed(),
        }
      : undefined;
  const insufficient = !!calculation && new Decimal(calculation.total).gt(balance.data!.availableAmount);
  const mutation = useMutation({
    mutationFn: topUpCard,
    retry: false,
    onSuccess: (order) => {
      setSubmittedId(order.id);
      client.setQueryData(['card', 'topup', order.id], order);
      client.setQueryData(['card', 'topup', 'current', cardId], order);
      void client.invalidateQueries({ queryKey: ['payment'] });
      void client.invalidateQueries({ queryKey: ['client-asset'] });
    },
    onError: (error) => {
      if (error instanceof TopUpRequestError && (error.insufficient || error.quoteChanged)) {
        pending.current = null;
        setLocked(false);
        if (error.quoteChanged) void quote.refetch();
      }
      void current.refetch();
    },
  });
  const order = progress.data || mutation.data || (!fresh ? current.data : undefined);
  useEffect(() => {
    if (!order?.id) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('topup') === order.id) return;
    url.searchParams.set('topup', order.id);
    window.history.replaceState(window.history.state, '', url);
  }, [order?.id]);

  function submit() {
    if (mutation.isPending || id) return;
    if (!pending.current && (!calculation || insufficient || quote.isFetching || quote.isError || !amount))
      return;
    pending.current ??= {
      idempotencyKey: crypto.randomUUID(),
      cardId,
      amount: { amount: amount!, currency: 'USD' },
      expectedCommission: quote.data!.fee!.amount,
    };
    setLocked(true);
    mutation.mutate(pending.current);
  }
  return {
    input,
    setInput: (value: string) => {
      if (locked) return;
      setInput(value);
      mutation.reset();
    },
    limits,
    balance,
    calculation,
    amountError,
    insufficient,
    canSubmit:
      !mutation.isPending &&
      !id &&
      (locked || (!!calculation && !insufficient && !quote.isFetching && !quote.isError)),
    quote,
    progress,
    current,
    mutation,
    order,
    submit,
    locked,
    startNew: () => {
      pending.current = null;
      setLocked(false);
      setFresh(true);
      setSubmittedId(undefined);
      setInput('');
      mutation.reset();
      const url = new URL(window.location.href);
      url.searchParams.delete('topup');
      window.history.replaceState(window.history.state, '', url);
      void current.refetch();
    },
    loading: !order && (current.isPending || (!!id && progress.isPending)),
    unavailable: !order && (current.isError || (!!id && progress.isError)),
    constraintsLoading: !ready && (card.isPending || tariff.isPending || balance.isPending),
    constraintsError:
      card.isError ||
      tariff.isError ||
      balance.isError ||
      (!card.isPending && !tariff.isPending && !category),
    refreshConstraints: () => Promise.all([card.refetch(), tariff.refetch(), balance.refetch()]),
    refresh: id ? progress.refetch : current.refetch,
  };
}
