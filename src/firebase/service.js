import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { fireStore } from './config';

export const addDocument = (collectionName, data) => {
    const { userId, roomId } = data;
    const docRef = doc(fireStore, collectionName, userId);
    getDoc(docRef)
        .then((snapshot) => {
            if (snapshot.data() && snapshot.data().list) {
                const check = snapshot.data().list.find((notice) => notice === roomId);
                if (!check) {
                    updateDoc(docRef, {
                        list: arrayUnion(roomId),
                    });
                }
            } else {
                setDoc(docRef, { list: [roomId] });
            }
        })
        .catch((err) => console.error(err));
};

export const updateDocument = (collectionName, data) => {
    const { userId, roomId } = data;
    const docRef = doc(fireStore, collectionName, userId);
    getDoc(docRef)
        .then((snapshot) => {
            if (snapshot.exists() && snapshot.data().list) {
                updateDoc(docRef, {
                    list: arrayRemove(roomId),
                });
            }
        })
        .catch((err) => console.error(err));
};
