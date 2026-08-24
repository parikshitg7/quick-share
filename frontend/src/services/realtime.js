import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Subscribes to new items inserted for a specific room.
 * @param {string} roomId - The ID of the room to listen to.
 * @param {function} onNewItem - Callback executed when an INSERT event occurs.
 * @returns {object} subscription channel that can be unsubscribed.
 */
export function subscribeToRoomItems(roomId, onNewItem) {
  const channel = supabase
    .channel(`room-items-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'items',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (onNewItem) {
          onNewItem(payload.new);
        }
      }
    )
    .subscribe();

  return channel;
}