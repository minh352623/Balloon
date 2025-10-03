import "./styles.css";
import { useState, useEffect } from "react";

// Component bóng bay tự tạo
const Balloon = ({ id, color, onPop, content }) => {
  const [isPopped, setIsPopped] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [shouldRemove, setShouldRemove] = useState(false);
  const [position, setPosition] = useState({
    x: Math.random() * (window.innerWidth - 100),
    y: window.innerHeight + 50,
  });

  // Xử lý việc xóa bóng bay khi cần
  useEffect(() => {
    if (shouldRemove) {
      onPop(id);
    }
  }, [shouldRemove, id, onPop]);

  useEffect(() => {
    let animationId;
    let lastTime = 0;

    // Sử dụng requestAnimationFrame thay vì setInterval để tối ưu performance
    const animate = (currentTime) => {
      if (currentTime - lastTime >= 16) {
        // ~60fps
        setPosition((prev) => {
          const newY = prev.y - 2; // Giảm tốc độ bay lên

          // Đánh dấu cần xóa bóng bay khi bay ra khỏi màn hình
          if (newY < -100) {
            setShouldRemove(true);
            return prev; // Return current position để tránh update
          }

          return {
            x: prev.x + (Math.random() - 0.5) * 2, // Giảm tốc độ để mượt hơn
            y: newY,
          };
        });
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const handleClick = () => {
    setIsExploding(true);

    // Tạo âm thanh nổ (nếu browser hỗ trợ)
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        50,
        audioContext.currentTime + 0.1
      );

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Fallback nếu không hỗ trợ Web Audio API
      console.log("Pop!");
    }

    // Sau 0.5 giây thì xóa bóng bay
    setTimeout(() => {
      setIsPopped(true);
      onPop(id, true);
    }, 500);
  };

  if (isPopped) return null;

  return (
    <div
      className={`balloon ${isExploding ? "exploding" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: color,
        position: "fixed",
        zIndex: 1000,
      }}
      onClick={handleClick}
    >
      {content?.includes(".") ? <img src={content} alt="balloon" /> : content}
      {isExploding && (
        <div className="explosion">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [balloons, setBalloons] = useState([]);
  const [nextId, setNextId] = useState(1);
  const supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

  // Giới hạn số bóng bay tối đa để tránh lag
  const MAX_BALLOONS = 15;

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
  ];

  const contents = ["🎈", "🎉", "🎊", "🎁", "./tam.jpg"]; // Giảm số lượng emoji, thêm image từ public/images
  const points = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  let audio = new Audio(
    "https://soundbible.com/mp3/Balloon%20Popping-SoundBible.com-1247261379.mp3"
  );
  const addMoreBalloons = () => {
    // Kiểm tra giới hạn số bóng bay
    if (balloons.length >= MAX_BALLOONS) {
      alert(`Tối đa ${MAX_BALLOONS} bóng bay để tránh lag!`);
      return;
    }

    const newBalloons = [];
    const balloonsToAdd = Math.min(1, MAX_BALLOONS - balloons.length);

    for (let i = 0; i < balloonsToAdd; i++) {
      newBalloons.push({
        id: nextId + i,
        color: colors[Math.floor(Math.random() * colors.length)],
        content: contents[Math.floor(Math.random() * contents.length)],
        points: points[Math.floor(Math.random() * points.length)],
      });
    }
    setBalloons((prev) => [...prev, ...newBalloons]);
    setNextId((prev) => prev + balloonsToAdd);
  };

  const handleBalloonPop = (id, isSound = false) => {
    // Xóa bóng bay ngay lập tức để tối ưu performance
    setBalloons((prev) => prev.filter((balloon) => balloon.id !== id));
    if (isSound) {
      audio.play();
    }
  };

  const clearAllBalloons = () => {
    setBalloons([]);
  };

  return (
    <div className="App">
      <h1>Bóng Bay Floating 🎈</h1>
      <div className="controls">
        <button onClick={addMoreBalloons}>Thêm bóng bay mới</button>
        <button onClick={clearAllBalloons} className="clear-btn">
          Xóa tất cả
        </button>
      </div>

      <div className="balloon-counter">
        Bóng bay hiện tại: {balloons.length}/{MAX_BALLOONS}
      </div>

      {supportsTouch ? (
        <h2>Chạm vào bóng bay để nổ 💥</h2>
      ) : (
        <h2>Click vào bóng bay để nổ 💥</h2>
      )}

      {balloons.map((balloon) => (
        <Balloon
          key={balloon.id}
          id={balloon.id}
          color={balloon.color}
          content={balloon.content}
          points={balloon.points}
          onPop={handleBalloonPop}
        />
      ))}
    </div>
  );
}
