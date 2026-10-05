import { AtlasKycV1PassportIssuingCountry } from '~/generated/atlas/model';
export type PassportCountry = AtlasKycV1PassportIssuingCountry;
export function getPassportCountries(locale: string) {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  return Object.values(AtlasKycV1PassportIssuingCountry)
    .map((value) => ({ value, label: names.of(value) ?? value }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}
