import assert from 'node:assert/strict';
import { evaluateSlideLayoutFit } from '../utils/slide-layout-fit.ts';

const heroFits = evaluateSlideLayoutFit({
  template: 'HERO',
  contentTemplate: 'HERO',
  imageLayout: 'IMAGE_NONE',
  blocks: [
    { type: 'TITLE', content: 'Segurança no trabalho' },
    { type: 'PARAGRAPH', content: 'Instrumentos confiáveis ajudam a medir melhor.' },
    { type: 'CTA', content: 'Salvar conteúdo' },
  ],
});

assert.equal(heroFits.status, 'fits');
assert.equal(heroFits.imageLayoutId, 'IMAGE_NONE');
assert.equal(heroFits.contentTemplateId, 'HERO');

const denseSplit = evaluateSlideLayoutFit({
  template: 'CHECKLIST',
  contentTemplate: 'CHECKLIST',
  imageLayout: 'IMAGE_SPLIT_BOTTOM',
  blocks: [
    { type: 'TITLE', content: 'Checklist técnico completo para instalação segura e leitura precisa em qualquer cenário de campo' },
    { type: 'PARAGRAPH', content: 'Esse é um bloco de apoio longo, com bastante texto, para forçar a validação de encaixe quando metade do slide é ocupada pela imagem.' },
    { type: 'LIST', content: [
      'Verifique alimentação, tensão e corrente antes do primeiro uso',
      'Confirme aterramento, continuidade e integridade dos cabos',
      'Registre medições iniciais e compare com a especificação esperada',
      'Faça inspeção visual dos conectores e do isolamento em toda a extensão',
      'Repita a checagem após o equipamento atingir temperatura de operação',
      'Valide as leituras finais com o procedimento recomendado pelo fabricante',
    ] },
    { type: 'CTA', content: 'Falar com especialista' },
  ],
});

assert.ok(['fits_shrunk', 'overflow', 'impossible'].includes(denseSplit.status));
assert.equal(denseSplit.imageLayoutId, 'IMAGE_SPLIT_BOTTOM');
assert.equal(denseSplit.contentTemplateId, 'CHECKLIST');
assert.ok(denseSplit.message.length > 0);

console.log('slide-layout-fit.test.ts passed');
