import React from 'react';
import useUser from '../../hooks/use-user';
import MiniProfile from './MiniProfile';
import Suggestions from './Suggestions';

function Sidebar() {
  const {
    user: { id, username, image, fullName, userId, following }
  } = useUser();
  return (
    <div className="fixed top-20 bottom-0 overflow-y-scroll scrollbar-hide">
      <MiniProfile username={username} fullName={fullName} image={image} />
      <Suggestions userId={userId} following={following} loggedInUserDocId={id} />
    </div>
  );
}

export default Sidebar;
