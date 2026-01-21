import QRCode from 'qrcode';

/**
 * Generate a QR code PNG buffer for the given URL.
 * Returns a Node.js Buffer containing the image data.
 */
export async function generateQRCode(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
