import "server-only";

type UserLike = {
  role: "PARTNER" | "STAFF";
};

export function canManageFinance(user: UserLike) {
  return user.role === "PARTNER";
}

export function canManagePartnerTransactions(user: UserLike) {
  return user.role === "PARTNER";
}

export function canManageUsers(user: UserLike) {
  return user.role === "PARTNER";
}

