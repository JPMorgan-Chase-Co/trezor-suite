import { getPrefixedURL } from '@suite-utils/router';
import { METADATA } from '@suite-actions/constants';
import { Deferred, createDeferred } from '@suite-utils/deferred';
import { urlHashParams, urlSearchParams } from '@suite-utils/metadata';

/**
 * For web, use oauth_receiver.html hosted on the same origin (localhost/sldev/trezor.io)
 */
export const getOauthReceiverUrl = () => {
    if (!window.desktopApi) {
        return `${window.location.origin}${getPrefixedURL('/static/oauth/oauth_receiver.html')}`;
    }

    // for desktop
    // start oauth-receiver http service and wait for address
    return new Promise<string>((resolve, reject) => {
        const onGetServerAddress = (message: string) => {
            // todo: revoke to invoke/handle
            window.desktopApi!.off('server/address', onGetServerAddress);
            if (message) {
                return resolve(message);
            }
            return reject(new Error('no response'));
        };
        // todo: revoke to invoke/handle
        window.desktopApi!.on('server/address', onGetServerAddress);
        window.desktopApi!.send('server/request-address', '/oauth');
    });
};

/**
 * Handle extraction of authorization code from Oauth2 protocol
 */
export const extractCredentialsFromAuthorizationFlow = (url: string) => {
    const originalParams = urlHashParams(url);

    const dfd: Deferred<{ code?: string; access_token?: string }> = createDeferred();

    const onMessageWeb = (e: MessageEvent) => {
        // filter non oauth messages
        if (
            !['wallet.trezor.io', 'beta-wallet.trezor.io', window.location.origin].includes(
                e.origin,
            )
        ) {
            return;
        }

        if (typeof e.data !== 'string') return;

        console.warn('e.data', e.data);
        const params = urlSearchParams(e.data);
        console.log('params', params);

        if (originalParams.state && params.state !== originalParams.state) {
            dfd.reject(new Error('state does not match'));
        }

        if (params.code || params.access_token) {
            dfd.resolve(params);
        } else {
            dfd.reject(new Error('Cancelled'));
        }
        window.removeEventListener('message', onMessageWeb);
    };

    const { desktopApi } = window;
    if (desktopApi) {
        const onMessageDesktop = (code: string) => {
            if (code) {
                dfd.resolve({ code });
            } else {
                dfd.reject(new Error('Cancelled'));
            }
            // todo: revoke to invoke/handle
            desktopApi.off('oauth/code', onMessageDesktop);
        };
        // todo: revoke to invoke/handle
        desktopApi.on('oauth/code', onMessageDesktop);
    } else {
        window.addEventListener('message', onMessageWeb);
    }

    window.open(url, METADATA.AUTH_WINDOW_TITLE, METADATA.AUTH_WINDOW_PROPS);

    return dfd.promise;
};
