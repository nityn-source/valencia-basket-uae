import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import type { SeoImageAlt, SeoPage, SeoRedirect } from "@shared/schema";
import { validateLoop, validateSource } from "@/app/api/admin/seo/redirects/route";
import { hasSeoPageOverride, normalizeSeoPageOverride } from "@/app/api/admin/seo/pages/route";
import {
  GET as getImageAlts,
  getImageAltConflictReviews,
  PUT as putImageAlt,
  requiresExplicitConflictReviewToReset,
} from "@/app/api/admin/seo/images/route";
import { getAltResolver, mergeSeo } from "@/lib/seo/resolve";
import {
  getManagedImage,
  MANAGED_IMAGE_ASSETS,
  MANAGED_IMAGES,
} from "@/lib/seo/images";
import { storage } from "@/lib/storage";
import type { PageSeoDefaults } from "@/lib/seo/registry";
import { seoPageOverrideSchema, seoRedirectSchema } from "@shared/schema";

const defaults: PageSeoDefaults = {
  path: "/test-page",
  label: "Test page",
  group: "Main",
  title: "Default title",
  description: "Default description",
  canonical: "/test-page",
  ogTitle: "Default social title",
  ogDescription: "Default social description",
};

const override = (values: Partial<SeoPage>): SeoPage => values as SeoPage;

test("mergeSeo keeps code defaults when saved overrides are blank", () => {
  const resolved = mergeSeo(
    defaults,
    override({
      metaTitle: " ",
      metaDescription: null,
      canonicalUrl: "",
      ogTitle: "\n\t",
      ogDescription: null,
    })
  );

  assert.deepEqual(resolved, {
    title: defaults.title,
    description: defaults.description,
    canonical: defaults.canonical,
    ogTitle: defaults.ogTitle,
    ogDescription: defaults.ogDescription,
    ogImage: null,
    noIndex: false,
    noFollow: false,
    focusKeyword: null,
  });
});

test("mergeSeo uses saved non-blank values", () => {
  const resolved = mergeSeo(
    defaults,
    override({
      metaTitle: "Saved title",
      metaDescription: "Saved description",
      canonicalUrl: "/saved-page",
      ogTitle: "Saved social title",
      ogDescription: "Saved social description",
      ogImage: "/saved-image.jpg",
      noIndex: true,
    })
  );

  assert.deepEqual(resolved, {
    title: "Saved title",
    description: "Saved description",
    canonical: "/saved-page",
    ogTitle: "Saved social title",
    ogDescription: "Saved social description",
    ogImage: "/saved-image.jpg",
    noIndex: true,
    noFollow: false,
    focusKeyword: null,
  });
});

test("an unchanged visible SEO value remains an inherited default", () => {
  const visibleDefaults = seoPageOverrideSchema.parse({
    path: "/programs",
    metaTitle: defaults.title,
    metaDescription: defaults.description,
    canonicalUrl: defaults.canonical,
    ogTitle: defaults.ogTitle,
    ogDescription: defaults.ogDescription,
    ogImage: "",
    noIndex: false,
    noFollow: false,
    focusKeyword: "",
  });
  assert.equal(
    hasSeoPageOverride(normalizeSeoPageOverride(visibleDefaults, defaults)),
    false
  );
  assert.equal(
    hasSeoPageOverride(
      seoPageOverrideSchema.parse({
        path: "/programs",
        metaTitle: "Custom programs title",
        noIndex: null,
        noFollow: true,
        focusKeyword: "basketball programs Dubai",
      })
    ),
    true
  );
});

test("page SEO resolves independent robots controls and internal focus keywords", () => {
  const resolved = mergeSeo(defaults, override({
    noIndex: false,
    noFollow: true,
    focusKeyword: "basketball academy Dubai",
  }));
  assert.equal(resolved.noIndex, false);
  assert.equal(resolved.noFollow, true);
  assert.equal(resolved.focusKeyword, "basketball academy Dubai");
});

test("admin SEO content is shown as editable values with copy and error actions", () => {
  const seoManager = readFileSync(join(process.cwd(), "app/admin/SeoManager.tsx"), "utf8");
  const adminPage = readFileSync(join(process.cwd(), "app/admin/page.tsx"), "utf8");

  assert.doesNotMatch(
    seoManager,
    /placeholder=\{page\.defaults\.(?:title|description|canonical|ogTitle|ogDescription)\}/,
    "built-in page content must be shown as selectable values, not placeholders"
  );
  assert.match(seoManager, /function CopyValueButton/, "SEO values must provide a copy action");
  assert.match(seoManager, /Couldn&apos;t load SEO pages/, "page API failures need a clear error state");
  assert.match(
    seoManager,
    /Restore built-in values/,
    "administrators need a visible way to return to built-in SEO values"
  );
  assert.match(seoManager, /select-seo-index/);
  assert.match(seoManager, /select-seo-follow/);
  assert.match(seoManager, /Focus keyword/);
  assert.match(
    seoManager,
    /Confirm this change before it publishes/,
    "raw JSON-LD schema edits must be reviewed before they publish"
  );
  assert.match(
    adminPage,
    /event\?\.imageAlt \?\? event\?\.title \?\? ""/,
    "event title fallback must be visible as editable alt text"
  );
});

