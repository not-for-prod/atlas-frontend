const { RuleTester } = require('eslint');
const rule = require('../no-entities-upper-layer-imports');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

const ENTITIES_FILE = '/project/src/entities/contract/model/contract.ts';
const FEATURES_FILE = '/project/src/features/editor/Editor.tsx';

ruleTester.run('no-entities-upper-layer-imports', rule, {
  valid: [
    {
      name: 'Пропускает импорт из shared через алиас',
      code: "import { Button } from '~/shared/ui/Button';",
      filename: ENTITIES_FILE,
    },
    {
      name: 'Пропускает импорт из другой entity через алиас',
      code: "import { Layout } from '~/entities/layout/model/layout';",
      filename: ENTITIES_FILE,
    },
    {
      name: 'Пропускает относительный импорт внутри entities',
      code: "import { ValueType } from '../enums/value-type';",
      filename: ENTITIES_FILE,
    },
    {
      name: 'Пропускает импорт внешней библиотеки',
      code: "import React from 'react';",
      filename: ENTITIES_FILE,
    },
    {
      name: 'Пропускает файл вне entities',
      code: "import { something } from '~/app/store';",
      filename: FEATURES_FILE,
    },
    {
      name: 'Не считает modules поддерживаемым слоем проекта',
      code: "import { useModule } from '~/modules/some-module';",
      filename: ENTITIES_FILE,
    },
  ],
  invalid: [
    {
      name: 'Запрещает импорт из features через алиас',
      code: "import { Editor } from '~/features/editor/Editor';",
      filename: ENTITIES_FILE,
      errors: [{ messageId: 'forbidden', data: { layer: 'features' } }],
    },
    {
      name: 'Запрещает импорт из views через алиас',
      code: "import { Home } from '~/views/Home';",
      filename: ENTITIES_FILE,
      errors: [{ messageId: 'forbidden', data: { layer: 'views' } }],
    },
    {
      name: 'Запрещает импорт из widgets через алиас',
      code: "import { Header } from '~/widgets/Header';",
      filename: ENTITIES_FILE,
      errors: [{ messageId: 'forbidden', data: { layer: 'widgets' } }],
    },
    {
      name: 'Запрещает импорт из app через алиас',
      code: "import { store } from '~/app/store';",
      filename: ENTITIES_FILE,
      errors: [{ messageId: 'forbidden', data: { layer: 'app' } }],
    },
    {
      name: 'Запрещает динамический import() из features',
      code: "const mod = import('~/features/editor/Editor');",
      filename: ENTITIES_FILE,
      errors: [{ messageId: 'forbidden', data: { layer: 'features' } }],
    },
  ],
});
