import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Compared against when an email does not exist, so login timing does not reveal which emails are registered.
let dummyHash: Promise<string> | null = null;
export function getDummyHash() {
  dummyHash ??= bcrypt.hash("zayan-house-dummy-password", COST);
  return dummyHash;
}
