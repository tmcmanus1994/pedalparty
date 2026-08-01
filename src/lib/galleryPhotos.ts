/**
 * The gallery photos, in the order they run.
 *
 * Generated from the `Slide *.webp|jpg` originals at the repo root: black
 * letterbox bars trimmed off the phone screen-grabs, everything scaled to a
 * uniform 900px tall and re-encoded as WebP. 12 MB of originals became 1.8 MB.
 *
 * Widths vary because the frames are built to fit each photo rather than crop
 * it — the strip runs at a fixed height and every tile is as wide as its own
 * picture needs. `width`/`height` are the real dimensions, so the browser
 * reserves the right box before the image loads and the marquee measures
 * correctly on the first frame.
 *
 * To add a photo: drop it in /public/gallery and add a line here.
 */

export type GalleryPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: "/gallery/ride-01.webp", width: 420, height: 900, alt: "Three riders posing together with a bike on a tree-lined street" },
  { src: "/gallery/ride-02.webp", width: 420, height: 900, alt: "A rider popping a wheelie on a quiet residential street" },
  { src: "/gallery/ride-03.webp", width: 1200, height: 900, alt: "Four riders in helmets crowded into a selfie on the Junction Bridge" },
  { src: "/gallery/ride-04.webp", width: 420, height: 900, alt: "The pack rolling down a downtown Little Rock street" },
  { src: "/gallery/ride-05.webp", width: 420, height: 900, alt: "Riders and bikes gathered at a corner under an evening sky" },
  { src: "/gallery/ride-06.webp", width: 507, height: 900, alt: "Two riders with a mint-green cruiser outside a shop" },
  { src: "/gallery/ride-07.webp", width: 675, height: 900, alt: "Three riders posing together at a stop, bikes behind them" },
  { src: "/gallery/ride-08.webp", width: 420, height: 900, alt: "A group of riders with their bikes outside a building" },
  { src: "/gallery/ride-09.webp", width: 420, height: 900, alt: "A group posing together in a gravel lot at dusk" },
  { src: "/gallery/ride-10.webp", width: 420, height: 900, alt: "Two riders in patterned shirts straddling their bikes at golden hour" },
  { src: "/gallery/ride-11.webp", width: 420, height: 900, alt: "Riders gathered beside a building, bikes leaning together" },
  { src: "/gallery/ride-12.webp", width: 1927, height: 900, alt: "A group in bright shirts posing by the water with their bikes" },
  { src: "/gallery/ride-13.webp", width: 420, height: 900, alt: "Two riders in matching floral jerseys with their bikes on the grass" },
  { src: "/gallery/ride-14.webp", width: 420, height: 900, alt: "Three riders in floral jerseys by the river at sunset" },
  { src: "/gallery/ride-15.webp", width: 420, height: 900, alt: "A group of riders posing with their bikes in front of a brick building" },
  { src: "/gallery/ride-16.webp", width: 420, height: 900, alt: "Two riders standing with their bikes on a sidewalk" },
  { src: "/gallery/ride-17.webp", width: 420, height: 900, alt: "Riders chatting beside their bikes at a stop" },
  { src: "/gallery/ride-18.webp", width: 507, height: 900, alt: "Two kids in helmets standing together on the riverside path" },
  { src: "/gallery/ride-19.webp", width: 675, height: 900, alt: "Riders gathered in a parking lot at sunset" },
  { src: "/gallery/ride-20.webp", width: 507, height: 900, alt: "Two riders with their bikes on a street at dusk" },
  { src: "/gallery/ride-21.webp", width: 507, height: 900, alt: "Two riders posing with their bikes at dusk" },
  { src: "/gallery/ride-22.webp", width: 420, height: 900, alt: "Two riders with their bikes on a grassy path at golden hour" },
];
