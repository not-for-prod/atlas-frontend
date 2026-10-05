import { Button, createTheme, Modal, Paper, TextInput } from '@mantine/core';
export const theme = createTheme({
  fontFamily: 'Onest, sans-serif',
  primaryColor: 'lime',
  primaryShade: 5,
  colors: {
    lime: [
      '#f9fde8',
      '#f0fac8',
      '#e7f7a3',
      '#def47c',
      '#d4f253',
      '#cbf31a',
      '#b1d811',
      '#8cae09',
      '#647d04',
      '#3c4c00',
    ],
  },
  defaultRadius: 'lg',
  radius: { sm: '8px', md: '16px', lg: '22px', xl: '28px' },
  headings: { fontFamily: 'Onest, sans-serif', fontWeight: '800' },
  components: {
    Button: Button.extend({ defaultProps: { radius: 'xl', size: 'md', autoContrast: true } }),
    Paper: Paper.extend({ defaultProps: { radius: 'xl', p: 'md' } }),
    TextInput: TextInput.extend({ defaultProps: { size: 'md', radius: 'md' } }),
    Modal: Modal.extend({ defaultProps: { radius: 'xl', centered: true, padding: 'lg' } }),
  },
});
