# Project Documentation

Current operational guidance:

- [Setup, verification and comment delivery](../README.md)
- [Post durability and recovery](../POST_DURABILITY.md)

[Archived records](archive/README.md) preserve historical plans and analysis.
Current implementation and tests take precedence over those records.

Git policy: operational documentation and explicitly retained archives are
tracked. `docs/superpowers/` remains an ignored location for local generated
plans. Previously tracked plans were moved into `docs/archive/superpowers/`
without changing their contents. Ignored local plans are retained in place.

## Performance Maintenance

- Preserve existing appearance, animations, controls and uploaded originals.
- Measure representative workloads before changing search ranking, adding writer
  pagination, or splitting interaction bundles; lazy loading can delay first use.
- Uploaded-image variants must preserve old URLs, crop/rotation metadata and animation.
- Request-time public pages may use private/no-store response headers even when
  internal queries are cached. A `revalidate` export alone does not prove shared
  HTML caching, and synthetic measurements do not establish field Core Web Vitals.
