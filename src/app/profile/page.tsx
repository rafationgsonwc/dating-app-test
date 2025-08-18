"use client";

import Navbar from "@/lib/components/Navbar";
import { useEffect, useState } from "react";
import AuthGuard from "../../lib/components/AuthGuard";
import { useAppContext } from "@/lib/context/useAppContext";
import Swal from "sweetalert2";
import { calculateAge } from "../../lib/utils/utils";
import { getTrackBackground, Range } from "react-range";

export default function Profile() {
  const [user, setUser] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { user: authUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [ageRange, setAgeRange] = useState([18, 30]);
  const [distance, setDistance] = useState([20]);
  const [formData, setFormData] = useState<any>({
    name: "",
    aboutMe: "",
    profilePictureFile: null,
    previewProfilePicture: null,
    birthdate: "",
    gender: "",
    lat: null,
    lng: null,
    minAge: 18,
    maxAge: 30,
    distance: 20,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const MIN = 0;
  const MAX = 120;

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    window.location.href = "/";
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev: any) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      },
      (error) => {
        console.error(error);
        alert("Unable to fetch location");
      }
    );
  };

  useEffect(() => {
    if (isEditing) {
      getLocation();
    }
  }, [isEditing]);

  const onSubmit = async () => {
    setIsEditing(false);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("aboutMe", formData.aboutMe);
    formDataToSend.append("birthdate", formData.birthdate);
    formDataToSend.append("profilePicture", formData.profilePictureFile);
    formDataToSend.append("userId", authUser.id);

    // BUG FIX: Gender not appended to the form data that is sent to the API
    formDataToSend.append("gender", formData.gender);

    //   Add user's current location for tagging
    formDataToSend.append("latitude", formData.latitude);
    formDataToSend.append("longitude", formData.longitude);

    //   Add user's preferred min and max age for matches
    formDataToSend.append("minAge", formData.minAge);
    formDataToSend.append("maxAge", formData.maxAge);

    //   Add user's preferred distance for matches
    formDataToSend.append("distance", formData.distance);
    Swal.showLoading();

    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        body: formDataToSend,
      });
      Swal.close();
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      Swal.fire({
        title: "Success",
        text: "Profile updated successfully",
        icon: "success",
      }).then(() => {
        // Refresh the page
        window.location.reload();
      });
    } catch (error) {
      console.error(error);
      setIsEditing(false);
      Swal.fire({
        title: "Error",
        text: "Failed to update profile",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!authUser) return;
      setLoading(true);
      const user = await fetch(`/api/get-user?userId=${authUser.id}`);
      const userData = await user.json();
      console.log(userData);
      setUser(userData);
      setFormData({
        name: userData.name,
        aboutMe: userData.aboutMe,
        birthdate: userData.birthdate?.seconds
          ? new Date(userData.birthdate.seconds * 1000)
              .toISOString()
              .split("T")[0]
          : "",
        gender: userData.gender,
        minAge: userData.minAge || 18,
        maxAge: userData.maxAge || 30,
        distance: userData.distance || 20,
      });
      setAgeRange([userData.minAge || 18, userData.maxAge || 30]);
      setDistance([userData.distance || 20]);
      setLoading(false);
    };
    fetchUser();
  }, [authUser]);

  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      minAge: ageRange[0],
      maxAge: ageRange[1],
    }));
  }, [ageRange]);

  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      distance: distance[0],
    }));
  }, [distance]);

  return (
    <>
      <AuthGuard />
      <div className="main-container">
        <Navbar />
        <h1>Profile</h1>
        {loading ? (
          <div className="profile-container">
            <div
              className="gradient-loading"
              style={{
                width: "100%",
                height: "100%",
              }}
            ></div>
          </div>
        ) : (
          <div className="profile-container">
            <div className="profile-header">
              {showSettings && (
                <ProfileSettings
                  user={user}
                  setShowSettings={setShowSettings}
                />
              )}
              {!isEditing ? (
                <div
                  className="dropdown"
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    maxWidth: "100px",
                  }}
                >
                  <button
                    className="btn bg-gradient-secondary"
                    type="button"
                    id="dropdownMenuButton"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <i
                      className="la la-ellipsis-v"
                      style={{ fontSize: "20px", color: "#fff" }}
                    ></i>
                  </button>
                  <div
                    className={`dropdown-menu dropdown-menu-end ${
                      showDropdown ? "show" : ""
                    }`}
                    style={{ minWidth: "100px" }}
                  >
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={() => {
                        setShowDropdown(false);
                        setIsEditing(true);
                      }}
                    >
                      Edit Profile
                    </a>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowSettings(true);
                      }}
                    >
                      Settings
                    </a>
                    <a
                      className="dropdown-item"
                      href="#"
                      style={{ color: "#ff3333" }}
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                    >
                      Logout
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  {/* Cancel */}
                  <button
                    className="btn btn-default"
                    style={{ backgroundColor: "#fff" }}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name,
                        aboutMe: user.aboutMe,
                        birthdate: user.birthdate?.seconds
                          ? new Date(user.birthdate.seconds * 1000)
                              .toISOString()
                              .split("T")[0]
                          : "",
                        profilePictureFile: null,
                        gender: user.gender,
                        previewProfilePicture: null,
                      });
                    }}
                  >
                    <i
                      className="la la-times"
                      style={{ fontSize: "20px", color: "#5e72e4" }}
                    ></i>
                  </button>
                  {/* Save changes */}
                  <button
                    className="btn btn-default"
                    style={{ backgroundColor: "#fff" }}
                    onClick={onSubmit}
                  >
                    <i
                      className="la la-check"
                      style={{ fontSize: "20px", color: "#5e72e4" }}
                    ></i>
                  </button>
                </div>
              )}
              <img
                id="profile-preview"
                src={
                  formData.previewProfilePicture || user.profilePicture || null
                }
                alt={user.name}
                className="profile-header-image"
              />
              {isEditing && (
                <div>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Allow only 5mb max
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File size must be less than 5MB");
                          return;
                        }
                        setFormData({
                          ...formData,
                          profilePictureFile: file,
                          previewProfilePicture: URL.createObjectURL(file),
                        });
                      }
                    }}
                  />
                </div>
              )}
              {isEditing ? (
                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: "200px" }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              ) : (
                <h1>{user.name}</h1>
              )}
            </div>
            <div className="profile-body">
              <h4 style={{ margin: "24px 0" }}>Personal Details</h4>
              <h6>Birthdate</h6>
              {isEditing ? (
                <input
                  type="date"
                  className="form-control"
                  max={new Date().toISOString().split("T")[0]}
                  style={{ maxWidth: "200px" }}
                  value={formData.birthdate}
                  onChange={(e) => {
                    const age = calculateAge(e.target.value);
                    if (age < 18) {
                      alert("You must be at least 18 years old");
                      return;
                    }
                    setFormData({ ...formData, birthdate: e.target.value });
                  }}
                />
              ) : (
                <p>
                  {user.birthdate?.seconds
                    ? new Date(
                        user.birthdate.seconds * 1000
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              )}
              <h6>About me</h6>
              {isEditing ? (
                <textarea
                  value={formData.aboutMe}
                  className="form-control"
                  onChange={(e) =>
                    setFormData({ ...formData, aboutMe: e.target.value })
                  }
                />
              ) : (
                <p>{user.aboutMe}</p>
              )}
              <h6>Gender</h6>
              {isEditing ? (
                <select
                  className="form-control"
                  style={{ maxWidth: "200px" }}
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              ) : (
                <p style={{ textTransform: "capitalize" }}>{user.gender}</p>
              )}
              <h4 style={{ margin: "24px 0" }}>Dating Preferences</h4>
              <h6>Age Range</h6>
              {isEditing ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    margin: "24px 0 30px 0",
                    padding: "0 16px",
                  }}
                >
                  <Range
                    step={1}
                    min={18}
                    max={100}
                    values={ageRange}
                    onChange={(values) => setAgeRange(values)}
                    renderTrack={({ props, children }) => (
                      <div
                        onMouseDown={props.onMouseDown}
                        onTouchStart={props.onTouchStart}
                        style={{
                          ...props.style,
                          height: "36px",
                          display: "flex",
                          width: "60%",
                        }}
                      >
                        <div
                          ref={props.ref}
                          style={{
                            height: "8px",
                            width: "100%",
                            borderRadius: "4px",
                            background: getTrackBackground({
                              values: ageRange,
                              colors: ["#ccc", "#007bff", "#ccc"],
                              min: 18,
                              max: 100,
                            }),
                            alignSelf: "center",
                          }}
                        >
                          {children}
                        </div>
                      </div>
                    )}
                    renderThumb={({ props, index }) => (
                        <div
                        {...props}
                        style={{
                          ...props.style,
                          height: "24px",
                          width: "24px",
                          backgroundColor: "#FFF",
                          borderRadius: "50%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          boxShadow: "0px 2px 6px #AAA",
                          border: "1px solid #DDD",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-28px",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "14px",
                            padding: "4px",
                            borderRadius: "4px",
                            backgroundColor: "#007bff",
                          }}
                        >
                          {ageRange[index]}
                        </div>
                      </div>
                    )}
                  />
                </div>
              ) : (
                <p>
                  Between {ageRange[0]} and {ageRange[1]}
                </p>
              )}
              <h6>Location</h6>
              {isEditing ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    margin: "24px 0 30px 0",
                    padding: "0 16px",
                  }}
                >
                  <Range
                    step={1}
                    min={MIN}
                    max={MAX}
                    values={distance}
                    onChange={(values) => setDistance(values)}
                    renderTrack={({ props, children }) => (
                      <div
                        onMouseDown={props.onMouseDown}
                        onTouchStart={props.onTouchStart}
                        style={{
                          ...props.style,
                          height: "36px",
                          display: "flex",
                          width: "60%",
                        }}
                      >
                        <div
                          ref={props.ref}
                          style={{
                            height: "8px",
                            width: "100%",
                            borderRadius: "4px",
                            // 2. The background shows the filled and unfilled parts of the track
                            background: getTrackBackground({
                              values: distance,
                              colors: ["#007bff", "#ccc"],
                              min: MIN,
                              max: MAX,
                            }),
                            alignSelf: "center",
                          }}
                        >
                          {children}
                        </div>
                      </div>
                    )}
                    renderThumb={({ props }) => (
                      <div
                        {...props}
                        style={{
                          ...props.style,
                          height: "24px",
                          width: "24px",
                          backgroundColor: "#FFF",
                          borderRadius: "50%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          boxShadow: "0px 2px 6px #AAA",
                          border: "1px solid #DDD",
                        }}
                      >
                        {/* 3. The label now shows the single value */}
                        <div
                          style={{
                            position: "absolute",
                            top: "-28px",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "14px",
                            padding: "4px",
                            borderRadius: "4px",
                            backgroundColor: "#007bff",
                          }}
                        >
                          {distance[0]}km
                        </div>
                      </div>
                    )}
                  />
                </div>
              ) : (
                <p>Up to {distance[0]} kilometer/s away</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ProfileSettings({
  user,
  setShowSettings,
}: {
  user: any;
  setShowSettings: (show: boolean) => void;
}) {
  const [ageRange, setAgeRange] = useState([18, 100]);
  const [showMe, setShowMe] = useState("everyone");

  useEffect(() => {
    setShowMe(user.showMe);
  }, [user]);

  const onSubmit = async () => {
    setShowSettings(false);

    try {
      Swal.showLoading();
      const response = await fetch("/api/update-settings", {
        method: "POST",
        body: JSON.stringify({ showMe, userId: user.id }),
      });
      Swal.close();
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      Swal.fire({
        title: "Success",
        text: "Settings updated successfully",
        icon: "success",
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "Failed to update settings",
      });
    }
  };

  return (
    <div className="modal-profile-settings">
      <div className="modal-profile-settings-content">
        <h1>Settings</h1>
        {/* Close button */}
        <button
          className="btn btn-default"
          style={{
            backgroundColor: "#fff",
            position: "absolute",
            top: "10px",
            right: "10px",
          }}
          onClick={() => setShowSettings(false)}
        >
          <i
            className="la la-times"
            style={{ fontSize: "20px", color: "#5e72e4" }}
          ></i>
        </button>
        <div className="line-divider"></div>
        <div className="settings-group">
          <h6>Show me</h6>
          <select
            className="form-control"
            style={{ maxWidth: "200px" }}
            value={showMe}
            onChange={(e) => setShowMe(e.target.value)}
          >
            <option value="everyone">Everyone</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </div>
        {/* TODO: Add age range */}
        {/* <div className="settings-group">
                    <h6>Age range</h6>
                    <div className="form-group">
                    </div>
                </div> */}
        <button className="btn btn-primary" onClick={onSubmit}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
