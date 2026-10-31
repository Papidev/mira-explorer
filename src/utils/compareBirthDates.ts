import type { PublicPerson } from "@/server/person/types";

export const compareBirthDates = (
  left: PublicPerson["birthDate"],
  right: PublicPerson["birthDate"],
) => {
  if (!left) return right ? -1 : 0;
  if (!right) return 1;
  return (
    left.year - right.year ||
    (left.month ?? 1) - (right.month ?? 1) ||
    (left.day ?? 1) - (right.day ?? 1)
  );
};
