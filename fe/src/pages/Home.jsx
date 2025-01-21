import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      gap: '20px'
    }}>
      <button
        onClick={() => navigate('/admin')}
        style={{
          padding: '15px 30px',
          fontSize: '18px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          width: '200px'
        }}
      >
        Admin
      </button>
      <button
        onClick={() => navigate('/display')}
        style={{
          padding: '15px 30px',
          fontSize: '18px',
          cursor: 'pointer',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          width: '200px'
        }}
      >
        Display
      </button>
    </div>
  );
};

export default Home;
