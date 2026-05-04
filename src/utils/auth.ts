/** Decode JWT expiry without a library — parse the base64 payload and check `exp` claim */
export function isTokenValid(): boolean {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
