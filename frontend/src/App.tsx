import { useState } from "react";
import RandomNumber from "./components/randomNumber";
import ExecuteButton from "./components/lotteryButton";
import { NUMBERS } from "./constants/number";

function App() {
  const [number, setNumber] = useState(1);

  const handleClick = () => {
    const randomIndex = Math.floor(Math.random() * NUMBERS.length);
    setNumber(NUMBERS[randomIndex]);
  };

  return (
    <div>
      <h1>ランダム数字</h1>

      <RandomNumber number={number} />

      <ExecuteButton onClick={handleClick} />
    </div>
  );
}

export default App;