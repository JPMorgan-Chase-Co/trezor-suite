export const oauthUrls = [
    'https://accounts.google.com',
    'https://www.dropbox.com/oauth2/authorize',
];

export const allowedExternalUrls = [
    // SatoshiLabs
    'https://trezor.io/support',
    'https://wiki.trezor.io',
    'https://blog.trezor.io',
    // External Services
    'https://github.com/trezor/',
    'https://satoshilabs.typeform.com',
];

export const cspRules = [
    // Default to only own resources
    "default-src 'self'",
    // Allow all API calls (Can't be restricted bc of custom backends)
    'connect-src *',
    // Allow images from medium.com and trezor.io domains (news)
    "img-src 'self' *.medium.com *.trezor.io",
];
