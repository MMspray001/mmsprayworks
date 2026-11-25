const FIELDS = ["rating", "userRatingCount", "reviews", "googleMapsUri"].join(",");

export default async () => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) {
    return json({ error: "Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID" }, 500, false);
  }
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en-GB`,
      { headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS } }
    );
    if (!res.ok) {
      console.error("Places API error", res.status, await res.text());
      return json({ error: "Upstream error" }, 502, false);
    }
    const place = await res.json();
    const reviews = (place.reviews || [])
      .map((r) => ({
        author: r.authorAttribution?.displayName || "Google user",
        authorUrl: r.authorAttribution?.uri || null,
        photo: r.authorAttribution?.photoUri || null,
        rating: r.rating ?? 5,
        text: r.originalText?.text || r.text?.text || "",
        published: r.publishTime || null,
        relative: r.relativePublishTimeDescription || "",
      }))
      .sort((a, b) => (b.published || "").localeCompare(a.published || ""));
    return json({
      rating: place.rating ?? null,
      count: place.userRatingCount ?? null,
      mapsUrl: place.googleMapsUri || null,
      writeReviewUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`,
      reviews,
    });
  } catch (err) {
    console.error(err);
    return json({ error: "Fetch failed" }, 502, false);
  }
};

function json(body, status = 200, cache = true) {
  const headers = { "Content-Type": "application/json" };
  if (cache) {
    headers["Cache-Control"] = "public, max-age=300";
    headers["Netlify-CDN-Cache-Control"] = "public, durable, max-age=21600, stale-while-revalidate=86400";
  } else {
    headers["Cache-Control"] = "no-store";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export const config = { path: "/api/reviews" };
