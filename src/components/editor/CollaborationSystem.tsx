import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface CollaborationSystemProps {
  documentId: string;
  editor: Editor;
}

interface CollaboratorPresence {
  user_id: string;
  user_name: string;
  cursor_position?: number;
  last_seen: string;
  avatar_url?: string;
}

export const CollaborationSystem: React.FC<CollaborationSystemProps> = ({
  documentId,
  editor
}) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!documentId || !user) return;

    // إنشاء قناة للتعاون المباشر
    const collaborationChannel = supabase.channel(`document_${documentId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // تتبع المتعاونين النشطين
    collaborationChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = collaborationChannel.presenceState();
        const activeCollaborators: CollaboratorPresence[] = [];
        
        Object.entries(newState).forEach(([userId, presences]) => {
          const presence = presences[0] as any;
          if (userId !== user.id) {
            activeCollaborators.push({
              user_id: userId,
              user_name: presence.user_name || 'مستخدم',
              cursor_position: presence.cursor_position,
              last_seen: new Date().toISOString(),
              avatar_url: presence.avatar_url,
            });
          }
        });
        
        setCollaborators(activeCollaborators);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // إرسال presence المستخدم الحالي
          await collaborationChannel.track({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'مستخدم',
            avatar_url: user.user_metadata?.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(collaborationChannel);

    // تنظيف
    return () => {
      collaborationChannel.unsubscribe();
    };
  }, [documentId, user]);

  // تحديث موقع المؤشر
  useEffect(() => {
    if (!editor || !channel) return;

    const updateCursorPosition = () => {
      const { from } = editor.state.selection;
      channel.track({
        user_id: user?.id,
        user_name: user?.user_metadata?.full_name || user?.email || 'مستخدم',
        cursor_position: from,
        online_at: new Date().toISOString(),
      });
    };

    editor.on('selectionUpdate', updateCursorPosition);

    return () => {
      editor.off('selectionUpdate', updateCursorPosition);
    };
  }, [editor, channel, user]);

  return (
    <div className="collaboration-system">
      {/* عرض المتعاونين النشطين */}
      {collaborators.length > 0 && (
        <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <span className="text-sm text-muted-foreground">المتعاونون:</span>
          {collaborators.map((collaborator) => (
            <div key={collaborator.user_id} className="flex items-center gap-1">
              <Avatar className="h-6 w-6">
                <AvatarImage 
                  src={collaborator.avatar_url} 
                  alt={collaborator.user_name} 
                />
                <AvatarFallback className="text-xs">
                  {collaborator.user_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="text-xs">
                {collaborator.user_name}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* مؤشرات المتعاونين في المحرر */}
      <style>{`
        .collaboration-cursor {
          position: absolute;
          width: 2px;
          height: 1.2em;
          background: #3b82f6;
          animation: collaboration-blink 1s infinite;
        }
        
        .collaboration-cursor::after {
          content: attr(data-user-name);
          position: absolute;
          top: -1.5em;
          left: 0;
          background: #3b82f6;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          pointer-events: none;
        }
        
        @keyframes collaboration-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CollaborationSystem;