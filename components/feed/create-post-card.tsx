'use client';

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Image, Calendar, Smile } from 'lucide-react';
import { getInitials } from '@/lib/utils/format';

interface CreatePostCardProps {
    user: {
        name?: string;
        avatar?: string;
    } | null;
}

export function CreatePostCard({ user }: CreatePostCardProps) {
    if (!user) return null;

    return (
        <Card className="p-4 mb-6 rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="relative">
                        <Input
                            placeholder={`A cosa stai pensando, ${user?.name?.split(' ')[0] || 'Utente'}?`}
                            className="rounded-full bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors h-10 px-4"
                            readOnly // Temporary until we implement the create modal
                        />
                    </div>
                    <div className="flex items-center justify-between mt-3 px-2">
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full px-3">
                                <Image className="h-4 w-4 mr-2" />
                                <span className="text-xs font-medium">Foto</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full px-3">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="text-xs font-medium">Evento</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-full px-3 hidden sm:flex">
                                <Smile className="h-4 w-4 mr-2" />
                                <span className="text-xs font-medium">Stato</span>
                            </Button>
                        </div>
                        <Button size="sm" className="rounded-full bg-teal-600 hover:bg-teal-700 px-6">
                            Pubblica
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
