export const GUEST_IMAGE_LIMIT = 4;

// Processing quota (usageCount on User / GuestUsage) — per subscription plan.
export const PLAN_PROCESSING_LIMITS = {
  none: 0,
  starter: 10,
  premium: 20,
  enterprise: 30,
};

// Storage quota (how many Image documents a user/guest may keep) — separate
// from processing quota on purpose.
export const PLAN_STORAGE_LIMITS = {
  none: 0,
  starter: 10,
  premium: 20,
  enterprise: 30,
};

export const GUEST_STORAGE_LIMIT = 4;
