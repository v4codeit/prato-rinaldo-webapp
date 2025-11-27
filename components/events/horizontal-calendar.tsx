'use client';

import { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function HorizontalCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 px-1">Calendario Eventi</h2>
            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex space-x-3">
                    {days.map((date) => {
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => setSelectedDate(date)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl border transition-all duration-300",
                                    isSelected
                                        ? "bg-teal-600 text-white border-teal-600 shadow-md scale-105"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-teal-200 hover:bg-teal-50"
                                )}
                            >
                                <span className="text-xs font-medium uppercase">
                                    {format(date, 'EEE', { locale: it })}
                                </span>
                                <span className={cn("text-2xl font-bold", isSelected ? "text-white" : "text-slate-800")}>
                                    {format(date, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
    );
}
