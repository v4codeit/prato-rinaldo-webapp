import { Star } from 'lucide-react';
import Image from 'next/image';

export function ReviewsList({ reviews }: { reviews: any[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nessuna recensione ancora. Sii il primo a lasciare una recensione!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review: any) => (
        <div key={review.id} className="p-4 border rounded-lg">
          <div className="flex items-start gap-3 mb-2">
            <Image
              src={review.reviewer?.avatar || '/default-avatar.png'}
              alt={review.reviewer?.name || 'Reviewer'}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{review.reviewer?.name}</p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
