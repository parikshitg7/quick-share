import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoom, getItems, sealRoom } from '../services/api';
import { subscribeToRoomItems, supabase } from '../services/realtime';
import TextDropForm from '../components/TextDropForm';
import FileDropZone from '../components/FileDropZone';
import ItemList from '../components/ItemList';
import RoomAccessPanel from '../components/RoomAccessPanel';

function RoomPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoomData = useCallback(async () => {
    try {
      const roomData = await getRoom(roomId);
      setRoom(roomData);
      const itemsData = await getItems(roomId);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to fetch room or items:', err);
      if (err.status === 410 || err.message?.includes('expired')) {
        setIsExpired(true);
      } else {
        setError('Failed to load room. It may not exist or an error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Subscribe to real-time room item changes
  useEffect(() => {
    if (!roomId || isExpired) return;

    const channel = subscribeToRoomItems(roomId, (newItem) => {
      setItems((prevItems) => {
        if (prevItems.some((item) => item.id === newItem.id)) {
          return prevItems;
        }
        return [...prevItems, newItem];
      });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isExpired]);

  const handleRefreshItems = async () => {
    try {
      const updatedItems = await getItems(roomId);
      setItems(updatedItems);
    } catch (err) {
      console.error('Failed to refresh items:', err);
    }
  };

  const handleSealRoom = async () => {
    if (!window.confirm('Once sealed, this room will permanently burn and delete immediately after the recipient opens it. Seal now?')) {
      return;
    }
    setIsSealing(true);
    try {
      const updatedRoom = await sealRoom(roomId);
      setRoom(updatedRoom);
    } catch (err) {
      console.error('Failed to seal room:', err);
      alert('Failed to seal room. Please try again.');
    } finally {
      setIsSealing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading room...</div>;
  }

  // Friendly Expired State Handling
  if (isExpired) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px' }}>
        <h2 style={{ color: '#d9534f' }}>This room has expired</h2>
        <p style={{ color: '#666', lineHeight: '1.5' }}>
          The lifespan set for this room has ended, or it was configured to burn after viewing. All files and shared items have been permanently deleted.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            padding: '10px 18px',
            backgroundColor: '#0070f3',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Create a New Room
        </Link>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: 'red' }}>
        <h2>Error</h2>
        <p>{error || 'Room not found.'}</p>
        <Link to="/" style={{ textDecoration: 'none', color: '#0066cc', marginTop: '1rem', display: 'inline-block' }}>
          Back Home
        </Link>
      </div>
    );
  }

  const isBurnRoom = room.burn_after_view;
  const isSealed = room.sealed;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '700px' }}>
      <h1>Room: {room.id}</h1>

      {/* Burn-After-View Banner & Seal Actions */}
      {isBurnRoom && !isSealed && (
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '16px', borderRadius: '6px', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>🔒 Staging: Burn-After-View Mode</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#856404' }}>
            Upload files and text below. When ready, seal the room to generate the shareable link. The recipient will be able to view and download once before the room burns forever.
          </p>
          <button
            onClick={handleSealRoom}
            disabled={isSealing}
            style={{
              padding: '10px 18px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isSealing ? 'not-allowed' : 'pointer',
            }}
          >
            {isSealing ? 'Sealing Room...' : 'Seal Room & Generate Link'}
          </button>
        </div>
      )}

      {/* Room Access Panel (Shown for standard rooms OR sealed burn rooms) */}
      {(!isBurnRoom || isSealed) && (
        <RoomAccessPanel roomId={room.id} shortCode={room.short_code} />
      )}

      {/* Upload Triggers (Only accessible if standard room OR unsealed burn room) */}
      {(!isBurnRoom || !isSealed) && (
        <>
          <FileDropZone roomId={roomId} onItemAdded={handleRefreshItems} />
          <TextDropForm roomId={roomId} onItemAdded={handleRefreshItems} />
        </>
      )}

      <h2>Shared Items</h2>
      <ItemList items={items} onItemDeleted={handleRefreshItems} />
    </div>
  );
}

export default RoomPage;