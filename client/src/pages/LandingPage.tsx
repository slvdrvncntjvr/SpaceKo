import React, { useState, useEffect } from "react";
import "../styles/landing.css";
import spacekoLogo from "@assets/spaceko-logo.png";
import landingPageBg from "@assets/landing-page-bg.png";
import campusImage from "@assets/image 22.png";
import group34ddf from "@assets/Group 34ddf.png";
import { useLocation } from "wouter";

interface LandingPageProps {
  onSignInClick: () => void;
}

export default function LandingPage({ onSignInClick }: LandingPageProps) {
  const [, setLocation] = useLocation();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState(0);

  const totalImages = 4; // Total number of critical images

  useEffect(() => {
    // Preload critical images
    const imageUrls = [landingPageBg, spacekoLogo, campusImage, group34ddf];
    
    let loaded = 0;
    imageUrls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.src = url;
    });
  }, []);

  const handleReadyClick = () => {
    onSignInClick();
  };

  const handleSignInClick = () => {
    onSignInClick();
  };

  // Show loading screen until images are loaded
  if (!imagesLoaded) {
    return (
      <div className="landing-loading">
        <div className="landing-loading-content">
          <img src={spacekoLogo} alt="SpaceKo Logo" className="landing-loading-logo" />
          <h2 className="landing-loading-title">SpaceKo</h2>
          <div className="landing-loading-bar">
            <div 
              className="landing-loading-progress" 
              style={{ width: `${(loadedImages / totalImages) * 100}%` }}
            ></div>
          </div>
          <p className="landing-loading-text">Loading... {Math.round((loadedImages / totalImages) * 100)}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`landing-app ${imagesLoaded ? 'landing-app-loaded' : ''}`}>
      {/* Navigation Header */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          <div className="landing-logo-section">
            <img src={spacekoLogo} alt="SpaceKo Logo" className="landing-logo-image" />
            <span className="landing-logo-text">SpaceKo</span>
          </div>
          <nav className="landing-nav-menu">
            <a href="#services" className="landing-nav-link">Services</a>
            <a href="#about" className="landing-nav-link">About</a>
            <a href="#contact" className="landing-nav-link">Contact</a>
          </nav>
          <div className="landing-nav-right">
            <button className="landing-sign-in-btn" onClick={handleSignInClick}>SIGN IN</button>
          </div>
        </div>
      </header>

      {/* Landing Page Background */}
      <div className="landing-section">
        <img src={landingPageBg} alt="Landing Page Background" className="landing-bg-image" />
        
        {/* Hero Text - Hi Isko/Iska */}
        <div className="landing-hero-overlay">
          <h1 className="landing-hero-title">Hi Isko/Iska!</h1>
          <p className="landing-hero-subtitle">Ready to empower yourself with real-time space visibility?</p>
          <button className="landing-ready-btn" onClick={handleReadyClick}>READY!</button>
        </div>
        
        {/* Red Section Text - Ready to empower */}
        <div className="landing-red-text-overlay">
          <div className="landing-red-text-content">
            <h2 className="landing-red-title">Ready to empower yourself with real-time space visibility?</h2>
            <p className="landing-red-description">
              Lorem Ipsum is simply dummy text of the printing and typesetting 
              industry. Lorem Ipsum has been the industry's standard dummy text
            </p>
          </div>
        </div>
        
        {/* Overlapping Images */}
        <div className="landing-images-overlay">
          <div className="landing-image-container">
            <div className="landing-overlap-image landing-image-1"></div>
            <div className="landing-overlap-image landing-image-2"></div>
          </div>
        </div>
      </div>

      {/* White Content Section */}
      <section className="landing-white-section">
        <div className="landing-white-container">
          <div className="landing-locate-section">
            <div className="landing-locate-icon">
              <img src={spacekoLogo} alt="SpaceKo Logo" className="landing-locate-logo" />
            </div>
            <h2 className="landing-locate-title">Locate favorite spots around campus</h2>
          </div>
          
          <div className="landing-image-section">
            <img src={campusImage} alt="Campus Image" className="landing-campus-image" />
          </div>

          {/* Check what's available section - image and text side by side */}
          <div className="landing-check-container">
            <div className="landing-image-section-side">
              <img src={campusImage} alt="Campus Image" className="landing-check-campus-image" />
            </div>
            
            <div className="landing-check-content-section">
              <h2 className="landing-check-title">Check what's available</h2>
            </div>
          </div>
        </div>
      </section>

      {/* New Maroon Section */}
      <section className="landing-maroon-section">
        <div className="landing-maroon-container">
          <div className="landing-maroon-background">
            <img src={group34ddf} alt="Group 34ddf" className="landing-maroon-top-image" />
            
            <div className="landing-maroon-content">
              <div className="landing-maroon-text-section">
                <h2 className="landing-maroon-title">Be part of a growing community</h2>
                <p className="landing-maroon-description">
                  Join thousands of students discovering and sharing the best spaces on campus. 
                  Connect with your community and make the most of your university experience.
                </p>
              </div>
              
              <div className="landing-maroon-mockups">
                <div className="landing-mockup-container landing-mockup-left">
                  <div className="landing-mockup-screen">
                    <img src={campusImage} alt="Campus Overview" className="landing-mockup-bg" />
                  </div>
                </div>
                
                <div className="landing-mockup-container landing-mockup-right">
                  <div className="landing-mockup-screen">
                    <img src={campusImage} alt="Check Availability" className="landing-mockup-bg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stay on track section overlaid on background */}
            <div className="landing-track-overlay">
              <div className="landing-track-container">
                <h2 className="landing-track-title">Stay on track with SpaceKo</h2>
                <p className="landing-track-description">
                  Keep up with the latest updates and never miss out on available spaces. 
                  Get real-time notifications and stay connected with your campus community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
