import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const PlinkoGame = () => {
  const canvasRef = useRef(null);
  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const [isDropping, setIsDropping] = useState(false);
  const [pegs, setPegs] = useState([]);
  const [mathQuestion, setMathQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerStatus, setAnswerStatus] = useState("");
  const [balance, setBalance] = useState(100); // Initial balance set to $100
  const [ballDropped, setBallDropped] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);
  const [ballOnGround, setBallOnGround] = useState(false);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(null); // Store the bucket index

  const bucketValues = [1000, 500, 250, 100, 50, 10];
  const bucketMultipliers = [2.1, 1.25, 1.5, 1.5, 1.25, 2.1]; // Updated multipliers for each bucket

  const createPegs = () => {
    const pegRadius = 5;
    const numRows = 16;
    const pegSpacing = 60;
    const boardWidth = canvasRef.current.width;
    const boardHeight = canvasRef.current.height;
    const offsetX = 40;

    const pegPositions = [];
    const offsetY = 30; // This will move the entire pyramid up by 50 pixels

    for (let row = 0; row < numRows; row++) {
      const numCols = row + 3;
      for (let col = 0; col < numCols; col++) {
        const x =
          boardWidth / 2 - (row * pegSpacing) / 2 + col * pegSpacing - offsetX;
        const y = 100 + row * pegSpacing - offsetY; // Move the pegs up by offsetY
        pegPositions.push({ x, y, radius: pegRadius });
      }
    }
    setPegs(pegPositions);
  };

  const drawPegs = (ctx) => {
    ctx.fillStyle = "#ffffff";
    pegs.forEach(({ x, y, radius }) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawBuckets = (ctx) => {
    const canvasWidth = canvasRef.current.width;
    const bucketWidth = canvasWidth / bucketValues.length;

    const newBucketWidth = canvasWidth / bucketValues.length + 95; // Increase the width of each box
    const gap = 100; // Adjust the gap between boxes

    ctx.fillStyle = "gray";
    bucketValues.forEach((_, index) => {
      const x = index * (newBucketWidth - gap) - 20; // Move the gray boxes to the left by adjusting this value
      ctx.fillRect(x + 10, canvasRef.current.height - 30, newBucketWidth - 20, 30); // Adjusted position of the bucket
    });

    // Draw multipliers inside the gray buckets
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    bucketMultipliers.forEach((multiplier, index) => {
      const x = index * (newBucketWidth - gap) + newBucketWidth / 2 - 20; // Adjusted multiplier text position
      const y = canvasRef.current.height - 7; // Place multiplier text inside the gray box
      ctx.textAlign = "center"; // Center the text
      ctx.fillText(`x${multiplier.toFixed(2)}`, x, y);
    });
  };

  const drawBall = (ctx) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, 10, 0, Math.PI * 2);
    ctx.fill();
  };

  const updateBall = () => {
    const gravity = 0.1;
    const bounceFactor = 0.6;

    ballRef.current.vy += gravity;
    ballRef.current.x += ballRef.current.vx;
    ballRef.current.y += ballRef.current.vy;

    // Define invisible boundary limits
    const leftBoundary = canvasRef.current.width / 2 - pegs.length * 30; // Adjust based on peg arrangement
    const rightBoundary = canvasRef.current.width / 2 + pegs.length * 30;

    // Check for collisions with the boundaries
    if (ballRef.current.x < leftBoundary) {
      ballRef.current.x = leftBoundary;
      ballRef.current.vx *= -bounceFactor; // Reflect velocity
    } else if (ballRef.current.x > rightBoundary) {
      ballRef.current.x = rightBoundary;
      ballRef.current.vx *= -bounceFactor; // Reflect velocity
    }

    // Prevent the ball from leaving the canvas bounds
    if (ballRef.current.y > canvasRef.current.height - 40) {
      if (!ballOnGround) {
        setBallOnGround(true);
        setHasLanded(true);
        checkBucketLanding();
      }
      ballRef.current.y = canvasRef.current.height - 999999999999999999999999999999999999999999;
      ballRef.current.vy = 0;
    }

    // Check for collisions with pegs
    pegs.forEach(({ x, y, radius }) => {
      const dx = ballRef.current.x - x;
      const dy = ballRef.current.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius + 10) {
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(ballRef.current.vx ** 2 + ballRef.current.vy ** 2);
        const normalX = dx / distance;
        const normalY = dy / distance;
        const dotProduct = ballRef.current.vx * normalX + ballRef.current.vy * normalY;

        ballRef.current.vx -= 2 * dotProduct * normalX;
        ballRef.current.vy -= 2 * dotProduct * normalY;
        ballRef.current.vx *= bounceFactor;
        ballRef.current.vy *= bounceFactor;

        const overlap = radius + 10 - distance;
        ballRef.current.x += normalX * overlap * 0.5;
        ballRef.current.y += normalY * overlap * 0.5;
      }
    });
  };

  const checkBucketLanding = () => {
    const bucketWidth = canvasRef.current.width / bucketValues.length;
    let bucketIndex = Math.floor(ballRef.current.x / bucketWidth);

    if (bucketIndex < 0 || bucketIndex >= bucketMultipliers.length) {
      bucketIndex = 0; // Default to the first bucket (2.1x multiplier)
    }

    setCurrentBucketIndex(bucketIndex); // Store the bucket index
    generateMathQuestion(bucketIndex); // Generate the math question based on bucket index
    setAnswerStatus(`Ball landed in ${bucketMultipliers[bucketIndex].toFixed(2)}x multiplier bucket!`);
    setBallDropped(true);
    setHasLanded(true);
    setBallOnGround(true);
  };

  const generateMathQuestion = (bucketIndex) => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const randomType = Math.floor(Math.random() * 2);

    let question = "";
    let answer = 0;

    switch (randomType) {
      case 0:
        question = `What is ${num1} + ${num2}?`;
        answer = num1 + num2;
        break;
      case 1:
        question = `What is ${num1} x ${num2}?`;
        answer = num1 * num2;
        break;
      default:
        break;
    }

    setMathQuestion(question);
    setCorrectAnswer(answer); // Set the base correct answer without multiplying by the multiplier
  };

  const handleAnswer = () => {
    const parsedUserAnswer = parseInt(userAnswer, 10);

    if (parsedUserAnswer === correctAnswer && currentBucketIndex !== null) {
      const multiplier = bucketMultipliers[currentBucketIndex]; // Use stored bucketIndex

      setBalance((prevBalance) => {
        const newBalance = prevBalance * multiplier; // Multiply the current balance by the multiplier
        return parseFloat(newBalance.toFixed(2)); // Ensure correct precision
      });

      setAnswerStatus(`Correct! Multiplied by ${multiplier.toFixed(2)}x multiplier!`);
    } else {
      setAnswerStatus("Wrong! Balance remains the same.");
    }

    setUserAnswer("");
    setMathQuestion("");
  };

  const resetGame = () => {
    setBalance(100); // Reset balance to $100
    setIsDropping(false); // Ensure the ball is not dropping
    setBallDropped(false);
    setAnswerStatus("");
    setMathQuestion("");
    setUserAnswer("");
    setBallOnGround(false);
    setHasLanded(false);
    setCurrentBucketIndex(null); // Reset bucket index
    ballRef.current = { x: canvasRef.current.width / 2, y: 0, vx: 0, vy: 0 }; // Reset ball position
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPegs(ctx);
        drawBuckets(ctx);

        if (ballRef.current && isDropping) {
          drawBall(ctx);
          updateBall();
        }

        requestAnimationFrame(render);
      };

      render();
    }
  }, [isDropping, pegs]);

  useEffect(() => {
    createPegs();
  }, []);

  const dropBall = () => {
    ballRef.current = {
      x: canvasRef.current.width / 2,
      y: 0,
      vx: (Math.random() * 2 - 1) * 2, // Random horizontal velocity
      vy: 0,
    };

    setIsDropping(true);
    setBallDropped(false);
    setHasLanded(false);
    setAnswerStatus("");
    setMathQuestion("");
    setUserAnswer("");
  };

  return (
    <div className="App">
      <div className="plinko-container">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div style={{ position: "absolute", left: "20px", top: "20px" }}>
        <h1 style={{ color: "white", fontFamily: "Arial, sans-serif", fontSize: "24px" }}>
          Plinko Game
        </h1>
        <button onClick={dropBall}>Drop Ball</button>
        {ballDropped && !hasLanded && <p>Ball is dropping...</p>}
        {hasLanded && (
          <div>
            <p>{mathQuestion}</p>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />
            <button onClick={handleAnswer}>Submit Answer</button>
            <p>{answerStatus}</p>
            <p>
              Current Balance: <span style={{ color: "#90EE90" }}>${balance}</span>
            </p>
            <button onClick={resetGame}>Reset Game</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlinkoGame;
