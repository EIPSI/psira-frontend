const FORMAT_VERSION = 'v3';
const SENSITIVE_ROUTE_KEYS = [
  'password',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'passwordExpiresAt',
  'passwordChangeRequired',
];

export function encryptRouteObject(value: any, secret: string): string {
  return encryptRoutePayload(JSON.stringify(removeSensitiveRouteKeys(value)), secret);
}

export function encryptRoutePayload(value: string, secret: string): string {
  return [FORMAT_VERSION, encodeBase64Url(value)].join(':');
}

export function decryptRoutePayload(value: string, secret: string): string {
  if (!value?.startsWith(`${FORMAT_VERSION}:`)) {
    return '';
  }

  const [, encodedPayload] = value.split(':');
  return decodeBase64Url(encodedPayload || '');
}

function encodeBase64Url(value: string): string {
  const encoded = window.btoa(unescape(encodeURIComponent(value || '')));
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const encoded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=');
  return decodeURIComponent(escape(window.atob(padded)));
}

function removeSensitiveRouteKeys(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => removeSensitiveRouteKeys(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value).reduce((sanitized, key) => {
    if (!SENSITIVE_ROUTE_KEYS.includes(key)) {
      sanitized[key] = removeSensitiveRouteKeys(value[key]);
    }
    return sanitized;
  }, {});
}
