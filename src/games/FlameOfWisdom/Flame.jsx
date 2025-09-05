import React from 'react';

const Flame = (props) => {
  const containerStyle = {
    width: props.size || 100,
    height: props.size || 100,
    position: 'relative', // To position text absolutely within this container
    cursor: 'pointer',
    margin: '20px auto',
    display: 'flex', // To help center text if needed, or remove if img covers all
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'width 0.3s ease-out, height 0.3s ease-out', // Smooth size transition
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // Or 'cover', depending on desired look
  };

  const textOverlayStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: 'white', // Adjust color for visibility against the new flame
    textShadow: '0 0 3px black, 0 0 3px black', // Enhance visibility
    fontSize: Math.max(10, (props.size || 100) / 8) + 'px', // Dynamic font size
    pointerEvents: 'none', // So text doesn't interfere with clicks on the container
  };

  return (
    <div 
      onClick={props.onClick} 
      style={containerStyle} 
      role="button" 
      tabIndex={0} 
      aria-label={`Flame, level ${props.level || 1}, size ${Math.round(props.size || 100)}`}
    >
      <img 
        src="/assets/mystical-flame.webp" 
        alt={`Mystical Flame level ${props.level || 1}`} 
        style={imageStyle} 
        loading="lazy"
      />
      <div style={textOverlayStyle}>
        {/* Text removed as per user request */}
      </div>
    </div>
  );
};

export default Flame;