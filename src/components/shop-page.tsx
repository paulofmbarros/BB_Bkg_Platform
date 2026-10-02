import Image from "next/image";
import { Scissors, MapPin, Clock3, Phone, ArrowDown } from "lucide-react";
import type { PublicShop } from "@/modules/businesses/public-shop";
import { initials, money, shopTheme } from "@/lib/format";
import { trimHours, weekdays } from "@/modules/scheduling/hours";
import { localeOrEnglish, translator, weekdayNames } from "@/i18n/locales";
export function ShopPage({
  shop,
  preview = false,
}: {
  shop: PublicShop;
  preview?: boolean;
}) {
  const locale = localeOrEnglish(shop.public_locale);
  const t = translator(locale);
  return (
    <main
      className="shop-page"
      style={shopTheme(shop.accent_color)}
      lang={locale === "pt" ? "pt-PT" : "en"}
    >
      {(preview || shop.is_demo) && (
        <div className="shop-preview-bar">
          {t(preview ? "Customer page preview" : "Fictional demo shop")}{" "}
          <span>
            ·{" "}
            {preview
              ? t("Preview only")
              : shop.booking_enabled
                ? t("Demo appointments · No payments")
                : t("Online booking is not open yet")}
          </span>
        </div>
      )}
      <header className="shop-header">
        <a className="shop-logo" href="#">
          {shop.logo_path ? (
            <Image
              unoptimized
              width={46}
              height={46}
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${shop.logo_path}`}
              alt={`${shop.name} logo`}
            />
          ) : (
            <span className="shop-logo-mark">{initials(shop.name)}</span>
          )}
          <strong>{shop.name}</strong>
        </a>
        <a href="#services" className="shop-nav-link">
          {t("Our services")} <ArrowDown size={15} />
        </a>
      </header>
      <section className="shop-hero">
        <div>
          <span className="eyebrow">{t("YOUR NEIGHBOURHOOD BARBERSHOP")}</span>
          <h1>{shop.tagline}</h1>
          <p>{shop.description}</p>
          <a className="button shop-button" href="#services">
            {t("Find your next favourite cut")} <ArrowDown size={17} />
          </a>
          <span className="shop-location">
            <MapPin size={15} />
            {shop.address}
          </span>
        </div>
        <div className="shop-hero-mark">
          <div>
            <Scissors size={48} strokeWidth={1} />
            <strong>{initials(shop.name)}</strong>
            <span>{t("THE ART OF LOOKING YOURSELF.")}</span>
          </div>
          {!preview && shop.booking_enabled && (
            <a className="button shop-button" href="/book">
              {t("Book a visit")}
            </a>
          )}
        </div>
      </section>
      <section className="shop-menu" id="services">
        <div className="shop-section-heading">
          <span className="eyebrow">{t("A LITTLE TIME, WELL SPENT")}</span>
          <h2>{t("The service menu.")}</h2>
          <p>{t("Expert hands. Thoughtful details. No rush.")}</p>
        </div>
        <div className="public-services">
          {shop.services.map((s) => (
            <article key={s.id}>
              <div>
                <span className="eyebrow">{t(s.category)}</span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <span className="duration">
                  <Clock3 size={14} />
                  {s.duration_minutes} {t("minutes")}
                </span>
              </div>
              <div className="public-service-action">
                <strong>{money(s.price_minor, locale)}</strong>
                {!preview && shop.booking_enabled && (
                  <a
                    className="button secondary"
                    href={`/book?service=${s.id}`}
                  >
                    {locale === "pt" ? `Marcar ${s.name}` : `Book ${s.name}`}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="booking-notice">
          <Scissors size={20} />
          <div>
            <strong>
              {shop.booking_enabled && !preview
                ? t("A good day starts with a little time for you.")
                : t("Your customer experience.")}
            </strong>
            <p>
              {shop.is_demo
                ? t(
                    "This is a fictional shop. Demo bookings are saved locally; no payments are accepted.",
                  )
                : t("Our online appointment service is not open yet.")}
            </p>
          </div>
        </div>
      </section>
      <section className="shop-team">
        <span className="eyebrow">{t("GOOD PEOPLE. GREAT CRAFT.")}</span>
        <h2>{t("Find your barber.")}</h2>
        <div>
          {shop.staff.map((s, i) => (
            <article key={s.id}>
              <span className={`avatar large avatar-${i % 4}`}>
                {initials(s.display_name)}
              </span>
              <h3>{s.display_name}</h3>
              <span>{s.title}</span>
              <p>{s.bio}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="shop-visit">
        <div>
          <span className="eyebrow">{t("COME AS YOU ARE")}</span>
          <h2>{t("Make yourself at home.")}</h2>
          <p>
            <MapPin size={18} />
            {shop.address}
          </p>
          {shop.phone && (
            <p>
              <Phone size={18} />
              {shop.is_demo ? (
                <span>
                  {shop.phone} · {t("demo number")}
                </span>
              ) : (
                <a href={`tel:${shop.phone.replace(/\s/g, "")}`}>
                  {shop.phone}
                </a>
              )}
            </p>
          )}
        </div>
        <div>
          <h3>{t("Our regular hours")}</h3>
          {trimHours(shop.hours).map((h) => (
            <div className="week-row" key={h.weekday}>
              <span>
                {weekdayNames[locale][h.weekday] ?? weekdays[h.weekday]}
              </span>
              <strong>
                {h.enabled ? `${h.start_time} – ${h.end_time}` : t("Closed")}
              </strong>
            </div>
          ))}
          <p className="field-help">
            {shop.timezone}. {t("Breaks and special closures may apply.")}
          </p>
        </div>
      </section>
      <footer className="shop-footer">
        <strong>{shop.name}</strong>
        <span>{shop.tagline}</span>
      </footer>
    </main>
  );
}
