import assert from 'node:assert/strict';
import { buildBrandingResponse, buildClientResponse } from '../utils/branding-api.ts';

const brandingPayload = buildBrandingResponse({
  clients: [
    {
      id: 'client-1',
      name: 'Impact Doctor',
      profile_picture: 'data:image/png;base64,abc',
      instagram: 'impactdoctor',
      preferences: {
        font_padrao: 'Merriweather',
      },
      image_settings: {
        font_destaque: 'Oswald',
      },
    },
  ],
  colors: [
    { client_id: 'client-1', hex: '#111111' },
    { client_id: 'client-1', hex: '#f4f4f4' },
    { client_id: 'client-1', hex: '#0ea5e9' },
    { client_id: 'client-1', hex: '#ff8800' },
    { client_id: 'client-1', hex: '#22c55e' },
  ],
  assets: [
    {
      id: 'font-1',
      category: 'font',
      name: 'Merriweather Regular.ttf',
      url: 'https://cdn.example.com/merriweather.ttf',
      file_type: 'font/ttf',
    },
    {
      id: 'font-2',
      category: 'font',
      name: 'Oswald.otf',
      url: 'https://cdn.example.com/oswald.otf',
      file_type: 'font/otf',
    },
    {
      id: 'other-1',
      category: 'image',
      name: 'hero.png',
      url: 'https://cdn.example.com/hero.png',
      file_type: 'image/png',
    },
  ],
});

assert.equal(brandingPayload.clients.length, 1);
assert.equal(brandingPayload.fonts.length, 2);
assert.equal(brandingPayload.fonts[0].family, 'Merriweather Regular');
assert.equal(brandingPayload.fonts[1].family, 'Oswald');
assert.equal(brandingPayload.clients[0].font_padrao, 'Merriweather Regular');
assert.equal(brandingPayload.clients[0].font_destaque, 'Oswald');
assert.equal(brandingPayload.clients[0].profile_picture, 'data:image/png;base64,abc');
assert.equal(brandingPayload.clients[0].instagram, 'impactdoctor');
assert.equal(brandingPayload.clients[0].defaults.text, '#F5F3EE');
assert.deepEqual(
  brandingPayload.clients[0].colors.slice(0, 5),
  ['#111111', '#f4f4f4', '#0ea5e9', '#ff8800', '#22c55e'],
);

const clientResponse = buildClientResponse({
  id: 'client-2',
  name: 'Clinica A',
  profile_picture: 'https://cdn.example.com/profile.jpg',
  instagram: null,
});

assert.deepEqual(clientResponse, {
  id: 'client-2',
  name: 'Clinica A',
  profile_picture: 'https://cdn.example.com/profile.jpg',
  instagram: null,
});

console.log('branding-api.test.ts passed');
