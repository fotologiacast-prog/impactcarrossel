import assert from 'node:assert/strict';
import {
  PROTOTYPE_TEMPLATE_LAB_CATALOG,
  PROTOTYPE_TEMPLATE_LAB_FAMILIES,
} from '../utils/prototype-template-lab.ts';

assert.equal(PROTOTYPE_TEMPLATE_LAB_FAMILIES.length, 4);
assert.deepEqual(PROTOTYPE_TEMPLATE_LAB_FAMILIES, ['LIST', 'BOX', 'IMAGE', 'TEXT']);

assert.equal(PROTOTYPE_TEMPLATE_LAB_CATALOG.length, 12);

const groupedCounts = PROTOTYPE_TEMPLATE_LAB_CATALOG.reduce<Record<string, number>>(
  (acc, template) => {
    acc[template.family] = (acc[template.family] ?? 0) + 1;
    return acc;
  },
  {},
);

assert.equal(groupedCounts.LIST, 3);
assert.equal(groupedCounts.BOX, 3);
assert.equal(groupedCounts.IMAGE, 3);
assert.equal(groupedCounts.TEXT, 3);

for (const template of PROTOTYPE_TEMPLATE_LAB_CATALOG) {
  assert.ok(template.id.length > 0);
  assert.ok(template.name.length > 0);
  assert.ok(template.areas.length > 0);

  for (const area of template.areas) {
    assert.ok(area.position.x >= 0 && area.position.x <= 100, `${template.id}:${area.id} x`);
    assert.ok(area.position.y >= 0 && area.position.y <= 100, `${template.id}:${area.id} y`);
    assert.ok(area.position.w > 0 && area.position.w <= 100, `${template.id}:${area.id} w`);
    assert.ok(area.position.h > 0 && area.position.h <= 100, `${template.id}:${area.id} h`);
    assert.ok(area.position.x + area.position.w <= 100, `${template.id}:${area.id} x+w`);
    assert.ok(area.position.y + area.position.h <= 100, `${template.id}:${area.id} y+h`);
  }
}

console.log('prototype-template-lab.test.ts passed');
