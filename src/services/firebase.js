import { firebaseApp } from '../lib/firebase';
import { deleteObject, getStorage, uploadBytesResumable } from 'firebase/storage';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { getAuth, updateProfile } from 'firebase/auth';

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const auth = getAuth();

export async function doesUsernameExist(username) {
  const usersRef = collection(db, 'users');
  const result = query(usersRef, where('username', '==', username));
  const getResult = await getDocs(result);
  const returnResult = getResult.docs.map((user) => user.data().length > 0);
  return returnResult;
}

export async function getUserByUsername(username) {
  const usersRef = collection(db, 'users');
  const result = query(usersRef, where('username', '==', username));
  const getResult = await getDocs(result);
  const returnResult = getResult.docs.map((user) => ({
    ...user.data(),
    id: user.id
  }));
  return returnResult;
}

export async function getUserByUserId(userId) {
  const usersRef = collection(db, 'users');
  const result = query(usersRef, where('userId', '==', userId));
  const getResult = await getDocs(result);
  const userResult = getResult.docs.map((user) => ({
    ...user.data(),
    id: user.id
  }));
  return userResult;
}

export async function getSuggestedProfiles(userId, following) {
  const usersRef = collection(db, 'users');
  const result = query(usersRef, limit(10));
  const getResult = await getDocs(result);
  const userResult = getResult.docs
    .map((user) => ({
      ...user.data(),
      id: user.id
    }))
    .filter((profile) => profile.userId !== userId && !following.includes(profile.userId));
  return userResult;
}

export async function updateLoggedInUserFollowing(
  loggedInUserDocId,
  profileId,
  isFollowingProfile
) {
  const usersRef = doc(db, 'users', loggedInUserDocId);
  await updateDoc(usersRef, {
    following: isFollowingProfile ? arrayRemove(profileId) : arrayUnion(profileId)
  });
}

export async function updateFollowedUserFollowers(
  profileDocId,
  loggedInUserDocId,
  isFollowingProfile
) {
  const usersRef = doc(db, 'users', profileDocId);
  await updateDoc(usersRef, {
    followers: isFollowingProfile ? arrayRemove(loggedInUserDocId) : arrayUnion(loggedInUserDocId)
  });
}

export async function getPhotos(userId, following) {
  const photosRef = collection(db, 'photos');
  const result = query(photosRef, where('userId', 'in', following));
  const getResult = await getDocs(result);
  const userFollowedPhotos = getResult.docs.map((photo) => ({
    ...photo.data(),
    id: photo.id
  }));
  const photoWithUserDetails = await Promise.all(
    userFollowedPhotos.map(async (photo) => {
      let userLikedPhoto = false;
      photo.likes?.map((res) => {
        if (res === userId) {
          userLikedPhoto = true;
        }
      });
      return { ...photo, userLikedPhoto };
    })
  );
  return photoWithUserDetails;
}

export async function updateLikes(id, userId, toggledLiked) {
  const photosRef = doc(db, 'photos', id);
  await updateDoc(photosRef, {
    likes: toggledLiked ? arrayRemove(userId) : arrayUnion(userId)
  });
}

export async function addPostsAndVideosToFirestore(userId, username, image, caption, selectedFile, isVideo) {
  const postRef = await addDoc(collection(db, 'photos'), {
    caption: caption,
    likes: [],
    username: username,
    userId: userId,
    userImage: image,
    timestamp: serverTimestamp()
  });

  const fileRef = ref(storage, `posts/${postRef.id}/${isVideo ? 'video' : 'image'}`);
  await uploadString(fileRef, selectedFile, 'data_url').then(async () => {
    const downloadUrl = await getDownloadURL(fileRef);
    const photoRef = doc(db, 'photos', postRef.id);
    await updateDoc(photoRef, {
      [isVideo ? 'videoSrc' : 'imageSrc']: downloadUrl
    });
  });
}
export async function addComment(id, commentToSend, username, image) {
  const commentsRef = collection(db, 'photos', id, 'comments');
  await addDoc(commentsRef, {
    comment: commentToSend,
    username: username,
    userImage: image,
    likes: [],
    timestamp: serverTimestamp()
  });
}

