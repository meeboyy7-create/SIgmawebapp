/**
 * GradualBlur — progressive blur overlay
 * Renders `divCount` stacked divs each with increasing backdrop-filter blur
 * creating a smooth gradient blur from transparent to fully blurred.
 */
export default function GradualBlur({
  position = 'bottom',
  height = '8rem',
  strength = 8,
  divCount = 8,
  opacity = 1,
  style = {},
}) {
  const isBottom = position === 'bottom';
  const isTop    = position === 'top';

  const layers = Array.from({ length: divCount }, (_, i) => {
    const t        = i / (divCount - 1);          /* 0 → 1 */
    const blurPx   = strength * t * t;             /* quadratic — gentle start */
    const layerH   = `calc(${height} / ${divCount})`;
    /* gradient mask so each layer only covers its slice */
    const gradStop = isBottom
      ? `${(i / divCount) * 100}%, ${((i + 1) / divCount) * 100}%`
      : `${100 - ((i + 1) / divCount) * 100}%, ${100 - (i / divCount) * 100}%`;

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 0, right: 0,
          height: layerH,
          ...(isBottom ? { bottom: `calc(${height} - ${layerH} * ${i + 1})` } : { top: `calc(${height} - ${layerH} * ${i + 1})` }),
          backdropFilter: `blur(${blurPx.toFixed(2)}px)`,
          WebkitBackdropFilter: `blur(${blurPx.toFixed(2)}px)`,
          maskImage: isBottom
            ? `linear-gradient(to top, black 0%, black 100%)`
            : `linear-gradient(to bottom, black 0%, black 100%)`,
          opacity,
          pointerEvents: 'none',
        }}
      />
    );
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0, right: 0,
        ...(isBottom ? { bottom: 0 } : { top: 0 }),
        height,
        pointerEvents: 'none',
        zIndex: 8,
        ...style,
      }}
    >
      {layers}
    </div>
  );
}
