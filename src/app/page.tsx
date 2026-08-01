import About from "@/components/About";
import Contact from "@/components/Contact";
import Faq from "@/components/Faq";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import NextRide from "@/components/NextRide";
import RideSmart from "@/components/RideSmart";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Ticker from "@/components/Ticker";
import { faq, site } from "@/lib/content";
import { getRide } from "@/lib/getRide";

/** The ride store drives the Next Ride state, so re-render at most every 5 minutes. */
export const revalidate = 300;

export default async function Home() {
  const ride = await getRide();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    description: site.description,
    email: site.email,
    areaServed: site.city,
    sameAs: [site.instagram, site.facebook],
  };

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Ticker />
        <NextRide ride={ride} />
        <About />
        <Faq />
        <RideSmart />
        <Gallery />
        <Contact />
      </main>
      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, faqJsonLd]) }}
      />
    </>
  );
}
