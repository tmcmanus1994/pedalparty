/**
 * All site copy lives here, VERBATIM from the design handoff.
 * Do not rewrite, "improve", or paraphrase any string in this file.
 */

export const site = {
  name: "Pedal Party",
  email: "pedalpartylr@gmail.com",
  instagram: "https://www.instagram.com/pedalparty_lr",
  instagramHandle: "@pedalparty_lr",
  facebook: "https://www.facebook.com/PedalPartyLR",
  facebookHandle: "/PedalPartyLR",
  city: "Little Rock, AR",
  description:
    "Little Rock's raddest, chillest, most epic, least hyperbolic Monday SOCIAL RIDE. Every Monday, April Fools' to Halloween.",
} as const;

export const nav = [
  { label: "Next Ride", href: "#next-ride" },
  { label: "About Us", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Safety", href: "#safety" },
  { label: "Gallery", href: "#gallery" },
  { label: "Say Hi", href: "#contact" },
] as const;

export const hero = {
  badge: "★ EVERY MONDAY · APR–OCT ★",
  title: "Pedal Party",
  subtitleLead: "Little Rock's raddest, chillest, most epic, least hyperbolic Monday",
  subtitleEmphasis: "SOCIAL RIDE.",
  primaryCta: "NEXT RIDE",
  secondaryCta: "LEARN MORE",
} as const;

export const tickerPhrases = [
  "ALL BIKES WELCOME",
  "ALL HUMANS WELCOME",
  "BUILD COMMUNITY",
  "SUPPORT LOCAL",
  "EXPLORE OUR CITY",
  "TREATS & DRINKS",
  "GET ACTIVE",
  "POSITIVE VIBES",
] as const;

export const nextRideSection = {
  heading: "Next Ride",
  sub: "The plan drops right here (and on our socials) every Saturday at noon.",
} as const;

export const about = {
  heading: "It's just like riding a bike.",
  paragraphs: [
    "Pedal Party is an inclusive, family-friendly bicycle crawl rolling through Little Rock every Monday, April Fools' to Halloween. Each week we explore different restaurants, parks, and hidden gems around downtown, Argenta, Hillcrest, and beyond.",
    "The plan drops on social media every Saturday morning. We gather at 6:00 PM Monday and roll out at 6:30. Along the way you'll see every kind of bike, hear great music, and ride with people of all ages — we've had riders from age 4 to 104. Babies in trailers and pups in baskets are regulars.",
    "The pace is chill: about 9 miles per hour, around 5 miles total, never far from the start. Big hill? We wait at the top. We hang at the midpoint for about 45 minutes, then cruise back. Need to dip early? Hakuna matata — do your thing.",
    "Pedal Party started in 2022 when three buddies wanted an excuse to casually ride bikes and show Little Rock a little more cycling love. We've grown from 15 riders at our very first ride to a record 185 at our 100th. We're endlessly grateful for this community and how much Little Rock has embraced it.",
  ],
  closerLead: "If this sounds like your vibe — ",
  closerLink: "come ride with us",
  closerTail: ".",
} as const;

export const stats = [
  { value: "2022", label: "ROLLING SINCE" },
  { value: "15 → 246", label: "FIRST RIDE → RECORD RIDE" },
  { value: "4–104", label: "RIDER AGES" },
  { value: "9 mph", label: "AVERAGE SPEED" },
  { value: "5 mi", label: "AVERAGE DISTANCE" },
  { value: "45 min", label: "AVERAGE MIDPOINT HANGOUT" },
] as const;

export const tagline = [
  { text: "Have Fun.", tone: "coral" },
  { text: "Ride Safe.", tone: "lime" },
  { text: "Make Friends.", tone: "pink" },
] as const;

export const faq = {
  heading: "Good Questions",
  sub: "The plan drops right here (and on our socials) every Saturday at noon.",
  /**
   * ⚠️ Questions are verbatim. ANSWERS ARE PLACEHOLDERS — the Framer HTML export
   * only captured the closed accordion state. Replace every `answer` below with
   * the real text from the Framer CMS before launch (handoff §4 / §8 item 1).
   */
  items: [
    {
      q: "When and where do you meet?",
      a: "PLACEHOLDER — pull verbatim from Framer. We gather at 6:00 PM every Monday and roll out at 6:30. The starting location changes week to week and is announced right here and on our socials every Saturday at noon.",
    },
    {
      q: "Do I need a fancy bike?",
      a: "PLACEHOLDER — pull verbatim from Framer. Nope. Any bike that rolls is the right bike. Cruisers, mountain bikes, road bikes, e-bikes, kids' bikes, and the occasional unicycle all show up. Just give your tires and brakes a quick check before you come.",
    },
    {
      q: "How fast and how far do you ride?",
      a: "PLACEHOLDER — pull verbatim from Framer. The pace is chill — about 9 miles per hour over roughly 5 miles total, and we're never far from the start. If there's a big hill, we wait at the top for everyone.",
    },
    {
      q: "May I bring my kids? My dog?",
      a: "PLACEHOLDER — pull verbatim from Framer. Absolutely. We've had riders from age 4 to 104, and babies in trailers and pups in baskets are regulars. Helmets are strongly encouraged for kids.",
    },
    {
      q: "What if I can't stay the whole time?",
      a: "PLACEHOLDER — pull verbatim from Framer. Totally fine. Hakuna matata — do your thing. Peel off whenever you need to; just let someone near you know so we're not looking for you.",
    },
    {
      q: "Does it cost anything?",
      a: "PLACEHOLDER — pull verbatim from Framer. The ride is free. You'll want a few bucks for food and drinks at the stops, since supporting local spots is a big part of the point.",
    },
    {
      q: "What happens if the weather's bad?",
      a: "PLACEHOLDER — pull verbatim from Framer. Safety first — if it's storming we'll call it off and post the update right here and on our socials. Light rain usually means we still roll.",
    },
    {
      q: "I'm new and nervous. Is this for me?",
      a: "PLACEHOLDER — pull verbatim from Framer. Yes. Most people show up for their first ride not knowing anybody. Come find a volunteer at the start, say hi, and you'll have people to ride with in about five minutes.",
    },
  ],
} as const;

export const rideSmart = {
  heading: "Ride Smart",
  sub: "Chill pace, real streets. Here's how we all get home grinning.",
  doTitle: "DO",
  dos: [
    "Wear a helmet — encouraged for everyone, strongly for kids",
    "Bring lights (rides end around sunset)",
    "Bring water, especially in summer",
    "Follow the leader and stay with the group",
    'Call out hazards for riders behind you ("hole!", "car back!")',
    "Check your tires and brakes before you roll",
    "Talk to strangers — that's the whole point",
  ],
  dontTitle: "DON'T",
  donts: [
    "Don't blow through intersections — we ride legal and predictable",
    "Don't ride ahead of the ride leader",
    "Don't overdo it at the stops — know your limits, ride home safe",
    "Don't leave anyone behind — if someone's struggling, flag a volunteer",
  ],
  footnote:
    "Volunteers with tools ride along to help with flats and minor mechanicals. We'll do our best to help you within reason.",
} as const;

export const gallery = {
  headingLead: "Proof it's as fun as it ",
  headingAccent: "looks",
  sub: "Snapshots from the pack. Tag us and we'll add yours",
} as const;

export const contact = {
  headingLead: "Say hi ",
  headingEmoji: "👋",
  sub: "Questions, theme ideas, sponsor talk, or just want in the loop?",
  fields: {
    name: { label: "Name", placeholder: "Your name" },
    email: { label: "Email", placeholder: "your@example.com" },
    message: { label: "Message", placeholder: "Hey Pedal Party..." },
  },
  submit: "Send it 🚲",
  /**
   * ⚠️ PLACEHOLDER success/error microcopy — Travelle to write the final strings
   * (handoff §8 item 4). Do not ship these as-is.
   */
  successPlaceholder: "Sent! 🎉",
  errorPlaceholder: "That didn't send. Try again, or email us directly.",
} as const;

export const footer = {
  line: "Pedal Party · Little Rock, AR · Every Monday, April Fools' to Halloween.",
} as const;
