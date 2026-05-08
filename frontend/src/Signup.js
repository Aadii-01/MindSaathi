import React, { useState } from "react";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    contact: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    alert("Frontend UI Ready (Backend Later)");
  };

  return (
    <div className="page">
      {/* Logo */}
      <div className="logo-box">स</div>

      <h1 className="main-title">Create Participant Account</h1>
      <p className="subtitle">
        Already have an account? <span>Sign in here</span>
      </p>

      <form className="form-card" onSubmit={handleSubmit}>
        {/* Basic Info Section */}
        <div className="section">
          <h3 className="section-title">Basic Information</h3>
          <div className="divider"></div>

          <label>Email address</label>
          <input
            type="email"
            name="email"
            onChange={handleChange}
          />

          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            onChange={handleChange}
          />

          <label>Contact Number</label>
          <input
            type="text"
            name="contact"
            onChange={handleChange}
          />

          <label>Age</label>
          <input
            type="number"
            name="age"
            onChange={handleChange}
          />
        </div>

        {/* Security Section */}
        <div className="section">
          <h3 className="section-title">Security</h3>
          <div className="divider"></div>

          <div className="password-row">
            <div className="password-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
              />
            </div>

            <div className="password-field">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <button className="submit-btn" type="submit">
          Create Account
        </button>
      </form>
    </div>
  );
}

export default Signup;