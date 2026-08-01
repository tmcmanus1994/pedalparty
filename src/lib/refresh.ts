import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Drop the cached homepage so a just-published ride is live now rather than
 * within the 5-minute window.
 *
 * Both /admin's publish action and the public /api/revalidate endpoint go
 * through here, so an in-app publish and an external webhook can never drift
 * into purging different things.
 */
export function refreshSite(): void {
  revalidateTag("ride");
  revalidatePath("/");
}
