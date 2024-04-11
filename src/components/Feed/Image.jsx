import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { HeartIcon } from '@heroicons/react/solid';
import { updateLikes } from '../../services/firebase';
import useUser from '../../hooks/use-user';

function Image({ src, caption, id, toggledLiked, setToggledLiked, likes, setLikes }) {
  const [visible, setVisible] = useState(false);
  const {
    user: { userId }
  } = useUser();
  const handleLikeAnimation = async (event) => {
    setVisible(true);
    !toggledLiked && setLikes(likes + 1);
    setToggledLiked(true);
    setTimeout(() => setVisible(false), 500);
    await updateLikes(id, userId, false);
  };
  return (
    <div className="relative select-none" onDoubleClick={handleLikeAnimation}>
      <img src={src} alt={caption} className="object-contain w-full" />
      <HeartIcon
        className={`absolute top-1/2 bottom-1/2 mx-auto my-auto h-28 w-28 min-w-full text-white duration-200 ease-in-out ${
          visible ? 'scale-100' : 'scale-0'
        }`}
      />
    </div>
  );
}

export default Image;

Image.propTypes = {
  src: PropTypes.string.isRequired,
  caption: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  toggledLiked: PropTypes.bool.isRequired,
  setToggledLiked: PropTypes.func.isRequired,
  likes: PropTypes.number.isRequired,
  setLikes: PropTypes.func.isRequired
};
