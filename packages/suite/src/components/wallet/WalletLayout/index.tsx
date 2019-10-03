import React from 'react';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import { variables } from '@trezor/components';
import WalletNotifications from '@wallet-components/Notifications';
import Content from '@wallet-components/Content';
import Sidebar from './components/Sidebar';
import ProgressBar from './components/ProgressBar';
import { AppState } from '@suite-types';

const { SCREEN_SIZE } = variables;

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
    wallet: state.wallet,
});

type Props = {
    topNavigationComponent?: React.ReactNode;
    children?: React.ReactNode;
    isTransaction?: boolean;
} & ReturnType<typeof mapStateToProps>;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 1170px;
    flex-direction: row;
    flex: 1 1 0%;
`;

const ContentWrapper = styled.div<{ preventBgScroll?: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        ${props =>
            props.preventBgScroll &&
            css`
                position: fixed;
                width: 100%;
                min-height: calc(100vh - 52px);
            `}
    }
`;

const WalletLayout = (props: Props) => {
    return (
        <Wrapper>
            <ProgressBar />
            <Sidebar isOpen={props.suite.showSidebar} />
            <ContentWrapper preventBgScroll={props.suite.showSidebar}>
                {props.topNavigationComponent}
                <WalletNotifications />
                <Content isTransaction={props.isTransaction}>{props.children}</Content>
            </ContentWrapper>
        </Wrapper>
    );
};

export default connect(mapStateToProps)(WalletLayout);