export function displayComment(id) {
  const commentsRef = collection(db, 'photos', id, 'comments');
  return query(commentsRef, orderBy('timestamp', 'desc'));
}

export async function getLikedUsers(id) {
  const photosRef = doc(db, 'photos', id);
  const getResult = await getDoc(photosRef);
  const likesUserIds = getResult.data().likes;
  const data = likesUserIds.map(async (userId) => {
    const user = await getUserByUserId(userId);
    return user;
  });
  const result = await Promise.all(data);
  return result;
}

export async function getPhotosByUsername(username) {
  const [user] = await getUserByUsername(username);
  const photosRef = collection(db, 'photos');
  const result = query(photosRef, where('userId', '==', user.userId), orderBy('timestamp', 'desc'));
  const getResult = await getDocs(result);
  const photos = getResult.docs.map((photo) => ({
    ...photo.data(),
    id: photo.id
  }));
  return photos;
}

export async function isUserFollowingProfile(loggedInUserUsername, profileUserUserId) {
  const userRef = collection(db, 'users');
  const result = query(
    userRef,
    where('username', '==', loggedInUserUsername),
    where('following', 'array-contains', profileUserUserId)
  );
  const getResult = await getDocs(result);
  const [response = {}] = getResult.docs.map((res) => ({
    ...res.data(),
    id: res.id
  }));
  return response.userId;
}

export async function toggleFollow(
  isFollowingProfile,
  activeUserDocId,
  profileDocId,
  profileUserUserId,
  activeUserUserId
) {
  await updateLoggedInUserFollowing(activeUserDocId, profileUserUserId, isFollowingProfile);
  await updateFollowedUserFollowers(profileDocId, activeUserUserId, isFollowingProfile);
}

export async function updateUserDetails(
  id,
  userId,
  username,
  fullName,
  bio,
  edituserName,
  editfullName,
  editBio,
  selectedFile
) {
  const imageRef = ref(storage, `users/${userId}/image`);
  const userRef = doc(db, 'users', id);
  if (selectedFile) {
    await uploadString(imageRef, selectedFile, 'data_url').then(async () => {
      const downloadUrl = await getDownloadURL(imageRef);
      await updateDoc(userRef, {
        username: edituserName ? edituserName : username,
        fullName: editfullName ? editfullName : fullName,
        image: downloadUrl,
        bio: editBio ? editBio : bio
      });
    });
  } else {
    await updateDoc(userRef, {
      username: edituserName ? edituserName : username,
      fullName: editfullName ? editfullName : fullName,
      bio: editBio ? editBio : bio,

    });
  }
}

export async function updateUserAuthDetails(username, edituserName) {
  updateProfile(auth.currentUser, {
    displayName: edituserName ? edituserName : username
  }).then(() => {
    console.log(auth.currentUser);
  });
}

export async function getFollowers(id) {
  const usersRef = doc(db, 'users', id);
  const getResult = await getDoc(usersRef);
  const followersId = getResult.data().followers;
  const data = followersId.map(async (userId) => {
    const user = await getUserByUserId(userId);
    return user;
  });
  const result = await Promise.all(data);
  return result;
}

export async function getFollowing(id) {
  const usersRef = doc(db, 'users', id);
  const getResult = await getDoc(usersRef);
  const followingUsersId = getResult.data().following;
  const data = followingUsersId.map(async (userId) => {
    const user = await getUserByUserId(userId);
    return user;
  });
  const result = await Promise.all(data);
  return result;
}

export async function getCommentsLength(id) {
  const commentRef = collection(db, 'photos', id, 'comments');
  const result = query(commentRef, where('username', '!=', ''));
  const getResult = await getDocs(result);
  return getResult.size;
}

export async function deletePost(photoId) {
  await deleteDoc(doc(db, 'photos', photoId));
  const imageRef = ref(storage, `posts/${photoId}/image`);
  await deleteObject(imageRef).then(() => {
    console.log('Deleted');
  });
}

