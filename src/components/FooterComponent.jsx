import React from 'react';

const FooterComponent = () => {
  return (
    <div>
      <footer className='footer'>
        <span>
          <img
            src="src\assets\argel.jpg" // Replace with the actual URL or path to your image
            alt="Logo"
            width="30" // Adjust the width as needed
            height="30" // Adjust the height as needed
            className="d-inline-block align-middle"
            style={{ marginRight: '10px' }} // Adds some spacing between the image and text
          />
          Argel James Rebancos, UI God
        </span>
      </footer>
    </div>
  );
}

export default FooterComponent;
