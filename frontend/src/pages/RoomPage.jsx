import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getRoom, getItems } from '../services/api';
import TextDropForm from '../components/TextDropForm';
import ItemList from '../components/ItemList';

function RoomPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoomData = useCallback(async () => {
    try {
      const roomData = await getRoom(roomId);
      setRoom(roomData);
      const itemsData = await getItems(roomId);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to fetch room or items:', err);
      setError('Failed to load room. It may not exist or an error occurred.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  const handleItemAdded = async () => {
    try {
      const updatedItems = await getItems(roomId);
      setItems(updatedItems);
    } catch (err) {
      console.error('Failed to refresh items:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading room...</div>;
  }

  if (error || !room) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: 'red' }}>
        <h2>Error</h2>
        <p>{error || 'Room not found.'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Room: {room.id}</h1>
      <p style={{ color: '#666' }}>Short Code: {room.short_code}</p>

      <TextDropForm roomId={roomId} onItemAdded={handleItemAdded} />

      <h2>Shared Items</h2>
      <ItemList items={items} />
    </div>
  );
}

export default RoomPage;