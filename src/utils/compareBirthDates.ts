import type { PublicPerson } from "@/server/person/types";

export const compareBirthDates = (
  left: PublicPerson["birthDate"],
  right: PublicPerson["birthDate"],
) => {
  if (!left) return right ? -1 : 0;
  if (!right) return 1;
  return left.year - right.year;
};
