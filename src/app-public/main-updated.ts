import i18next from 'i18next';
import { PDFDocument } from 'pdf-lib';
import { generateInvoice, generatePDFUPO, i18nReady } from '../lib-public';
import { AdditionalDataTypes } from '@lib-public/types/common.types';

const inputInvoice: HTMLInputElement = document.getElementById('xmlInput') as HTMLInputElement;
const inputUPO: HTMLInputElement = document.getElementById('xmlInputUPO') as HTMLInputElement;
const nrKSeFInput: HTMLInputElement = document.getElementById('nrKSeFInput') as HTMLInputElement;
const qrCodeInput: HTMLInputElement = document.getElementById('qrCodeInput') as HTMLInputElement;
const nrKSeFError: HTMLElement = document.getElementById('nrKSeFError') as HTMLElement;
const qrCodeError: HTMLElement = document.getElementById('qrCodeError') as HTMLElement;
const xmlInputError: HTMLElement = document.getElementById('xmlInputError') as HTMLElement;
const xmlInputUPOError: HTMLElement = document.getElementById('xmlInputUPOError') as HTMLElement;
const generateInvoiceBtn: HTMLButtonElement = document.getElementById(
  'generateInvoiceBtn'
) as HTMLButtonElement;
const generateUpoBtn: HTMLButtonElement = document.getElementById('generateUpoBtn') as HTMLButtonElement;
const langSelect: HTMLSelectElement = document.getElementById('langSelect') as HTMLSelectElement;
const doubleInvoiceCheckbox: HTMLInputElement = document.getElementById(
  'doubleInvoiceCheckbox'
) as HTMLInputElement;

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function setFieldError(input: HTMLInputElement, errorElement: HTMLElement, message: string): boolean {
  errorElement.textContent = message;
  input.classList.toggle('invalid', Boolean(message));
  return !message;
}

function validateNrKSeF(): boolean {
  const nrKSeF: string = nrKSeFInput.value.trim();

  let message = '';

  if (!nrKSeF) {
    message = i18next.t('ui.nrKSeFRequired');
  }

  return setFieldError(nrKSeFInput, nrKSeFError, message);
}

function validateQrCode(): boolean {
  const qrCode: string = qrCodeInput.value.trim();

  let message = '';

  if (!qrCode) {
    message = i18next.t('ui.qrCodeRequired');
  } else if (!isValidUrl(qrCode)) {
    message = i18next.t('ui.qrCodeInvalid');
  }

  return setFieldError(qrCodeInput, qrCodeError, message);
}

function validateInputs(): boolean {
  const nrKSeFValid: boolean = validateNrKSeF();
  const qrCodeValid: boolean = validateQrCode();

  return nrKSeFValid && qrCodeValid;
}

nrKSeFInput.addEventListener('input', validateNrKSeF);
qrCodeInput.addEventListener('input', validateQrCode);

function applyTranslations(): void {
  document.documentElement.lang = i18next.language;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element: HTMLElement): void => {
    const key: string | undefined = element.dataset.i18n;

    if (key) {
      element.textContent = i18next.t(`ui.${key}`);
    }
  });
}

i18nReady.then((): void => {
  langSelect.value = i18next.language;
  applyTranslations();
});

langSelect.addEventListener('change', async (): Promise<void> => {
  await i18next.changeLanguage(langSelect.value);
  applyTranslations();
});

async function mergePdfBlobs(blobs: Blob[]): Promise<Blob> {
  const merged: PDFDocument = await PDFDocument.create();

  for (const blob of blobs) {
    const source: PDFDocument = await PDFDocument.load(await blob.arrayBuffer());
    const pages = await merged.copyPages(source, source.getPageIndices());

    pages.forEach((page) => merged.addPage(page));
  }

  return new Blob([Uint8Array.from(await merged.save())], { type: 'application/pdf' });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url: string = URL.createObjectURL(blob);

  const a: HTMLAnchorElement = document.createElement('a');

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

generateInvoiceBtn.addEventListener('click', async (): Promise<void> => {
  const file: File | undefined = inputInvoice.files?.[0];
  const fileValid: boolean = setFieldError(
    inputInvoice,
    xmlInputError,
    file ? '' : i18next.t('ui.selectFileError')
  );
  const inputsValid: boolean = validateInputs();

  if (!fileValid || !file || !inputsValid) {
    return;
  }

  const additionalData: AdditionalDataTypes = {
    nrKSeF: nrKSeFInput.value,
    qrCode: qrCodeInput.value,
  };

  if (doubleInvoiceCheckbox.checked) {
    const currentLang: string = i18next.language;
    const blobs: Blob[] = [];

    for (const lang of ['pl', 'en']) {
      await i18next.changeLanguage(lang);
      blobs.push(await generateInvoice(file, additionalData, 'blob'));
    }

    await i18next.changeLanguage(currentLang);
    applyTranslations();

    downloadBlob(await mergePdfBlobs(blobs), nrKSeFInput.value + '.pdf');
    return;
  }

  const data: Blob = await generateInvoice(file, additionalData, 'blob');

  downloadBlob(data, nrKSeFInput.value + '.pdf');
});

generateUpoBtn.addEventListener('click', async (): Promise<void> => {
  const file: File | undefined = inputUPO.files?.[0];
  const fileValid: boolean = setFieldError(
    inputUPO,
    xmlInputUPOError,
    file ? '' : i18next.t('ui.selectFileError')
  );

  if (!fileValid || !file) {
    return;
  }

  const blob: Blob = await generatePDFUPO(file);

  downloadBlob(blob, 'test.pdf');
});
