import React from 'react';

const HeaderComponent = () => {
  return (
    <div>
      <header>
        <nav className='navbar navbar-white bg-white justify-content-center'>
          <a className='navbar-brand' href="http://localhost:3000/flights">
            <img
              src="src/assets/caas.png"
              width="auto"
              height="auto" 
              className="d-inline-block align-top"
              alt="CAAS Logo"
            />
          </a>
        </nav>
      </header>
    </div>
  );
}

export default HeaderComponent;
