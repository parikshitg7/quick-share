import React from 'react';
import { useParams } from 'react-router-dom';

function RoomPage() {
  const { roomId } = useParams();

  return (
    <div>
      <h1>Quick Share — Room: {roomId}</h1>
    </div>
  );
}

export default RoomPage;