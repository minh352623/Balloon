import "./styles.css";
import { useState, useEffect } from "react";
import { Centrifuge } from "centrifuge";
import { tapBalloon, initUser, getToken, getPoints } from "./api";

// Component hiển thị điểm số với animation - nhỏ gọn
const PointsDisplay = ({ points, isVisible, onAnimationEnd }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onAnimationEnd();
      }, 300); // Giảm thời gian hiển thị
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationEnd]);

  if (!isVisible) return null;

  return (
    <div className="compact-points-display">
      <span className="compact-points-text">+{points}</span>
    </div>
  );
};

// Component hiệu ứng điểm số bay lên - đơn giản hóa
const FloatingPoints = ({ points, isVisible, onAnimationEnd, position }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onAnimationEnd();
      }, 1500); // Giảm thời gian hiển thị
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationEnd]);

  if (!isVisible) return null;

  return (
    <div
      className="simple-floating-points fixed z-50 pointer-events-none"
      style={{
        left: position?.x || window.innerWidth / 2,
        top: position?.y || window.innerHeight / 2,
      }}
    >
      <div className="simple-points-text">+{points}</div>
    </div>
  );
};

// Component bóng bay tự tạo
const Balloon = ({ id, color, onPop, network, bubbleType, icon }) => {
  const [isPopped, setIsPopped] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [shouldRemove, setShouldRemove] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  // Thay đổi state từ transform về position
  const [position, setPosition] = useState({
    x: Math.random() * (window.innerWidth - 100),
    y: window.innerHeight + 50,
  });

  // Detect iPhone/iOS - di chuyển ra ngoài useEffect
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Xử lý việc xóa bóng bay khi cần với animation mượt
  useEffect(() => {
    if (shouldRemove) {
      setIsFadingOut(true);
      // Delay xóa bóng bay để animation fade out hoàn thành
      setTimeout(() => {
        onPop(id);
      }, 300); // Giảm thời gian để giảm lag
    }
  }, [shouldRemove, id, onPop]);

  // Sửa animation logic
  useEffect(() => {
    let animationId;
    let lastTime = 0;
    let startTime = Date.now();
    let initialX = position.x;
    let initialY = position.y;

    // Tối ưu frame rate cho iOS
    const frameRate = isIOS ? 16 : 33; // 60fps cho iOS, 30fps cho Android

    // Tối ưu cho mobile - sử dụng position với easing
    const animate = (currentTime) => {
      if (currentTime - lastTime >= frameRate) {
        const elapsed = currentTime - startTime;

        setPosition((prev) => {
          // Đơn giản hóa - chỉ di chuyển lên với tốc độ cố định
          const speed = 2; // Tốc độ di chuyển
          const newY = prev.y - speed;

          // Đánh dấu cần xóa bóng bay khi bay ra khỏi màn hình
          if (newY < -100) {
            setShouldRemove(true);
            return prev;
          }

          // Tắt hoàn toàn chuyển động ngang cho iOS
          if (isIOS) {
            return {
              x: prev.x, // Giữ nguyên vị trí X
              y: newY,
            };
          }

          // Chuyển động ngang nhẹ cho Android
          const waveX = Math.sin(elapsed * 0.002) * 2;
          const newX = prev.x + waveX * 0.01;

          return {
            x: newX,
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
  }, [isIOS]);

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
      onPop(id, network, bubbleType, true);
    }, 500);
  };

  if (isPopped) return null;

  return (
    <div
      className={`balloon ${isExploding ? "exploding" : ""}`}
      style={{
        backgroundColor: color,
        position: "fixed",
        zIndex: 1000,
        left: position.x,
        top: position.y,
        transition: isFadingOut
          ? "opacity 0.3s ease-out"
          : isExploding && !isIOS
          ? "transform 0.2s ease-out"
          : "none",
        opacity: isFadingOut ? 0 : 1,
        transform: isExploding && !isIOS ? "scale(1.1)" : "scale(1)",
      }}
      onClick={handleClick}
    >
      {icon?.includes(".") ? (
        <img
          src={icon}
          style={{
            width: "50%",
            height: "50%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
          alt="balloon"
        />
      ) : (
        icon
      )}
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
  const [totalPoints, setTotalPoints] = useState({
    tapPoint: 0,
    totalPoints: 0,
  });
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);

  // State cho hiệu ứng điểm số bay lên từ User device
  const [floatingPoints, setFloatingPoints] = useState([]);
  const supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

  // Giới hạn số bóng bay tối đa để tránh lag - giảm cho mobile
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const MAX_BALLOONS = isIOS ? 10 : 15; // Giảm xuống 5 cho iPhone

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
  ];

  // const contents = ["🎈", "🎉", "��", "🎁", "./tam.jpg", "tam2.jpg"]; // Giảm số lượng emoji, thêm image từ public/images
  // const points = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  let audio = new Audio(
    "https://soundbible.com/mp3/Balloon%20Popping-SoundBible.com-1247261379.mp3"
  );
  const addMoreBalloons = (icon, network, type) => {
    setBalloons((prev) => {
      // Kiểm tra giới hạn số bóng bay với state hiện tại
      console.log("🚀 ~ addMoreBalloons ~ prev.length:", prev.length);
      if (prev.length >= MAX_BALLOONS) {
        return prev; // Return state hiện tại nếu đã đủ
      }

      const newBalloons = [];
      const balloonsToAdd = Math.min(1, MAX_BALLOONS - prev.length);

      for (let i = 0; i < balloonsToAdd; i++) {
        newBalloons.push({
          id: Date.now() + Math.random(),
          color: colors[Math.floor(Math.random() * colors.length)],
          network: network,
          bubbleType: type,
          icon: icon,
        });
      }

      return [...prev, ...newBalloons];
    });
  };

  const handleBalloonPop = (id, network, bubbleType, isSound = false) => {
    // Xóa bóng bay ngay lập tức để tối ưu performance
    setBalloons((prev) => prev.filter((balloon) => balloon.id !== id));

    // Cộng điểm nếu có
    // if (pointsEarned > 0) {
    //   setTotalPoints((prev) => prev + pointsEarned);
    //   setLastPointsEarned(pointsEarned);
    //   setShowPointsAnimation(true);
    // }
    if (isSound) {
      tapBalloon(network, bubbleType);

      audio.play();
    }
  };

  const handlePointsAnimationEnd = () => {
    setShowPointsAnimation(false);
  };

  // Hàm tạo hiệu ứng điểm số bay lên
  const createFloatingPoints = (points, position) => {
    const id = Date.now() + Math.random();
    const newFloatingPoint = {
      id,
      points,
      position: position || {
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 200) + 100,
      },
      isVisible: true,
    };

    setFloatingPoints((prev) => [...prev, newFloatingPoint]);

    // Tự động xóa sau 3 giây
    setTimeout(() => {
      setFloatingPoints((prev) => prev.filter((fp) => fp.id !== id));
    }, 3000);
  };

  const handleFloatingPointsEnd = (id) => {
    setFloatingPoints((prev) => prev.filter((fp) => fp.id !== id));
  };

  const clearAllBalloons = () => {
    setBalloons([]);
  };

  const initSocket = async () => {
    const centrifuge = new Centrifuge(
      "wss://xp-centrifugal-sb.blocktrend.xyz/connection/websocket"
    );

    centrifuge.on("connecting", (ctx) => {
      console.log("Connecting:", ctx);
    });

    centrifuge.on("connected", (ctx) => {
      console.log("Connected:", ctx);
    });

    centrifuge.on("disconnected", (ctx) => {
      console.log("Disconnected:", ctx);
    });

    centrifuge.on("error", (ctx) => {
      console.error("Error:", ctx);
    });
    const deviceId = localStorage.getItem("deviceId");
    const response = await getToken("user:online");
    const response2 = await getToken("user:" + deviceId);

    console.log("🚀 ~ App ~ token:", response);
    console.log("🚀 ~ App ~ token2:", response2);
    const subscriptionOnline = centrifuge.newSubscription("user:online", {
      token: response?.subToken,
    });
    const subscriptionDevice = centrifuge.newSubscription("user:" + deviceId, {
      token: response2?.subToken,
    });

    subscriptionOnline
      .on("publication", (ctx) => {
        // check array data ctx.data
        if (Array.isArray(ctx.data)) {
          ctx.data.forEach((item, index) => {
            setTimeout(() => {
              if (item.type == "survey")
                addMoreBalloons(item.icon, item.key, item.type);
              else addMoreBalloons(item.icon, item.key, item.type);
            }, index * 1000); // Delay 200ms giữa mỗi bóng bay
          });
        }
      })
      .on("subscribing", (ctx) => {
        console.log("Subscribing:", ctx);
      })
      .on("subscribed", (ctx) => {
        console.log("Subscribed:", ctx);
      })
      .on("unsubscribed", (ctx) => {
        console.log("Unsubscribed:", ctx);
      })
      .on("error", (ctx) => {
        console.error("Subscription error:", ctx);
      })
      .subscribe();

    subscriptionDevice
      .on("publication", (ctx) => {
        console.log("User device:", ctx.data);

        // Cập nhật tổng điểm
        setTotalPoints((prev) => ({
          ...prev,
          ...ctx.data,
        }));

        // Tạo hiệu ứng điểm số bay lên nếu có điểm mới
        // if (ctx.data.tapPoint && ctx.data.tapPoint > 0) {
        //   createFloatingPoints(ctx.data.tapPoint);
        // }
      })
      .on("subscribing", (ctx) => {
        console.log("Subscribing:", ctx);
      })
      .on("subscribed", (ctx) => {
        console.log("Subscribed:", ctx);
      })
      .on("unsubscribed", (ctx) => {
        console.log("Unsubscribed:", ctx);
      })
      .on("error", (ctx) => {
        console.error("Subscription error:", ctx);
      })
      .subscribe();

    centrifuge.connect();
  };

  useEffect(async () => {
    const deviceId = window.prompt("Device of you is:");
    await initUser(deviceId);
    const points = await getPoints();
    console.log("🚀 ~ App ~ points:", points);
    let totalPoints = 0;
    for (const point of points) {
      totalPoints += point.points;
    }
    setTotalPoints((prev) => ({
      ...prev,
      totalPoints: totalPoints,
    }));
    await initSocket();
  }, []);

  return (
    <div
      className="App relative"
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    >
      {/* Header với điểm số */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎈 Bóng Bay Game</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-300 text-xl">⭐</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "yellow",
                    padding: "0 8px",
                  }}
                >
                  {totalPoints?.totalPoints || 0}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  điểm
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          {supportsTouch ? (
            <p className="text-gray-700 font-medium">
              👆 Chạm vào bóng bay để nổ và cộng điểm!
            </p>
          ) : (
            <p className="text-gray-700 font-medium">
              🖱️ Click vào bóng bay để nổ và cộng điểm!
            </p>
          )}
        </div>
      </div>

      {/* Component hiển thị điểm số */}
      <PointsDisplay
        points={lastPointsEarned}
        isVisible={showPointsAnimation}
        onAnimationEnd={handlePointsAnimationEnd}
      />

      {/* Component hiệu ứng điểm số bay lên từ User device */}
      {floatingPoints.map((fp) => (
        <FloatingPoints
          key={fp.id}
          points={fp.points}
          isVisible={fp.isVisible}
          position={fp.position}
          onAnimationEnd={() => handleFloatingPointsEnd(fp.id)}
        />
      ))}

      {/* Bóng bay */}
      {balloons.map((balloon) => (
        <Balloon
          key={balloon.id}
          id={balloon.id}
          color={balloon.color}
          network={balloon.network}
          bubbleType={balloon.bubbleType}
          icon={balloon.icon}
          onPop={handleBalloonPop}
        />
      ))}

      {/* Nút reset điểm (tùy chọn) */}
      {/* <div className="absolute bottom-4 right-4 z-30">
        <button
          onClick={() => setTotalPoints(0)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg transition-colors duration-200"
        >
          🔄 Reset điểm
        </button>
      </div> */}
    </div>
  );
}
