import { generateSubToken } from "./token";

const BASE_URL = "https://xp-gateway-sb.blocktrend.xyz/api/v1";
const BASIC_AUTH = "Basic YWRtaW46UTNJNk5IM3RiREVDaEQ1Qmd4ZWQ=";
const tapBalloon = async (network, bubbleType) => {
  try {
    const response = await fetch(`${BASE_URL}/bubble-actions/tap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": localStorage.getItem("deviceId"),
      },
      body: JSON.stringify({ networkSymbol: network, bubbleType: bubbleType }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const initUser = async (deviceId) => {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: BASIC_AUTH,
      },
      body: JSON.stringify({ deviceId: deviceId }),
    });
    const data = await response.json();
    // save local storage
    localStorage.setItem("deviceId", deviceId);
    return data;
  } catch (error) {
    localStorage.setItem("deviceId", deviceId);

    console.log("🚀 ~ initUser ~ error:", error);
  }
};

const getToken = async (channel) => {
  try {
    const response = await fetch(`${BASE_URL}/users/sub-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": localStorage.getItem("deviceId"),
      },
      body: JSON.stringify({
        channel,
      }),
    });
    const data = await response.json();
    return data?.data;
  } catch (error) {
    console.log("🚀 ~ getToken ~ error:", error);
  }
};

const getPoints = async () => {
  try {
    const response = await fetch(`${BASE_URL}/bubble-actions/points`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": localStorage.getItem("deviceId"),
      },
    });
    const data = await response.json();
    console.log("🚀 ~ getPoints ~ data:", data?.data);
    return data?.data;
  } catch (error) {
    console.log("🚀 ~ getPoints ~ error:", error);
  }
};

export { tapBalloon, initUser, getToken, getPoints, BASE_URL };
