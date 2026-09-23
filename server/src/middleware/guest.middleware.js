import crypto from "crypto";

export const indentifyGuest = (req, res, next) => {
  let guestId = req.cookies.guestId;

  if (!guestId) {
    guestId = crypto.randomUUID();

    res.cookie("guestId", guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  req.guestId = guestId;

  next();
};
