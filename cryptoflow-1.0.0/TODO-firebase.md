**Firebase Integration TODO**

## Phase: Migrate localStorage DB to Firebase Firestore + Auth

### 1. Install Dependencies ✅
```
cd cryptoflow-1.0.0 ^&amp;^ npm i firebase ^&amp;^ npm i -D @types/firebase
```


### 2. Create Firebase Config ✅ [AI]
- src/lib/firebase.ts with provided config ✓
- Export app, auth, firestore ✓

### 3. Migrate userDb.ts to Firestore Hooks ✅ [AI]
- src/lib/firestore.ts: users/{uid}, subcollections ✓
- Types, batched writes ✓
- Admin helpers ✓

### 4. Firebase Auth Contexts [AI]
- New FirebaseAuthContext.tsx
- Update Login/SignUp pages
- Merge/Deprecate SessionContext

### 5. Update Components/Pages ✅
- Dashboard, Profile, Deposit, Withdraw, Admin
- Replace userDb imports → firestore hooks (Profile/Deposit complete)

### 6. Test & Migrate Data [Manual]
- `npm run dev`
- Create test user via signup
- Check Firestore console
- Migrate localStorage? (script)

### 7. Firestore Rules [Manual]
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 8. Complete 
Update TODO_PROGRESS.md
