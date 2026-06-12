import Constants from 'expo-constants';

import { DEFAULT_SYNC_ENDPOINT } from '../constants/app';

function isExpoTunnelHost(host: string) {
  return host.includes('exp.direct') || host.includes('ngrok') || host.includes('expo.dev');
}

export function getDefaultSyncEndpoint() {
  const configuredEndpoint = process.env.EXPO_PUBLIC_SYNC_ENDPOINT;
  if (configuredEndpoint) {
    return configuredEndpoint;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : null;
  if (!host || host === 'localhost' || host === '127.0.0.1' || isExpoTunnelHost(host)) {
    return DEFAULT_SYNC_ENDPOINT;
  }

  return `http://${host}:4100`;
}

export function isInvalidMobileSyncEndpoint(endpoint: string) {
  return isExpoTunnelHost(endpoint) || endpoint.includes('localhost:4100') || endpoint.includes('127.0.0.1:4100');
}