test("SEO URL schemas accept internal paths and own-host URLs", () => {
  assert.equal(
    seoPageOverrideSchema.parse({
      path: "/programs",
      canonicalUrl: "https://www.valenciabasket.ae/programs",
    }).canonicalUrl,
    "https://www.valenciabasket.ae/programs"
  );

  assert.deepEqual(
    seoRedirectSchema.parse({
      source: "/old-programs",
      destination: "https://valenciabasket.ae/programs?source=legacy#details",
    }),
    {
      source: "/old-programs",
      destination: "/programs?source=legacy#details",
      enabled: true,
    }
  );

  assert.equal(
    seoRedirectSchema.parse({ source: "/old-events", destination: "/events" }).destination,
    "/events"
  );
});

test("SEO URL schemas reject unsafe redirect and canonical destinations", () => {
  const unsafeValues = [
    "//unsafe.example/path",
    "https://unsafe.example/path",
    "javascript:alert(1)",
    "/programs/../admin",
    "https://valenciabasket.ae/programs/../admin",
  ];

  for (const value of unsafeValues) {
    assert.throws(() =>
      seoRedirectSchema.parse({ source: "/old-path", destination: value })
    );
    assert.throws(() =>
      seoPageOverrideSchema.parse({ path: "/page", canonicalUrl: value })
    );
  }
});

test("redirect source guard protects live and reserved routes", () => {
  assert.equal(validateSource("/legacy-page"), null);
  assert.match(validateSource("/") ?? "", /homepage/i);
  assert.match(validateSource("/programs") ?? "", /existing page/i);
  assert.match(validateSource("/api/admin/seo") ?? "", /reserved path/i);
});

const redirect = (id: string, source: string, destination: string): SeoRedirect =>
  ({ id, source, destination, enabled: true }) as SeoRedirect;

test("redirect loop validation rejects direct and chained loops", async () => {
  const original = storage.getAllSeoRedirects;
  storage.getAllSeoRedirects = async () => [
    redirect("one", "/old-one", "/old-two"),
    redirect("two", "/old-two", "/new-home"),
  ];

  try {
    assert.equal(
      await validateLoop("/same-page", "/same-page"),
      "Source and destination must differ"
    );
    assert.equal(
      await validateLoop("/new-home", "/old-one"),
      "That would create a redirect loop"
    );
    assert.equal(await validateLoop("/legacy", "/old-one"), null);
  } finally {
    storage.getAllSeoRedirects = original;
  }
});

test("every managed image has a non-empty code-defined alt fallback", () => {
  assert.ok(MANAGED_IMAGES.length > 0, "managed image registry must not be empty");

  for (const image of MANAGED_IMAGES) {
    assert.match(
      image.defaultAlt,
      /\S/,
      `managed image "${image.key}" must have a non-empty default alt`
    );
  }
});

test("managed image assets unify duplicate placement files", () => {
  assert.equal(
    MANAGED_IMAGE_ASSETS.length,
    new Set(MANAGED_IMAGES.map((image) => image.src)).size,
    "each source file must have exactly one shared asset record"
  );

  const futureBallers = MANAGED_IMAGE_ASSETS.find(
    (asset) => asset.src === "/images/mini-basket-team.jpg"
  );
  assert.ok(futureBallers, "expected the shared Future Ballers image asset");
  assert.deepEqual(
    futureBallers.placements.map((placement) => placement.key).sort(),
    [
      "future-ballers.hero",
      "future-ballers.session",
      "home.future-ballers",
      "programs.future-ballers",
    ],
    "all placements of the same file must be represented by one asset"
  );
});

