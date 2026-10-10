import { type AtlasCardV1CardTariffCategory, type AtlasCardV1CardFee } from '~/generated/atlas/model';
export type CardPalette = NonNullable<AtlasCardV1CardTariffCategory['palette']>;
export type CardFee = AtlasCardV1CardFee;
export type CardCategory = Required<
  Pick<AtlasCardV1CardTariffCategory, 'description' | 'fees' | 'requiresKyc'>
> &
  Pick<AtlasCardV1CardTariffCategory, 'topup' | 'name' | 'palette'> & { id: string };