export async function activeUserLatestPost(userId, activeUserId) {
  const photoRef = collection(db, 'photos');
  const result = query(photoRef, where('userId', '==', activeUserId), orderBy('timestamp', 'desc'));
  const getResult = await getDocs(result);
  const activeUserPhotos = getResult.docs.map((photo) => ({
    ...photo.data(),
    id: photo.id
  }));
  const latestPhoto = activeUserPhotos[0];
  let userLikedPhoto = false;
  latestPhoto?.likes?.map((res) => {
    if (res === userId) {
      userLikedPhoto = true;
    }
  });
  return latestPhoto ? { ...latestPhoto, userLikedPhoto } : null;
}

export async function likeComment(photoId, commentId, userId, toggledLiked) {
  const commentRef = doc(db, 'photos', photoId, 'comments', commentId);
  await updateDoc(commentRef, {
    likes: toggledLiked ? arrayRemove(userId) : arrayUnion(userId)
  });
}

export async function isCommentLiked(photoId, commentId, userId) {
  const commentRef = doc(db, 'photos', photoId, 'comments', commentId);
  const getResult = await getDoc(commentRef);
  const comment = getResult.data().likes;
  if (comment.includes(userId)) return true;
  return false;
}

export async function getCommentLikedUsers(photoId, commentId) {
  const commentRef = doc(db, 'photos', photoId, 'comments', commentId);
  const getResult = await getDoc(commentRef);
  const likesUserIds = getResult.data().likes;
  const data = likesUserIds.map(async (userId) => {
    const user = await getUserByUserId(userId);
    return user;
  });
  const result = await Promise.all(data);
  return result;
}

export async function updateUserPostDetails(username, edituserName, selectedFile) {
  const photosRef = collection(db, 'photos');
  const result = query(photosRef, where('username', '==', username));
  const getResult = await getDocs(result);
  getResult.forEach(async (res) => {
    const photoRef = doc(photosRef, res.id);
    const imageRef = ref(storage, `posts/${res.id}/user/image`);
    if (selectedFile) {
      await uploadString(imageRef, selectedFile, 'data_url').then(async () => {
        const downloadUrl = await getDownloadURL(imageRef);
        await updateDoc(photoRef, {
          username: edituserName ? edituserName : username,
          userImage: downloadUrl
        });
      });
    } else {
      await updateDoc(photoRef, {
        username: edituserName ? edituserName : username
      });
    }
  });
}

export async function updateUserCommentsDetails(username, edituserName, selectedFile) {
  const photosRef = collection(db, 'photos');
  const result = query(photosRef, where('username', '!=', ''));
  const getResult = await getDocs(result);
  getResult.forEach(async (res) => {
    const commentsRef = collection(photosRef, res.id, 'comments');
    const response = query(commentsRef, where('username', '==', username));
    const getResponse = await getDocs(response);
    getResponse.forEach(async (resp) => {
      console.log('changing');
      const commentRef = doc(commentsRef, resp.id);
      const commRef = ref(storage, `posts/${res.id}/comments/${resp.id}/user/image`);
      if (selectedFile) {
        await uploadString(commRef, selectedFile, 'data_url').then(async () => {
          const downloadUrl = await getDownloadURL(commRef);
          await updateDoc(commentRef, {
            username: edituserName ? edituserName : username,
            userImage: downloadUrl
          });
        });
      } else {
        await updateDoc(commentRef, {
          username: edituserName ? edituserName : username
        });
        console.log('changed');
      }
    });
  });
}

export async function getAllUsers() {
  const usersRef = collection(db, 'users');
  const getResult = await getDocs(usersRef);
  const users = getResult.docs.map((user) => ({
    ...user.data(),
    id: user.id
  }));
  return users;
}

export async function getPhoto(photoId, userId) {
  const photoRef = doc(db, 'photos', photoId);
  const result = await getDoc(photoRef);
  let userLikedPhoto = false;
  result.data().likes?.map((res) => {
    if (res === userId) {
      userLikedPhoto = true;
    }
  });
  return { ...result.data(), userLikedPhoto };
}