test("public-page image inventory uses managed alt values or decorative images", () => {
  const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
  const expectedImageKeys: Record<string, string[]> = {
    "app/page.tsx": [
      "home.hero",
      "home.future-ballers",
      "home.mini-basket",
      "home.youth-academy",
      "home.elite",
      "home.private-training",
      "home.methodology",
      "home.arena",
    ],
    // Staff page defaults (the Admin → Staff table starts from these).
    "lib/content/staff.ts": [
      "coaches.maros-kovacik",
      "coaches.martin-pospisil",
      "coaches.saiid",
      "coaches.rabih",
      "coaches.majil",
      "coaches.ahmed",
      "coaches.guillem",
      "coaches.andreu",
      "coaches.ruben",
      "coaches.carles",
    ],
    "app/programs/page.tsx": [
      "programs.future-ballers",
      "programs.mini-basket",
      "programs.youth-academy",
      "programs.elite",
      "programs.girls",
      "programs.private-training",
    ],
  };

  for (const [path, expectedKeys] of Object.entries(expectedImageKeys)) {
    const contents = source(path);

    // A page's image can be a literal file (https://... or the legacy
    // /images/...) or a variable resolved via the Page Content system
    // (`await getContent("...")`, assigned above the JSX and referenced as
    // `src={someImage}`) — both are "managed" as long as the alt text still
    // comes from the managed-image registry, which is what this test guards.
    const staticTags =
      contents.match(/<(?:Image|img|Hero|ProgramCard)\b[\s\S]*?\/>/g) ?? [];
    const staticImageTags = staticTags.filter(
      (tag) =>
        /^<Hero\b/.test(tag) ||
        /(?:src|image)=(?:["'](?:https?:\/\/|\/images\/)|\{[A-Za-z_$][\w$]*\})/.test(tag)
    );
    // The bare-identifier branch requires a trailing comma (a real object
    // literal field) rather than a semicolon, so this doesn't also match a
    // TypeScript interface declaration like `image: string;`.
    const dataImages =
      contents.match(
        /\{(?:(?![{}])[\s\S])*?image:\s*(?:["'](?:https?:\/\/|\/images\/)[^"']*["']|[A-Za-z_$][\w$]*(?=\s*,))(?:(?![{}])[\s\S])*?\}/g
      ) ?? [];

    const discoveredKeys: string[] = [];

    for (const tag of staticImageTags) {
      const key = tag.match(
        /(?:alt|imageAlt)=\{alt\(["']([^"']+)["']\)\}/
      )?.[1];
      const decorative = /(?:alt|imageAlt)=["']{2}/.test(tag);

      assert.ok(
        key || decorative,
        `${path} has a static image without a managed alt value or explicit empty decorative alt:\n${tag}`
      );

      if (!key) continue;
      discoveredKeys.push(key);

      const registered = getManagedImage(key);
      assert.ok(registered, `${path} uses unregistered managed image key "${key}"`);

      // Only a literal string source can be checked statically; a variable
      // (Page Content field) is resolved and verified at runtime instead.
      const src = tag.match(/(?:src|image)=["']([^"']+)["']/)?.[1];
      if (src) {
        assert.equal(
          registered.src,
          src,
          `${path} must use the registered source for "${key}"`
        );
      }
    }

    for (const image of dataImages) {
      const src = image.match(/image:\s*["']([^"']+)["']/)?.[1];
      const key = image.match(/imageKey:\s*["']([^"']+)["']/)?.[1];
      const decorative = /decorative:\s*true/.test(image);

      assert.ok(
        key || decorative,
        `${path} has static image data without an imageKey or decorative: true:\n${image}`
      );

      if (!key) continue;
      discoveredKeys.push(key);

      const registered = getManagedImage(key);
      assert.ok(registered, `${path} uses unregistered managed image key "${key}"`);
      if (src) {
        assert.equal(
          registered.src,
          src,
          `${path} must use the registered source for "${key}"`
        );
      }
    }

    assert.deepEqual(
      discoveredKeys.sort(),
      [...expectedKeys].sort(),
      `${path} static image inventory changed; register managed images or mark them decorative`
    );
  }

  // Staff photos come from Admin → Staff; the original photos keep their
  // SEO-managed alt text via staffPhotoAlt (a newly uploaded photo uses the name).
  const coaches = source("app/coaches/page.tsx");
  assert.match(
    coaches,
    /staffPhotoAlt\(member, alt\)/,
    "coach cards must resolve photo alt text through the managed-alt helper"
  );
  assert.match(
    source("lib/content/staffStore.ts"),
    /managedAlt\(member\.imageKey\)/,
    "the staff alt helper must use the managed key for original photos"
  );

  const programs = source("app/programs/page.tsx");
  assert.match(
    programs,
    /alt=\{alt\(program\.imageKey\)\}/,
    "program cards must resolve each static program image through its managed key"
  );

  const programCard = source("components/shared/ProgramCard.tsx");
  assert.match(
    programCard,
    /alt=\{imageAlt\}/,
    "ProgramCard must receive a managed alt value from its public-page caller"
  );
  assert.doesNotMatch(
    programCard,
    /alt=\{?["'][^"']+["']\}?/,
    "ProgramCard must not introduce a hard-coded image description"
  );
});

test("file-level image alt overrides apply to every placement and preserve fallbacks", async () => {
  const original = storage.getAllSeoImageAltFiles;
  storage.getAllSeoImageAltFiles = async () =>
    [
      {
        imageKey: "file:/images/mini-basket-team.jpg",
        imageSrc: "/images/mini-basket-team.jpg",
        altText: "Players practicing basketball together",
        isDecorative: false,
      },
      {
        imageKey: "file:/images/hero-players-2.jpg",
        imageSrc: "/images/hero-players-2.jpg",
        altText: " \n\t ",
        isDecorative: false,
      },
      {
        imageKey: "file:/images/logo.png",
        imageSrc: "/images/logo.png",
        altText: null,
        isDecorative: true,
      },
    ] as SeoImageAlt[];

  try {
    const alt = await getAltResolver();
    assert.equal(alt("home.hero"), "Valencia Basket UAE Action");
    assert.equal(alt("home.future-ballers"), "Players practicing basketball together");
    assert.equal(alt("programs.future-ballers"), "Players practicing basketball together");
    assert.equal(alt("future-ballers.hero"), "Players practicing basketball together");
    assert.equal(alt("thank-you.logo"), "");
  } finally {
    storage.getAllSeoImageAltFiles = original;
  }
});

test("image alt review queue exposes conflicting legacy placement descriptions", () => {
  const asset = MANAGED_IMAGE_ASSETS.find(
    (candidate) => candidate.src === "/images/mini-basket-team.jpg"
  );
  assert.ok(asset, "expected the shared Future Ballers image asset");

  const rows = [
    {
      imageKey: asset.storageKey,
      imageSrc: asset.src,
      altText: "Newest shared description",
      isDecorative: false,
      needsReview: true,
      reviewedAt: null,
      updatedAt: new Date("2026-08-20T12:00:00Z"),
    },
    {
      imageKey: asset.placements[0].key,
      imageSrc: null,
      altText: "Older placement description",
      isDecorative: false,
      needsReview: false,
      reviewedAt: null,
      updatedAt: new Date("2026-08-19T12:00:00Z"),
    },
    {
      imageKey: asset.placements[1].key,
      imageSrc: null,
      altText: "Newest shared description",
      isDecorative: false,
      needsReview: false,
      reviewedAt: null,
      updatedAt: new Date("2026-08-20T12:00:00Z"),
    },
  ] as SeoImageAlt[];

  assert.deepEqual(getImageAltConflictReviews(rows), [
    {
      src: asset.src,
      sharedDescription: "Newest shared description",
      previousValues: [
        {
          key: asset.placements[0].key,
          page: asset.placements[0].page,
          description: "Older placement description",
          updatedAt: new Date("2026-08-19T12:00:00Z"),
        },
        {
          key: asset.placements[1].key,
          page: asset.placements[1].page,
          description: "Newest shared description",
          updatedAt: new Date("2026-08-20T12:00:00Z"),
        },
      ],
    },
  ]);

  rows[0].needsReview = false;
  assert.deepEqual(getImageAltConflictReviews(rows), []);
});

test("pending image description conflicts cannot be reset without review", () => {
  assert.equal(
    requiresExplicitConflictReviewToReset(null, false, { needsReview: true }),
    true
  );
  assert.equal(
    requiresExplicitConflictReviewToReset(null, false, { needsReview: false }),
    false
  );
  assert.equal(
    requiresExplicitConflictReviewToReset("Replacement description", false, {
      needsReview: true,
    }),
    false
  );
  assert.equal(
    requiresExplicitConflictReviewToReset(null, true, { needsReview: true }),
    false
  );
});

test("authenticated image API preserves conflicts until an administrator confirms the built-in fallback", async () => {
  const asset = MANAGED_IMAGE_ASSETS.find(
    (candidate) => candidate.src === "/images/mini-basket-team.jpg"
  );
  assert.ok(asset, "expected the shared Future Ballers image asset");

  const token = "image-review-admin-session";
  const placementDescriptions = asset.placements.map(
    (_, index) => `Legacy placement description ${index + 1}`
  );
  const updatedAt = asset.placements.map(
    (_, index) => new Date(`2026-08-${String(10 + index).padStart(2, "0")}T12:00:00Z`)
  );
  const request = (method: "GET" | "PUT", body?: unknown) =>
    new NextRequest("http://localhost/api/admin/seo/images", {
      method,
      headers: {
        cookie: `admin_token=${token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  let canonical = {
    id: "canonical-image-alt",
    imageKey: asset.storageKey,
    imageSrc: asset.src,
    altText: "Chosen shared description",
    isDecorative: false,
    needsReview: true,
    reviewedAt: null,
    updatedAt: new Date("2026-08-20T12:00:00Z"),
  } as SeoImageAlt;
  const rows = [
    canonical,
    ...asset.placements.map(
      (placement, index) =>
        ({
          id: `legacy-image-alt-${index}`,
          imageKey: placement.key,
          imageSrc: null,
          altText: placementDescriptions[index],
          isDecorative: false,
          needsReview: false,
          reviewedAt: null,
          updatedAt: updatedAt[index],
        }) as SeoImageAlt
    ),
  ];
  const originalGetAllSeoImageAlts = storage.getAllSeoImageAlts;
  const originalGetAllEvents = storage.getAllEvents;
  const originalGetSessionByToken = storage.getSessionByToken;
  const originalGetSeoImageAltFile = storage.getSeoImageAltFile;
  const originalResolveSeoImageAltConflict = storage.resolveSeoImageAltConflict;

  try {
    storage.getAllSeoImageAlts = async () => rows;
    storage.getAllEvents = async () => [];
    storage.getSessionByToken = async (candidateToken) =>
      candidateToken === token
        ? {
            id: "admin-session",
            userId: "admin-user",
            token,
            expiresAt: new Date(Date.now() + 60_000),
            createdAt: new Date(),
          }
        : undefined;
    storage.getSeoImageAltFile = async (imageSrc) =>
      imageSrc === asset.src ? canonical : undefined;
    storage.resolveSeoImageAltConflict = async (imageSrc, altText, isDecorative) => {
      assert.equal(imageSrc, asset.src);
      canonical = {
        ...canonical,
        altText,
        isDecorative,
        needsReview: false,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      };
      rows[0] = canonical;
      return canonical;
    };

    const listResponse = await getImageAlts(request("GET"));
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    const conflict = list.conflicts.find((candidate: { src: string }) => candidate.src === asset.src);
    assert.deepEqual(conflict, {
      src: asset.src,
      sharedDescription: "Chosen shared description",
      previousValues: asset.placements.map((placement, index) => ({
        key: placement.key,
        page: placement.page,
        description: placementDescriptions[index],
        updatedAt: updatedAt[index].toISOString(),
      })),
    });

    const resetResponse = await putImageAlt(
      request("PUT", {
        imageSrc: asset.src,
        altText: null,
        isDecorative: false,
      })
    );
    assert.equal(resetResponse.status, 409);
    assert.match((await resetResponse.json()).error, /Confirm the built-in description/i);
    const pendingReview = await storage.getSeoImageAltFile(asset.src);
    assert.equal(pendingReview?.altText, "Chosen shared description");
    assert.equal(pendingReview?.needsReview, true);

    const confirmationResponse = await putImageAlt(
      request("PUT", {
        imageSrc: asset.src,
        altText: null,
        isDecorative: false,
        reviewConflict: true,
      })
    );
    assert.equal(confirmationResponse.status, 200);
    assert.deepEqual(await confirmationResponse.json(), {
      success: true,
      reviewed: true,
      affectedPlacements: asset.placements.length,
      affectedPages: new Set(asset.placements.map((placement) => placement.page)).size,
    });

    const resolved = await storage.getSeoImageAltFile(asset.src);
    assert.equal(resolved?.altText, null);
    assert.equal(resolved?.isDecorative, false);
    assert.equal(resolved?.needsReview, false);
    assert.ok(resolved?.reviewedAt);

    const resolvedListResponse = await getImageAlts(request("GET"));
    assert.equal(resolvedListResponse.status, 200);
    const resolvedList = await resolvedListResponse.json();
    assert.equal(
      resolvedList.conflicts.some((candidate: { src: string }) => candidate.src === asset.src),
      false
    );
    const resolvedAsset = resolvedList.assets.find(
      (candidate: { src: string }) => candidate.src === asset.src
    );
    assert.equal(resolvedAsset.override, null);
    assert.equal(resolvedAsset.resolved, asset.defaultAlt);
  } finally {
    storage.getAllSeoImageAlts = originalGetAllSeoImageAlts;
    storage.getAllEvents = originalGetAllEvents;
    storage.getSessionByToken = originalGetSessionByToken;
    storage.getSeoImageAltFile = originalGetSeoImageAltFile;
    storage.resolveSeoImageAltConflict = originalResolveSeoImageAltConflict;
  }
});
