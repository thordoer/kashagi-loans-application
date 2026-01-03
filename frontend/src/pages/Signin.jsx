import Login from "../assets/Login";

function Signin({ sendDetails, client, setpin, setnumber }) {
  return (
    <div>
      <Login
        client={client}
        setnumber={setnumber}
        setpin={setpin}
        sendDetails={sendDetails}
      />
    </div>
  );
}

export default Signin;
