import { useState } from 'react';
import { pickRandomQuote } from '../lib/quotes';

export default function QuoteBanner() {
  // Random on each mount/refresh (not seeded by date) so the quote changes
  // every time the app is opened, instead of staying fixed all day.
  const [quote] = useState(() => pickRandomQuote());

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-3">
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">✨</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-secondary italic">{quote.en}</p>
          <p className="text-sm font-bold text-primary mt-1">{quote.vi}</p>
          <p className="text-xs text-text-secondary mt-1.5">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}
