import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';

/**
 * Filtro defensivo para evitar erros de CORS ao acessar stylesheets externos
 */
const styleSheetFilter = (styleSheet: CSSStyleSheet) => {
  try {
    const rules = styleSheet.cssRules;
    return true;
  } catch (err) {
    console.warn('Ignorando folha de estilo protegida (CORS):', styleSheet.href);
    return false;
  }
};

/**
 * Captures the element as a JPEG data URL and returns it.
 */
export const captureJpeg = async (element: HTMLElement): Promise<string> => {
  return await toJpeg(element, {
    quality: 0.95,
    pixelRatio: 1, // High resolution for Instagram
    cacheBust: true,
    styleSheetFilter: styleSheetFilter,
  });
};

/**
 * Bundles multiple images and an optional project JSON into a ZIP file.
 */
export const downloadZip = async (
  images: { name: string; dataUrl: string }[], 
  zipName: string = 'carousel-export.zip',
  projectData?: string
) => {
  const zip = new JSZip();
  
  images.forEach((img) => {
    // Extract base64 part from DataURL
    const base64Data = img.dataUrl.split(',')[1];
    zip.file(img.name, base64Data, { base64: true });
  });

  if (projectData) {
    zip.file('project-config.json', projectData);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = zipName;
  link.click();
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
};

/**
 * Legacy single-file export (optional use)
 */
export const exportAsJpeg = async (element: HTMLElement, fileName: string = 'slide.jpg') => {
  try {
    const dataUrl = await captureJpeg(element);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export image', err);
    alert('Export failed. Check console for details.');
  }
};