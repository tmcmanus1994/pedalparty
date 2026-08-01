/**
 * The gallery photos, in the order they run.
 *
 * Generated from the `Slide *.jpeg` originals at the repo root: scaled to a
 * uniform 900px tall and re-encoded as WebP.
 *
 * Widths vary a lot — these run from 0.54 to 1.33 in aspect — because the
 * frames are built to fit each photo rather than crop it. The strip runs at a
 * fixed height and every tile is as wide as its own picture needs.
 * `width`/`height` are the real dimensions, so the browser reserves the right
 * box before the image loads and the marquee measures correctly on the first
 * frame.
 */

export type GalleryPhoto = { src: string; alt: string; width: number; height: number };

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: "/gallery/ride-01.webp", width: 546, height: 900, alt: "Three riders standing arm in arm beside a bike on a sunny street" },
  { src: "/gallery/ride-02.webp", width: 599, height: 900, alt: "A rider up out of the saddle with one arm raised, mid-celebration" },
  { src: "/gallery/ride-03.webp", width: 1200, height: 900, alt: "Four riders in helmets crowded into a selfie on the Junction Bridge" },
  { src: "/gallery/ride-05.webp", width: 786, height: 900, alt: "A group gathered with their bikes on a street corner at sunset" },
  { src: "/gallery/ride-06.webp", width: 644, height: 900, alt: "Two riders side by side, one on a mint-green cruiser with a wicker basket" },
  { src: "/gallery/ride-07.webp", width: 937, height: 900, alt: "Three riders with arms around each other, the pack gathering behind them" },
  { src: "/gallery/ride-08.webp", width: 743, height: 900, alt: "A large group posing with their bikes under a concrete overpass" },
  { src: "/gallery/ride-09.webp", width: 702, height: 900, alt: "Five riders lined up on a grassy rise in the evening light" },
  { src: "/gallery/ride-10.webp", width: 487, height: 900, alt: "Two riders in bright floral shirts standing with their bikes" },
  { src: "/gallery/ride-11.webp", width: 554, height: 900, alt: "Three riders and their bikes on a sidewalk beside a brick wall" },
  { src: "/gallery/ride-12.webp", width: 1134, height: 900, alt: "A family of five, kids included, standing with bikes by the water" },
  { src: "/gallery/ride-13.webp", width: 575, height: 900, alt: "Two riders in loud printed shirts holding their bikes on the grass" },
  { src: "/gallery/ride-15.webp", width: 491, height: 900, alt: "Four riders posing around a bike, long shadows at golden hour" },
  { src: "/gallery/ride-16.webp", width: 518, height: 900, alt: "Two riders standing with a red bike and a green bike on the street" },
  { src: "/gallery/ride-17.webp", width: 510, height: 900, alt: "Two riders smiling beside a bike, the crowd and more bikes behind" },
  { src: "/gallery/ride-18.webp", width: 538, height: 900, alt: "Two kids in helmets grinning at the camera as riders gather behind them" },
  { src: "/gallery/ride-19.webp", width: 800, height: 900, alt: "Four riders among a row of parked bikes in a lot at sunset" },
  { src: "/gallery/ride-20.webp", width: 536, height: 900, alt: "Two riders standing behind their bikes on a street at dusk" },
  { src: "/gallery/ride-21.webp", width: 540, height: 900, alt: "Two riders with their bikes on a residential street at sunset" },
  { src: "/gallery/ride-22.webp", width: 505, height: 900, alt: "Two riders with their bikes on a paved path beside a park" },
];
