import GuestUsage from "../models/guest.usage.model.js";

export const getGuestUsage = async (guestId) => {
  let usage = await GuestUsage.findOne({guestId});
  if (!usage) {
    usage = await GuestUsage.create({
      guestId,
      usageCount: 0,
    });
  }
  return usage;
};
