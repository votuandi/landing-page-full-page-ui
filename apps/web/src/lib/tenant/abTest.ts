import { z } from "zod";
import type { AbTest } from "@solar/db";
import type { sectionRegistry } from "@solar/sections";

type Hero = typeof sectionRegistry.types.hero.defaults;
export function withAbVariant(data: Hero, ab: Pick<AbTest, "title" | "ctaLabel">): Hero {
  return { ...data, title: ab.title, primaryCta: { ...data.primaryCta, label: ab.ctaLabel } };
}

/** Only the validated UUID is interpolated; copy never enters executable HTML. */
export function abScript(testId: string) {
  const id = z.uuid().parse(testId);
  return `(function () {
    var id = "${id}", name = "ab_" + id + "=", v;
    try {
      var cookie = document.cookie.split(";").map(function (s) { return s.trim(); })
        .find(function (s) { return s.indexOf(name) === 0; });
      v = cookie && cookie.slice(name.length);
    } catch (e) {}
    if (v !== "A" && v !== "B") {
      v = Math.random() < .5 ? "A" : "B";
      try { document.cookie = name + v + ";path=/;max-age=7776000;samesite=lax"; } catch (e) {}
    }
    document.documentElement.setAttribute("data-ab", v);
    try { navigator.sendBeacon("/api/ab", JSON.stringify({t:id, v:v})); } catch (e) {}
  })();`;
}
