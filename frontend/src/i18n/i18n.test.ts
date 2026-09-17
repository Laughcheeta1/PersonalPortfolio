import { afterEach, describe, expect, it } from 'vitest';
import { getLanguage, onLanguageChange, resolveLanguage, setLanguage, t } from './index';
import { createChatService } from '../services';
import { landmarks } from '../world/registry';

afterEach(()=>setLanguage('en'));
describe('language selection',()=>{
  it('matches browser base locales in preference order and falls back to English',()=>{
    expect(resolveLanguage(['es-CO','en-US'])).toBe('es');
    expect(resolveLanguage(['fr-FR','es_MX'])).toBe('es');
    expect(resolveLanguage(['en-GB','es'])).toBe('en');
    expect(resolveLanguage(['ja-JP'])).toBe('en');
    expect(resolveLanguage([])).toBe('en');
  });
  it('updates subscribers without recreating application state',()=>{
    let notifications=0;const unsubscribe=onLanguageChange(()=>notifications++);
    setLanguage('es');expect(getLanguage()).toBe('es');expect(t('Jump')).toBe('Saltar');
    expect(t('Follow your guide to {title}.',{title:t(landmarks[0].title)})).toBe('Sigue a tu guía hasta Proyectos.');
    unsubscribe();setLanguage('en');expect(notifications).toBe(1);expect(t('Jump')).toBe('Jump');
  });
  it('translates authored panel copy while preserving embedded media references',()=>{
    setLanguage('es');
    expect(t('Personal projects')).toBe('Proyectos personales');
    expect(t('Changing how the world works')).toBe('Cambiando la forma en que funciona el mundo');
    expect(t('I live by two sacred phrases in my life:')).toBe('Vivo según dos frases sagradas en mi vida:');
    expect(t('YouTube player for {song}',{song:'Baile Inolvidable - Bad Bunny'})).toBe('Reproductor de YouTube de Baile Inolvidable - Bad Bunny');
    setLanguage('en');
    expect(t('Changing how the world works')).toBe('Changing how the world works');
  });
  it('preserves unknown future content and resolves translated mock destinations to stable IDs',async()=>{
    setLanguage('es');expect(t('Future custom content')).toBe('Future custom content');
    const reply=await createChatService().send('Llévame a Proyectos',[]);
    expect(reply.destination_object_id).toBe(landmarks[0].id);expect(reply.message).toContain('¡Sígueme');
  });
});
