import React from "react";
import { Search } from 'lucide-react';
const Navbar = () => {
  return (
<div className="parent">
  <div className="top">
    <img
    src="https://i.pinimg.com/736x/d2/dc/e3/d2dce30ce1fa9504127a9fe850780b5d.jpg"
      alt="logo company"
      className="logo"
    />

    <div className="left">
      <a href="#">Features</a>
      <a href="#">Solutions</a>
      <a href="#">Guide</a>
      <a href="#">Templates</a>
      <a href="#">Pricing</a>
      <a href="#">Career</a>
    </div>

    <div className="right">
      <div className="search-box">
        <input placeholder="Search..." />
        <Search className="search-icon" />
      </div>
      <a href="#" className="signin">Sign in</a>
    </div>
  </div>
</div>

  );
};

export default Navbar;
