import React from 'react';
import Layout from '@theme/Layout';
import ColorGame from '../components/ColorGame';

export default function ColorGamePage() {
  return (
    <Layout title="Color Game" description="Voice-controlled color game using AAC Speech Recognition Library">
      <div style={{ padding: '20px' }}>
        <ColorGame />
      </div>
    </Layout>
  );
}

