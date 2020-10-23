import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';
import { SignedTx } from '@wallet-types/transaction';
import * as notificationActions from '@suite-actions/notificationActions';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import { COINMARKET_BUY, COINMARKET_EXCHANGE, COINMARKET_COMMON } from './constants';
import { Dispatch, GetState } from '@suite-types';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Account } from '@wallet-types';

export type CoinmarketCommonActions =
    | { type: typeof COINMARKET_COMMON.SAVE_SIGNED_TX; signedTx: SignedTx }
    | {
          type: typeof COINMARKET_COMMON.SAVE_TRANSACTION_INFO;
          transactionInfo: PrecomposedTransactionFinal;
      };

export const verifyAddress = (account: Account, inExchange = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device || !account) return;
    const { path, address } = getUnusedAddressFromAccount(account);
    if (!path || !address) return;

    const { networkType, symbol } = account;
    const { useEmptyPassphrase, connected, available } = device;

    const modalPayload = {
        device,
        address,
        networkType,
        symbol,
        addressPath: path,
    };

    // Show warning when device is not connected
    if (!connected || !available) {
        dispatch(
            modalActions.openModal({
                type: 'unverified-address',
                ...modalPayload,
            }),
        );
        return;
    }

    const params = {
        device,
        path,
        useEmptyPassphrase,
    };

    // catch button request and open modal
    const buttonRequestHandler = (event: ButtonRequestMessage['payload']) => {
        if (!event || event.code !== 'ButtonRequest_Address') return;
        dispatch(
            modalActions.openModal({
                type: 'address',
                ...modalPayload,
            }),
        );
    };

    let fn;
    switch (networkType) {
        case 'ethereum':
            fn = TrezorConnect.ethereumGetAddress;
            break;
        case 'ripple':
            fn = TrezorConnect.rippleGetAddress;
            break;
        case 'bitcoin':
            fn = TrezorConnect.getAddress;
            break;
        default:
            fn = () => ({
                success: false,
                payload: { error: 'Method for getAddress not defined', code: undefined },
            });
            break;
    }

    TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);
    const response = await fn(params);
    TrezorConnect.off(UI.REQUEST_BUTTON, buttonRequestHandler);

    if (response.success) {
        dispatch({
            type: inExchange ? COINMARKET_EXCHANGE.VERIFY_ADDRESS : COINMARKET_BUY.VERIFY_ADDRESS,
            addressVerified: address,
        });
    } else {
        // special case: device no-backup permissions not granted
        if (response.payload.code === 'Method_PermissionsNotGranted') return;

        dispatch(
            notificationActions.addToast({
                type: 'verify-address-error',
                error: response.payload.error,
            }),
        );
    }
};

export const saveTransactionInfo = (transactionInfo: PrecomposedTransactionFinal) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET_COMMON.SAVE_TRANSACTION_INFO,
        transactionInfo,
    });
};

export const saveSignedTx = (signedTx: SignedTx) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_COMMON.SAVE_SIGNED_TX,
        signedTx,
    });
};
