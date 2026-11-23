export const FLAVOR_POLL_IMAGE_BUCKET = 'flavor-poll-images';
export const MAX_FLAVOR_POLL_IMAGE_BYTES = 4 * 1024 * 1024;

export type FlavorPollOptionDetails = {
  description: string;
  imageUrl: string;
};

export function getFlavorPollOptionDetails(
  details: unknown,
  label: string
): FlavorPollOptionDetails {
  const value =
    details && typeof details === 'object' && Object.hasOwn(details, label)
      ? (details as Record<string, Partial<FlavorPollOptionDetails>>)[label]
      : undefined;
  return {
    description: typeof value?.description === 'string' ? value.description : '',
    imageUrl: typeof value?.imageUrl === 'string' ? value.imageUrl : '',
  };
}
