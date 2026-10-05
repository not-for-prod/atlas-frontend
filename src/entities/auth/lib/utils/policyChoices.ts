import { type MethodSelection, type PolicyRequirement } from '../../model';
export function policyChoices(node?: PolicyRequirement, scope = ''): MethodSelection[] {
  if (!node) return [];
  const requirementId = node.id || scope;
  if (node.method) return [{ requirementId, methodId: node.method, providerId: node.provider || '' }];
  return [...(node.any || []), ...(node.all || [])].flatMap((child) => policyChoices(child, requirementId));
}
export function supportedChoice(choice: MethodSelection): boolean {
  return (
    Boolean(choice.requirementId) &&
    ((choice.methodId === 'email_code' && !choice.providerId) ||
      (choice.methodId === 'oauth' &&
        ['google', 'yandex', 'mailru', 'telegram'].includes(choice.providerId || '')))
  );
}
export function choiceKey(choice: MethodSelection): string {
  return `${choice.requirementId}:${choice.methodId}:${choice.providerId || ''}`;
}
