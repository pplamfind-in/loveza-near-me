const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

export function isActivitySlug(value: string): boolean {
  return value.length <= 80 && slugPattern.test(value) && !uuidPattern.test(value);
}
