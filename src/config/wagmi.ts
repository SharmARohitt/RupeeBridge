'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RupeeBridge',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains: [arbitrum, arbitrumSepolia],
  ssr: true,
});

export const CONTRACTS = {
  [arbitrum.id]: {
    arbINR: '0x0000000000000000000000000000000000000000', // Will be updated after deployment
    custodianMock: '0x0000000000000000000000000000000000000000',
    rewards: '0x0000000000000000000000000000000000000000'
  },
  [arbitrumSepolia.id]: {
    arbINR: '0x0000000000000000000000000000000000000000', // Will be updated after deployment
    custodianMock: '0x0000000000000000000000000000000000000000',
    rewards: '0x0000000000000000000000000000000000000000'
  }
};
