import { useState, useMemo } from 'react';
import { MOCK_WEEKLY_ADS } from '../../data/coupons';
import { DIET_EXCLUSIONS } from '../../data/dietary';
import type { WeeklyAdItem, DietaryProfile } from '../../lib/types';

const AD_CATEGORIES = ['all', 'produce', 'dairy', 'meat', 'bakery', 'beverages', 'frozen', 'household', 'personal'] as const;

interface Props {
  storeId: string;
  storeName: string;
  storeColor: string;
  profile: DietaryProfile;
}

export function WeeklyAdBrowser({ storeId, storeName, storeColor, profile }: Props) {
  const [category, setCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState(true);

  const storeAds = useMemo(() => {
    let items = MOCK_WEEKLY_ADS.filter((a) => a.storeId === storeId);
    if (dietFilter && (profile.diet || profile.allergens.length > 0)) {
      const implicitAllergens = DIET_EXCLUSIONS[profile.diet] || [];
      const excluded = new Set([...profile.allergens, ...implicitAllergens]);
      if (excluded.size > 0) {
        items = items.filter((a) => !a.allergens.some((al) => excluded.has(al)));
      }
    }
    if (category !== 'all') items = items.filter((a) => a.category === category);
    return items;
  }, [storeId, category, dietFilter, profile]);

  const validRange = storeAds.length > 0
    ? `${new Date(storeAds[0].validFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(storeAds[0].validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  return (
    <div className="animate-fade-in">
      {/* Store header */}
      <div className="p-3 rounded-2xl mb-3" style={{ background: `${storeColor}10`, border: `1px solid ${storeColor}25` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: storeColor }}>Weekly Ad</p>
            <p className="text-base font-bold text-gray-800">{storeName}</p>
          </div>
          {validRange && <p className="text-[10px] font-medium text-gray-400">{validRange}</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setDietFilter(!dietFilter)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
          style={{ borderColor: dietFilter ? '#2D6A4F' : '#E5E7EB', background: dietFilter ? '#ECFDF5' : 'white', color: dietFilter ? '#2D6A4F' : '#6B7280' }}>
          {dietFilter ? '🥗 Filtered' : '🍽️ All'}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3">
        {AD_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap transition-all"
            style={{ background: category === cat ? storeColor : '#F3F4F6', color: category === cat ? 'white' : '#6B7280' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Ad items */}
      {storeAds.length === 0 ? (
        <div className="text-center py-8">
          
          <p className="text-sm text-gray-500">No ad items in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {storeAds.map((item) => (
            <AdItemCard key={item.id} item={item} storeColor={storeColor} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdItemCard({ item, storeColor }: { item: WeeklyAdItem; storeColor: string }) {
  const savings = item.originalPrice ? ((1 - item.salePrice / item.originalPrice) * 100).toFixed(0) : null;

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
      {/* Price banner */}
      <div className="p-2.5 text-center text-white" style={{ background: storeColor }}>
        <p className="text-xl font-bold leading-none">${item.salePrice.toFixed(2)}</p>
        {item.originalPrice && (
          <p className="text-[10px] mt-0.5 opacity-75">
            <span className="line-through">${item.originalPrice.toFixed(2)}</span>
            {savings && <span className="ml-1 font-bold">Save {savings}%</span>}
          </p>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-gray-800 leading-snug">{item.productName}</p>
        {item.brand && <p className="text-[10px] text-gray-400">{item.brand}</p>}
        <p className="text-[10px] text-gray-400 mt-0.5">{item.description}</p>
        {item.unitPrice && (
          <p className="text-[10px] font-semibold text-forest-500 mt-1">{item.unitPrice}</p>
        )}
        {/* Diet badges */}
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {item.dietaryTags.filter((t) => ['vegan', 'gluten-free', 'keto'].includes(t)).slice(0, 2).map((tag) => (
            <span key={tag} className="px-1 py-0.5 rounded text-[8px] font-bold uppercase"
              style={{ background: tag === 'vegan' ? '#DCFCE7' : tag === 'gluten-free' ? '#FEF3C7' : '#DBEAFE',
                       color: tag === 'vegan' ? '#166534' : tag === 'gluten-free' ? '#92400E' : '#1E40AF' }}>
              {tag === 'gluten-free' ? 'GF' : tag === 'vegan' ? 'V' : tag.slice(0, 4).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
