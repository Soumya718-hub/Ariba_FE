import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { login } from "./api/auth";

export default function AutoLogin() {
  const [authReady, setAuthReady] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const hasProcessedLogin = useRef(false); // Track if login has been processed

  const navigate = useNavigate();

  // Effect for handling SSO messages
  useEffect(() => {
    const allowedOrigin = import.meta.env.VITE_MYAHANA_BASE_URL;

    const handleMessage = (event) => {
      console.log("Received message:", event);

      // Strict origin check
      if (event.origin !== allowedOrigin) return;

      if (event.data?.type === "TOKEN") {
        const { token, email, emp_id, userid } = event.data;

        // DON'T auto-redirect here, just store the data
        if (token) {
          localStorage.setItem("sso_token", token);
          localStorage.setItem("myahana_token", token);
        }
        if (email) localStorage.setItem("email", email);
        if (emp_id) localStorage.setItem("emp_id", emp_id);
        if (userid) localStorage.setItem("myahana_userid", userid);

        setUserData({
          token: token || localStorage.getItem("sso_token"),
          email: email || localStorage.getItem("email"),
          emp_id: emp_id || localStorage.getItem("emp_id"),
        });

        setAuthReady(true);
        // message.success("SSO authentication successful! Click Enter Portal to continue.");
      }
    };

    // Check if already logged in on component mount - but DON'T auto-redirect
    const checkExistingSession = () => {
      const existingToken = localStorage.getItem("token");
      const existingRole = localStorage.getItem("role");

      if (existingToken && existingRole && !hasProcessedLogin.current) {
        // Don't auto-redirect, just set authReady to true
        setUserData({
          token: existingToken,
          email: localStorage.getItem("email"),
          emp_id: localStorage.getItem("emp_id"),
        });
        setAuthReady(true);
        // message.info("You have an existing session. Click Enter Portal to continue.");
        return true;
      }
      return false;
    };

    // Attach listener
    window.addEventListener("message", handleMessage);

    // Check existing session without auto-redirect
    checkExistingSession();

    // Request token from parent
    const requestToken = () => {
      if (window.parent) {
        window.parent.postMessage({ type: "REQUEST_TOKEN" }, allowedOrigin);
      }
    };

    requestToken();

    // Retry mechanism - but DON'T auto-login
    let retryCount = 0;
    const retryInterval = setInterval(() => {
      retryCount++;
      // Stop retrying after 10 attempts or if we have a token
      if (retryCount > 10) {
        clearInterval(retryInterval);
        return;
      }
      if (
        !localStorage.getItem("sso_token") &&
        !localStorage.getItem("token")
      ) {
        console.log("Retrying token request...");
        requestToken();
      } else if (localStorage.getItem("sso_token") && !authReady) {
        setAuthReady(true);
        clearInterval(retryInterval);
      } else {
        clearInterval(retryInterval);
      }
    }, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(retryInterval);
    };
  }, [authReady]);

  const handleEnterPortal = async () => {
    // Prevent multiple login attempts
    if (hasProcessedLogin.current || loginLoading) {
      return;
    }

    // Check if already logged in
    const existingToken = localStorage.getItem("token");
    const existingRole = localStorage.getItem("role");

    if (existingToken && existingRole) {
      hasProcessedLogin.current = true;
      // Already logged in, just redirect
      if (existingRole === "SUPERADMIN") {
        navigate("/superadmin/dashboard");
      } else if (existingRole === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
      return;
    }

    // Get the SSO token from Myahana
    const ssoToken =
      userData?.token ||
      localStorage.getItem("myahana_token") ||
      localStorage.getItem("sso_token");

    if (!ssoToken) {
      message.warning("Please login through Myahana first");
      return;
    }

    if (!userData?.email && !userData?.emp_id) {
      message.error(
        "Missing user information. Please re-login through Myahana.",
      );
      return;
    }

    setLoginLoading(true);
    try {
      // Send ONLY the token in headers
      const response = await login(null, ssoToken);

      if (response && response.status === "success") {
        // Mark that we've processed login
        hasProcessedLogin.current = true;

        // Save all auth data to localStorage
        localStorage.setItem("token", response.token);
        localStorage.setItem(
          "user",
          JSON.stringify(response.result?.[0] || response.data),
        );
        localStorage.setItem(
          "emp_id",
          response.result?.[0]?.emp_id || response.data?.emp_id,
        );
        localStorage.setItem(
          "user_email",
          response.result?.[0]?.emp_email ||
            response.data?.email ||
            userData.email,
        );

        // Handle roles
        const roles = Array.isArray(response.roles)
          ? response.roles
          : response.role
            ? [response.role]
            : ["USER"];
        const role = roles[0]?.toUpperCase() || "USER";
        localStorage.setItem("role", role);
        localStorage.setItem("user_role", role);

        // Store login timestamp
        localStorage.setItem("last_login", new Date().toISOString());

        message.success(
          `Welcome ${response.result?.[0]?.emp_name || "User"} to Ariba Logbook!`,
        );

        // Navigate based on role
        if (role === "SUPERADMIN") {
          navigate("/superadmin/dashboard");
        } else if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      } else {
        message.error(response?.message || "Login failed. Please try again.");
        setAuthReady(false);
      }
    } catch (error) {
      console.error("Login error details:", error);
      message.error(
        error.response?.data?.message ||
          "Auto login failed. Please try manual login.",
      );
      setAuthReady(false);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          textAlign: "center",
          width: "100%",
          maxWidth: "500px",
          background: "white",
          borderRadius: "20px",
          padding: "40px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            width: "70px",
            height: "70px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "32px",
          }}
        >
          📞
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#1a1a2e",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
          }}
        >
          Ariba Logbook
        </h1>

        {/* Description - 2 lines about call tracking */}
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "16px",
              color: "#4a5568",
              margin: "0 0 8px",
              lineHeight: "1.5",
            }}
          >
            A comprehensive call tracking system for logging, monitoring, and
            managing all customer interactions.
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#718096",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            Track calls, record outcomes, and maintain complete communication
            history in one place.
          </p>
        </div>

        {/* CTA Button */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {authReady ? (
            <button
              onClick={handleEnterPortal}
              disabled={loginLoading || hasProcessedLogin.current}
              style={{
                width: "100%",
                padding: "14px 32px",
                borderRadius: "12px",
                border: "none",
                background:
                  loginLoading || hasProcessedLogin.current
                    ? "#a0aec0"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontWeight: 600,
                fontSize: "16px",
                cursor:
                  loginLoading || hasProcessedLogin.current
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  loginLoading || hasProcessedLogin.current
                    ? "none"
                    : "0 4px 12px rgba(102, 126, 234, 0.4)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!loginLoading && !hasProcessedLogin.current)
                  e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loginLoading ? (
                <>
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Logging in...
                </>
              ) : hasProcessedLogin.current ? (
                "Redirecting..."
              ) : (
                <>Enter Portal →</>
              )}
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#f7fafc",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid #667eea",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    color: "#4a5568",
                    fontWeight: 500,
                  }}
                >
                  Waiting for Myahana session…
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                Please login to Myahana first, then click Enter Portal
              </p>
            </div>
          )}

          {/* User info if authenticated */}
          {userData?.email && !hasProcessedLogin.current && (
            <div
              style={{ fontSize: "12px", color: "#718096", marginTop: "12px" }}
            >
              Authenticated as: {userData.email}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
