/**
 * Centralized pricing config. Used by setup-fee controller and exposed via GET /api/v1/setup-fee/config.
 * Change these values to update Idea Starter setup fee and investor setup fee across the app.
 */
export const IDEA_STARTER_SETUP_FEE_USD = 7;
export const INVESTOR_SETUP_FEE_USD = 10;

export interface PricingConfig {
  ideaStarterSetupFeeUsd: number;
  investorSetupFeeUsd: number;
}

export function getPricingConfig(): PricingConfig {
  return {
    ideaStarterSetupFeeUsd: IDEA_STARTER_SETUP_FEE_USD,
    investorSetupFeeUsd: INVESTOR_SETUP_FEE_USD,
  };
}
