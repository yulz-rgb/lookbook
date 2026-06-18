'use client';

// Mannequin preview with layered garment shapes. Falls back to a CSS shape when
// a product has no real image; uses the product photo when imageUrl is present.

const HINT_ALIASES = {
  'chef-jacket': 'chef-jacket',
  engineering: 'overalls',
  epaulettes: 'epaulettes',
};

function resolveGarmentHint(product) {
  const raw = product.imageHint || product.category;
  return HINT_ALIASES[raw] || raw;
}

function garmentProps(product, fill, stroke) {
  const hasPhoto = Boolean(product.imageUrl);
  return {
    className: `garment${hasPhoto ? ' has-photo' : ''}`,
    style: { background: fill, borderColor: stroke },
  };
}

export function GarmentShape({ product, showLabel = false }) {
  if (!product) return null;
  const fill = product.swatch || '#ffffff';
  const stroke = product.accent || '#0b1f3a';
  const hint = resolveGarmentHint(product);
  const label = product.name?.split(' ').slice(0, 2).join(' ');
  const imageOverlay = product.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="garment-photo" src={product.imageUrl} alt={product.name || ''} />
  ) : null;
  const gp = garmentProps(product, fill, stroke);
  const labelEl = showLabel && !product.imageUrl ? <span>{label}</span> : null;
  const shapes = {
    polo: <div {...gp} className={`${gp.className} polo`}>{imageOverlay}{labelEl}</div>,
    dress: <div {...gp} className={`${gp.className} dress`}>{imageOverlay}{labelEl}</div>,
    shirt: <div {...gp} className={`${gp.className} shirt`}>{imageOverlay}{labelEl}</div>,
    jacket: <div {...gp} className={`${gp.className} jacket`}>{imageOverlay}{labelEl}</div>,
    'chef-jacket': <div {...gp} className={`${gp.className} chef-jacket`}>{imageOverlay}{labelEl}</div>,
    overalls: <div {...gp} className={`${gp.className} overalls`}>{imageOverlay}{labelEl}</div>,
    epaulettes: <div {...gp} className={`${gp.className} epaulettes`} style={{ ...gp.style, '--epaulette': stroke }}>{imageOverlay}{labelEl}</div>,
    shorts: <div {...gp} className={`${gp.className} shorts`}>{imageOverlay}{labelEl}</div>,
    skort: <div {...gp} className={`${gp.className} skort`}>{imageOverlay}{labelEl}</div>,
    trousers: <div {...gp} className={`${gp.className} trousers`}>{imageOverlay}{labelEl}</div>,
    shoes: <><div className={`garment shoe left${product.imageUrl ? ' has-photo' : ''}`} style={{ background: fill, borderColor: stroke }}>{product.imageUrl && imageOverlay}</div><div className="garment shoe right" style={{ background: fill, borderColor: stroke }} /></>,
    cap: <div {...gp} className={`${gp.className} cap`}>{imageOverlay}</div>,
    belt: <div {...gp} className={`${gp.className} belt`} />,
  };
  return shapes[hint] || <div {...gp} className={`${gp.className} polo`}>{imageOverlay}{labelEl}</div>;
}

export function Mannequin({ bodyType, selectedProducts, compact = false, view = 'front', overlayOnly = false }) {
  const byCategory = Object.fromEntries(selectedProducts.map((p) => [p.category, p]));
  const accessories = selectedProducts.filter((p) => p.category === 'accessories');
  const hasTop = Boolean(
    byCategory.dresses
    || byCategory.engineering
    || byCategory.tops
    || byCategory.shirts
    || byCategory.epaulettes
    || byCategory['chef-wear']
    || byCategory['spa-wear']
    || byCategory.outerwear,
  );
  const hasBottom = Boolean(byCategory.bottoms || (byCategory.dresses && bodyType === 'woman'));
  return (
    <div className={`mannequin ${bodyType} ${compact ? 'compact' : ''} ${overlayOnly ? 'overlay-only' : ''} view-${view}`}>
      {!overlayOnly && <>
        <div className="body head"><div className="hair" /></div>
        <div className="body neck" />
        <div className="body torso-base" />
        <div className="body arm left" /><div className="body arm right" />
        <div className="body leg left" /><div className="body leg right" />
        {!compact && bodyType === 'woman' && !hasTop && <div className="garment underwear-bra" aria-hidden />}
        {!compact && !hasBottom && <div className="garment underwear-shorts" aria-hidden />}
      </>}
      {byCategory.dresses && bodyType === 'woman' ? <GarmentShape product={byCategory.dresses} /> :
        byCategory.engineering ? <GarmentShape product={byCategory.engineering} /> : <>
        <GarmentShape product={byCategory.tops || byCategory.shirts || byCategory.epaulettes || byCategory['chef-wear'] || byCategory['spa-wear']} />
        <GarmentShape product={byCategory.bottoms} />
      </>}
      <GarmentShape product={byCategory.outerwear} />
      <GarmentShape product={byCategory.shoes} />
      {accessories.map((p) => <GarmentShape key={p.id} product={p} />)}
    </div>
  );
}
