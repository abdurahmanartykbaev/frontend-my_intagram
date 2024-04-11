import React from 'react';
import usePhotos from '../../hooks/use-photos';
import Suggestions from '../Sidebar/Suggestions';
import useUser from '../../hooks/use-user';
import Post from './Post';
import Loader from './Loader';

function Feed() {
  const {
    user: { id, userId, following }
  } = useUser();
  const { photos } = usePhotos({ userId });
  return !photos ? (
    <Loader />
  ) : photos?.length > 0 ? (
    <>
      {photos.map((content) => (
        <div className="" key={content.id}>
          <Post key={content.id} content={content} />
        </div>
      ))}
    </>
  ) : (
    <>
      <div className="my-4 flex h-[25vh] flex-col items-center justify-center space-y-4 text-center ">
        <p className="text-3xl font-bold">You don't have friends!</p>
      </div>
      <div className="mr-4 -mt-4 md:hidden">
        <Suggestions userId={userId} following={following} loggedInUserDocId={id} />
      </div>
    </>
  );
}

export default Feed;
