import { ProviderName } from './enums';

export interface ProviderCredentials {
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
}

export interface ClientConfig {
  provider: ProviderName;
  credentials: ProviderCredentials;
  timeout?: number;
  retries?: number;
}
