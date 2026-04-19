import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const PopulateFirestore = () => {
  const [status, setStatus] = useState('Loading Auth users...');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const populate = async () => {
      try {
        // This would require Firebase Admin SDK server-side
        // For client-side demo, create sample data
        const sampleUsers = [
          { uid: 'Hl8GAlcNJtRZ29rMPjqSf7OCnr72', email: 'jvtyviucv7fyt@gmail.com', name: 'Test User 1' },
          { uid: 'CUzrj1XjQbX7Rwh05CmKqZFErDB3', email: 'mrmuskmgnt@gmail.com', name: 'Test User 2' },
          { uid: 'lSfg4Cicj9WnADL2mHJFmHUf9c03', email: 'admin@cryptoflow.com', name: 'Admin' },
          { uid: 'TOkNG5QIxAaITeJV5xdeCeslb102', email: 'makemoni35@gmail.com', name: 'Main Admin' },
          { uid: 'uFY2g9nvXRgj2OPNIhnaYIByY1o1', email: 'cvgfhbr@gmail.com', name: 'Test User 5' },
        ];

        setStatus('Creating Firestore users...');
        for (const u of sampleUsers) {
          await setDoc(doc(db, 'users', u.uid), {
            uid: u.uid,
            name: u.name,
            email: u.email,
            createdAt: new Date().toISOString(),
            referralCode: 'TEST' + Math.random().toString(36).slice(2, 6).toUpperCase(),
            frozen: false,
            kycStatus: 'none',
          });
          await setDoc(doc(db, `users/${u.uid}/balances`, 'main'), { BTC: 0, USDT: 100, ETH: 0 });
        }
        setStatus('✅ Populated ' + sampleUsers.length + ' users in Firestore!');
        setUsers(sampleUsers);
      } catch (error) {
        setStatus('Error: ' + error);
      }
    };
    populate();
  }, []);

  return (
    <div className="p-8">
      <h1>Populate Firestore from Auth Users</h1>
      <p>{status}</p>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
};

export default PopulateFirestore;

