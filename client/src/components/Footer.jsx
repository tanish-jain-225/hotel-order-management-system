import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto flex flex-col items-center text-center">
        {/* Website Name & Year */}
        <p className="text-lg font-semibold">
          <span className="text-blue-400">HotelMenu</span> &copy;{" "}
          {new Date().getFullYear()}
        </p>
        <p className="text-gray-100 capitalize">
          Delicious food at your fingertips.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
