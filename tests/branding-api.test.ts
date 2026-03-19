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
    {
      id: 'client-2',
      name: 'Clinica Camel',
      profile_picture: null,
      instagram: 'clinicacamel',
      preferences: {
        fontPadrao: 'Merriweather',
      },
      image_settings: {
        fontDestaque: 'Oswald',
      },
    },
    {
      id: 'client-3',
      name: 'Clinica Fallback',
      profile_picture: null,
      instagram: null,
      preferences: null,
      image_settings: null,
    },
  ],
  colors: [
    { client_id: 'client-1', hex: '#111111' },
    { client_id: 'client-1', hex: '#f4f4f4' },
    { client_id: 'client-1', hex: '#0ea5e9' },
    { client_id: 'client-1', hex: '#ff8800' },
    { client_id: 'client-1', hex: '#22c55e' },
    { client_id: 'client-2', hex: '#222222' },
    { client_id: 'client-2', hex: '#eeeeee' },
    { client_id: 'client-2', hex: '#7c3aed' },
    { client_id: 'client-3', hex: '#333333' },
    { client_id: 'client-3', hex: '#fafafa' },
    { client_id: 'client-3', hex: '#ef4444' },
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
    {
      id: 'font-3',
      client_id: 'client-3',
      category: 'font',
      name: 'Lora-VariableFont_wght.ttf',
      url: 'https://cdn.example.com/lora.ttf',
      file_type: 'font/ttf',
    },
    {
      id: 'font-4',
      client_id: 'client-3',
      category: 'font',
      name: 'Dream-Avenue.otf',
      url: 'https://cdn.example.com/dream.otf',
      file_type: 'font/otf',
    },
  ],
});

assert.equal(brandingPayload.clients.length, 3);
assert.equal(brandingPayload.fonts.length, 4);
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
assert.equal(brandingPayload.clients[1].font_padrao, 'Merriweather Regular');
assert.equal(brandingPayload.clients[1].font_destaque, 'Oswald');
assert.equal(brandingPayload.clients[2].font_padrao, 'Lora-VariableFont_wght');
assert.equal(brandingPayload.clients[2].font_destaque, 'Dream-Avenue');

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
