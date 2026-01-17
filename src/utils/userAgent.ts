import UAParser from 'ua-parser-js';

interface ParsedAgent {
  browser: string;
  os: string;
  device: string;
}

/**
 * Parse a raw User-Agent string into browser, OS, and device type.
 */
export function parseUserAgent(uaString: string): ParsedAgent {
  const parser = new UAParser(uaString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  return {
    browser: browser.name || 'Unknown',
    os: os.name || 'Unknown',
    device: device.type || 'desktop',
  };
}
