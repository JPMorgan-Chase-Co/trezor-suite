import { formatNetworkAmount, formatAmount } from '@wallet-utils/accountUtils';
import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { ComposeTransactionData, ReviewTransactionData, SignedTx } from '@wallet-types/transaction';
import { GetState, Dispatch } from '@suite-types';
import * as accountActions from '@wallet-actions/accountActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as transactionBitcoinActions from './transactionBitcoinActions';
import * as transactionEthereumActions from './transactionEthereumActions';
import * as transactionRippleActions from './transactionRippleActions';
import * as modalActions from '@suite-actions/modalActions';

export const composeTransaction = (composeTransactionData: ComposeTransactionData) => async (
    dispatch: Dispatch,
) => {
    const {
        account: { networkType },
    } = composeTransactionData;

    if (networkType === 'bitcoin') {
        return dispatch(transactionBitcoinActions.composeTransaction(composeTransactionData));
    }

    if (networkType === 'ethereum') {
        return dispatch(transactionEthereumActions.composeTransaction(composeTransactionData));
    }

    if (networkType === 'ripple') {
        return dispatch(transactionRippleActions.composeTransaction(composeTransactionData));
    }
};

export const cancelSignTx = (signedTx: SignedTx) => (dispatch: Dispatch) => {
    if (!signedTx) {
        TrezorConnect.cancel('tx-cancelled');
        return;
    }
    // otherwise just close modal
    dispatch(modalActions.onCancel());
};

export const pushTransaction = (reviewData: ReviewTransactionData) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    const { device } = getState().suite;
    const { signedTx, transactionInfo } = reviewData;

    if (!signedTx || !transactionInfo || !account) return false;

    const sentTx = await TrezorConnect.pushTransaction(signedTx);
    // const sentTx = { success: true, payload: { txid: 'ABC ' } };
    // close modal regardless result
    dispatch(cancelSignTx(signedTx));

    const { token } = transactionInfo;
    const spentWithoutFee = !token
        ? new BigNumber(transactionInfo.totalSpent).minus(transactionInfo.fee).toString()
        : '0';
    // get total amount without fee OR token amount
    const formattedAmount = token
        ? `${formatAmount(
              transactionInfo.totalSpent,
              token.decimals,
          )} ${token.symbol!.toUpperCase()}`
        : formatNetworkAmount(spentWithoutFee, account.symbol, true);

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );

        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }

    return sentTx.success;
};
