import assert from 'node:assert/strict';
import {
  extractTokens,
  normalizeForSearch,
  resolveIcon,
  resolveIconsForList,
  resolveIconsWithContext,
  simpleStem,
} from '../utils/icon-resolver.ts';

assert.equal(normalizeForSearch('Preço, Conversão e Tráfego!'), 'preco conversao e trafego');
assert.deepEqual(
  extractTokens('Redes sociais e SEO'),
  ['redes sociais', 'sociais seo', 'redes', 'sociais', 'seo'],
);
assert.equal(simpleStem('automatizar'), 'automatiz');

assert.equal(resolveIcon('Aumente suas vendas online', 'emoji'), '🛒');
assert.equal(resolveIcon('Automatize processos repetitivos', 'lucide'), 'Bot');
assert.equal(resolveIcon('Estratégias de marketing para SEO', 'lucide'), 'Megaphone');
assert.equal(resolveIcon('Consulta médica de rotina', 'lucide'), 'ClipboardPlus');
assert.equal(resolveIcon('Implante dentário com planejamento digital', 'emoji'), '🦷');
assert.equal(resolveIcon('Biosegurança no consultório odontológico', 'lucide'), 'ShieldPlus');

const repeatedSales = resolveIconsForList([
  { title: 'Vender mais' },
  { title: 'Aumentar vendas' },
  { title: 'Melhorar conversão de vendas' },
], 'emoji');

assert.equal(repeatedSales.length, 3);
assert.equal(new Set(repeatedSales).size >= 2, true);

const contextual = resolveIconsWithContext([
  { title: 'Defina seu ICP ideal' },
  { title: 'Refine a proposta' },
], 'Estratégias de marketing', 'lucide');

assert.equal(contextual.length, 2);
assert.equal(contextual[0] !== 'CircleDot', true);

const dentalFlow = resolveIconsForList([
  { title: 'Agendamento da consulta' },
  { title: 'Confirmação do paciente' },
  { title: 'Pós-operatório do implante' },
], 'lucide');

assert.equal(dentalFlow.length, 3);
assert.equal(dentalFlow.every((icon) => icon !== 'CircleDot'), true);
assert.equal(new Set(dentalFlow).size >= 2, true);

const healthcareContext = resolveIconsWithContext([
  { title: 'Captação local' },
  { title: 'Prova social' },
  { title: 'Retenção no pós-consulta' },
], 'Marketing para clínicas odontológicas', 'emoji');

assert.equal(healthcareContext.length, 3);
assert.equal(healthcareContext.some((icon) => icon !== '📌'), true);

console.log('icon-resolver.test.ts passed');
